/**
 * src/connectors/tally/client.js
 *
 * THE MOST CRITICAL FILE IN THE SYSTEM.
 * ---------------------------------------
 * This module is the only place in the entire codebase that talks to Tally.
 * Everything flows through here. It has three responsibilities:
 *
 * 1. SEND: POST XML to Tally's HTTP server on port 9000
 * 2. RETRY: Tally occasionally has transient hiccups — retry with backoff
 * 3. CIRCUIT BREAKER: If Tally fails repeatedly, stop retrying for a cooldown
 *    period to avoid cascading failures in your own system.
 *
 * HOW TALLY'S API WORKS:
 * ----------------------
 * Tally's HTTP server accepts POST requests to http://localhost:9000
 * The request body is XML (the "Tally XML request envelope").
 * The response is also XML (Tally's response envelope).
 * There's no auth on Tally's side — it trusts localhost connections by default.
 * Content-Type is typically text/xml.
 *
 * CIRCUIT BREAKER PATTERN:
 * ------------------------
 * Without this, if Tally goes offline:
 *   - Every API request tries to connect → waits for timeout (5s) → fails
 *   - Under load, this means hundreds of threads hanging waiting for Tally
 *   - Your server becomes unresponsive even though the problem is in Tally
 *
 * With a circuit breaker:
 *   - After N consecutive failures, the breaker "opens"
 *   - While open, requests fail immediately without trying Tally
 *   - After a cooldown, the breaker "half-opens" and tries one request
 *   - If it succeeds, the breaker closes and normal operation resumes
 */

'use strict';

const axios = require('axios');
const config = require('../../config');
const logger = require('../../config/logger');
const {
  TallyOfflineError,
  TallyTimeoutError,
  CircuitBreakerOpenError,
} = require('../../utils/errors');

// ============================================================
// Circuit Breaker State
// ============================================================
// This is module-level state — shared across all calls in this process.
// In a multi-process deployment (cluster mode), each worker has its own breaker.
// For shared state, you'd put this in Redis.

const breaker = {
  failures: 0,          // Consecutive failure count
  state: 'CLOSED',      // CLOSED = normal | OPEN = failing | HALF_OPEN = testing
  openedAt: null,       // Timestamp when the breaker opened
  FAILURE_THRESHOLD: 5, // Open after this many consecutive failures
  RECOVERY_TIMEOUT_MS: 30_000, // Try again after 30 seconds
};

/**
 * Check if the circuit breaker allows the request to proceed.
 * Updates state transitions (OPEN → HALF_OPEN when recovery timeout expires).
 */
function checkCircuitBreaker() {
  if (breaker.state === 'CLOSED') return; // All good

  if (breaker.state === 'OPEN') {
    const elapsed = Date.now() - breaker.openedAt;
    if (elapsed >= breaker.RECOVERY_TIMEOUT_MS) {
      // Recovery timeout has passed — try one probe request
      breaker.state = 'HALF_OPEN';
      logger.info({ breaker: breaker.state }, 'Circuit breaker entering HALF_OPEN — probing Tally');
      return; // Allow this one through
    }
    // Still in cooldown — reject immediately
    const nextRetryAt = new Date(breaker.openedAt + breaker.RECOVERY_TIMEOUT_MS).toISOString();
    throw new CircuitBreakerOpenError(nextRetryAt);
  }

  // HALF_OPEN: one request is already probing — let it through
}

/**
 * Record a successful Tally response. Resets the circuit breaker.
 */
function recordSuccess() {
  if (breaker.state !== 'CLOSED') {
    logger.info({ previousState: breaker.state }, 'Circuit breaker CLOSED — Tally is healthy');
  }
  breaker.failures = 0;
  breaker.state = 'CLOSED';
  breaker.openedAt = null;
}

/**
 * Record a Tally failure. Opens the circuit breaker if threshold reached.
 */
function recordFailure() {
  breaker.failures += 1;

  if (breaker.state === 'HALF_OPEN') {
    // The probe request failed — reopen immediately
    breaker.state = 'OPEN';
    breaker.openedAt = Date.now();
    logger.error('Circuit breaker re-OPENED — probe request failed');
    return;
  }

  if (breaker.failures >= breaker.FAILURE_THRESHOLD) {
    breaker.state = 'OPEN';
    breaker.openedAt = Date.now();
    logger.error(
      { failures: breaker.failures, threshold: breaker.FAILURE_THRESHOLD },
      'Circuit breaker OPENED — too many Tally failures'
    );
  }
}

