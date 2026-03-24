/**
 * src/utils/errors.js
 *
 * WHY CUSTOM ERROR CLASSES:
 * --------------------------
 * Generic Error objects force you to parse error messages to understand what went wrong.
 * Custom error classes let you:
 * 1. Handle errors by type: `catch (e) { if (e instanceof TallyOfflineError) { ... } }`
 * 2. Attach structured metadata (HTTP status code, Tally error details)
 * 3. Write a global error handler that maps error types → HTTP responses cleanly
 *
 * This is the foundation of reliable error handling. Every thrown error in this
 * system should be one of these classes, not a plain `throw new Error(...)`.
 */

'use strict';

/**
 * Base class for all application errors.
 * Adds a statusCode field so our global error handler can map it to HTTP.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details; // Additional structured context
    // Preserve proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Thrown when Tally is unreachable (offline, port closed, firewall).
 * Results in HTTP 503 Service Unavailable.
 */
class TallyOfflineError extends AppError {
  constructor(host, port, cause = null) {
    super(
      `Tally is not reachable at ${host}:${port}. Ensure Tally is running and ODBC server is enabled.`,
      503,
      { host, port, cause: cause?.message }
    );
  }
}

/**
 * Thrown when Tally responds but returns an error in its XML.
 * Tally embeds errors inside XML — this surfaces them cleanly.
 */
class TallyResponseError extends AppError {
  constructor(tallyError, xmlSnippet = null) {
    super(`Tally returned an error: ${tallyError}`, 502, { tallyError, xmlSnippet });
  }
}

/**
 * Thrown when an XML response from Tally cannot be parsed.
 * Could mean Tally sent malformed XML or an unexpected schema.
 */
class XmlParseError extends AppError {
  constructor(message, rawXml = null) {
    super(`Failed to parse Tally XML response: ${message}`, 502, {
      hint: 'The XML response from Tally may be malformed or schema has changed',
      rawXml: rawXml ? rawXml.substring(0, 500) : null, // Only log first 500 chars
    });
  }
}

/**
 * Thrown when a request exceeds the configured timeout.
 * Tally can be slow under load — we don't want our API to hang forever.
 */
class TallyTimeoutError extends AppError {
  constructor(timeoutMs) {
    super(`Tally request timed out after ${timeoutMs}ms`, 504, { timeoutMs });
  }
}

/**
 * Thrown when the circuit breaker is open.
 * After repeated failures, we stop hammering Tally and serve stale data instead.
 */
class CircuitBreakerOpenError extends AppError {
  constructor(nextRetryAt) {
    super('Tally connector circuit breaker is open. Too many recent failures.', 503, {
      nextRetryAt,
      hint: 'The system will automatically retry after the cooldown period',
    });
  }
}

/**
 * Thrown for invalid API input (bad query params, missing fields).
 * Results in HTTP 400.
 */
class ValidationError extends AppError {
  constructor(message, fieldErrors = null) {
    super(message, 400, { fieldErrors });
  }
}

module.exports = {
  AppError,
  TallyOfflineError,
  TallyResponseError,
  XmlParseError,
  TallyTimeoutError,
  CircuitBreakerOpenError,
  ValidationError,
};
