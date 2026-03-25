/**
 * src/services/connectors/tally.client.js
 *
 * Refactored from the original tally.client.js to work with the current service structure
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

// Circuit Breaker State
const breaker = {
  failures: 0,
  state: 'CLOSED',
  openedAt: null,
  FAILURE_THRESHOLD: 5,
  RECOVERY_TIMEOUT_MS: 30_000,
};

function checkCircuitBreaker() {
  if (breaker.state === 'CLOSED') return;

  if (breaker.state === 'OPEN') {
    const elapsed = Date.now() - breaker.openedAt;
    if (elapsed >= breaker.RECOVERY_TIMEOUT_MS) {
      breaker.state = 'HALF_OPEN';
      logger.info({ breaker: breaker.state }, 'Circuit breaker entering HALF_OPEN');
      return;
    }
    const nextRetryAt = new Date(breaker.openedAt + breaker.RECOVERY_TIMEOUT_MS).toISOString();
    throw new CircuitBreakerOpenError(nextRetryAt);
  }
}

function recordSuccess() {
  if (breaker.state !== 'CLOSED') {
    logger.info({ previousState: breaker.state }, 'Circuit breaker CLOSED');
  }
  breaker.failures = 0;
  breaker.state = 'CLOSED';
  breaker.openedAt = null;
}

function recordFailure() {
  breaker.failures += 1;

  if (breaker.state === 'HALF_OPEN') {
    breaker.state = 'OPEN';
    breaker.openedAt = Date.now();
    logger.error('Circuit breaker re-OPENED');
    return;
  }

  if (breaker.failures >= breaker.FAILURE_THRESHOLD) {
    breaker.state = 'OPEN';
    breaker.openedAt = Date.now();
    logger.error(
      { failures: breaker.failures, threshold: breaker.FAILURE_THRESHOLD },
      'Circuit breaker OPENED'
    );
  }
}

const tallyHttp = axios.create({
  baseURL: config.tally?.baseUrl || 'http://localhost:9000',
  timeout: config.tally?.timeoutMs || 10000,
  headers: {
    'Content-Type': 'text/xml;charset=utf-8',
    'Accept': 'text/xml',
  },
  responseType: 'text',
});

async function sendToTally(xmlPayload, options = {}) {
  const { retryCount = 0 } = options;
  const maxRetries = config.tally?.maxRetries || 3;

  checkCircuitBreaker();

  const requestLog = {
    attempt: retryCount + 1,
    maxAttempts: maxRetries + 1,
    payloadLength: xmlPayload.length,
  };

  logger.debug(requestLog, 'Sending request to Tally');
  const startTime = Date.now();

  try {
    const response = await tallyHttp.post('/', xmlPayload);
    const duration = Date.now() - startTime;

    logger.debug({ ...requestLog, duration, status: response.status }, 'Tally response received');
    recordSuccess();

    // Check for TDL errors in response
    if (response.data.includes('TDL Error!')) {
      throw new Error(`TDL Error detected: ${extractTdlError(response.data)}`);
    }

    return response.data;

  } catch (error) {
    const duration = Date.now() - startTime;

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

    const canRetry = (isTimeout || isOffline) && retryCount < maxRetries;

    if (canRetry) {
      const backoffMs = Math.min(500 * Math.pow(2, retryCount), 4000);
      logger.info({ ...requestLog, backoffMs }, `Retrying Tally request in ${backoffMs}ms`);

      await new Promise(resolve => setTimeout(resolve, backoffMs));
      return sendToTally(xmlPayload, { retryCount: retryCount + 1 });
    }

    recordFailure();

    if (isTimeout) {
      throw new TallyTimeoutError(config.tally?.timeoutMs || 10000);
    }

    if (isOffline) {
      throw new TallyOfflineError('localhost', '9000', error);
    }

    throw error;
  }
}

function extractTdlError(xmlResponse) {
  const tdlErrorMatch = xmlResponse.match(/TDL Error![\s\S]*?(?=\n|$)/);
  return tdlErrorMatch ? tdlErrorMatch[0].trim() : 'Unknown TDL Error';
}

async function isTallyOnline() {
  const pingXml = `<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>List of Companies</REPORTNAME></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`;

  try {
    await sendToTally(pingXml);
    return true;
  } catch {
    return false;
  }
}

function getBreakerStatus() {
  return {
    state: breaker.state,
    failures: breaker.failures,
    openedAt: breaker.openedAt ? new Date(breaker.openedAt).toISOString() : null,
    threshold: breaker.FAILURE_THRESHOLD,
  };
}

module.exports = { sendToTally, isTallyOnline, getBreakerStatus };