// ============================================================
// Axios instance
// ============================================================
// We create a dedicated Axios instance for Tally.
// This lets us set Tally-specific defaults without affecting other HTTP calls.

const tallyHttp = axios.create({
  baseURL: config.tally.baseUrl,
  timeout: config.tally.timeoutMs,
  headers: {
    // Tally expects the content type to be text/xml
    'Content-Type': 'text/xml;charset=utf-8',
    // Some Tally versions check this header
    'Accept': 'text/xml',
  },
  // Return the raw XML string, not a parsed object
  // Axios would try to parse it as JSON otherwise
  responseType: 'text',
});

// ============================================================
// Core send function
// ============================================================

/**
 * Send an XML request to Tally and return the raw XML response string.
 *
 * @param {string} xmlPayload - The complete Tally XML request envelope
 * @param {object} [options]
 * @param {number} [options.retryCount] - Internal: current retry attempt (don't set manually)
 * @returns {Promise<string>} Raw XML response from Tally
 */
async function sendToTally(xmlPayload, options = {}) {
  const { retryCount = 0 } = options;

  // Before attempting, check the circuit breaker
  checkCircuitBreaker();

  const requestLog = {
    attempt: retryCount + 1,
    maxAttempts: config.tally.maxRetries + 1,
    tallyUrl: config.tally.baseUrl,
    payloadLength: xmlPayload.length,
  };

  logger.debug(requestLog, 'Sending request to Tally');
  const startTime = Date.now();

  try {
    // Tally's XML API always uses POST to the root path "/"
    const response = await tallyHttp.post('/', xmlPayload);
    const duration = Date.now() - startTime;

    logger.debug({ ...requestLog, duration, status: response.status }, 'Tally response received');

    // Record success to reset the circuit breaker
    recordSuccess();

    return response.data; // Raw XML string

  } catch (error) {
    const duration = Date.now() - startTime;

    // ---- Axios error taxonomy ----
    // error.code === 'ECONNREFUSED' → Tally not running / port not open
    // error.code === 'ECONNRESET'   → Connection dropped mid-request
    // error.code === 'ENOTFOUND'    → DNS failure (wrong hostname)
    // error.response               → Tally responded with non-2xx HTTP status
    // axios.isAxiosError(error) && !error.response → Network-level failure

    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    const isOffline = ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'EHOSTUNREACH'].includes(error.code);

    logger.warn({
      ...requestLog,
      duration,
      errorCode: error.code,
      errorMessage: error.message,
      isTimeout,
      isOffline,
    }, 'Tally request failed');

    // ---- Retry logic ----
    // Only retry on transient network errors, not on application-level errors.
    // Don't retry if we've hit the max retry count.
    const canRetry = (isTimeout || isOffline) && retryCount < config.tally.maxRetries;

    if (canRetry) {
      // Exponential backoff: 500ms, then 1000ms, then 2000ms...
      // This prevents hammering a struggling Tally with immediate retries
      const backoffMs = Math.min(500 * Math.pow(2, retryCount), 4000);
      logger.info({ ...requestLog, backoffMs }, `Retrying Tally request in ${backoffMs}ms`);

      await new Promise(resolve => setTimeout(resolve, backoffMs));
      return sendToTally(xmlPayload, { retryCount: retryCount + 1 });
    }

    // All retries exhausted — record failure and throw appropriate error
    recordFailure();

    if (isTimeout) {
      throw new TallyTimeoutError(config.tally.timeoutMs);
    }

    if (isOffline) {
      throw new TallyOfflineError(config.tally.host, config.tally.port, error);
    }

    // Unknown error — rethrow with context
    error.message = `Tally HTTP error: ${error.message}`;
    throw error;
  }
}

/**
 * Quick health check — send minimal XML to see if Tally responds.
 * Used by the /health endpoint and before background sync jobs.
 *
 * @returns {Promise<boolean>} true if Tally is reachable
 */
async function isTallyOnline() {
  // This XML asks Tally for the list of company names — it's the lightest possible request
  const pingXml = `<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>List of Companies</REPORTNAME></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`;

  try {
    await sendToTally(pingXml);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the current circuit breaker state for monitoring/health endpoints.
 */
function getBreakerStatus() {
  return {
    state: breaker.state,
    failures: breaker.failures,
    openedAt: breaker.openedAt ? new Date(breaker.openedAt).toISOString() : null,
    threshold: breaker.FAILURE_THRESHOLD,
  };
}

module.exports = { sendToTally, isTallyOnline, getBreakerStatus };
