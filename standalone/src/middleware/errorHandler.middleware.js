/**
 * src/api/middleware/errorHandler.js
 *
 * GLOBAL ERROR HANDLER — THE LAST LINE OF DEFENSE
 * =================================================
 * Every unhandled error in Fastify flows through this handler.
 * Its job is simple but critical:
 *   1. Map custom error types → correct HTTP status codes
 *   2. Return a consistent JSON error shape every time
 *   3. Log errors with the right severity
 *   4. Never expose internal stack traces to API consumers
 *
 * WHY CONSISTENT ERROR SHAPES MATTER:
 * --------------------------------------
 * If your API returns different error formats depending on where it fails
 * (Fastify validation errors vs your AppError vs uncaught exceptions),
 * clients have to write complex error-handling code. A single canonical
 * shape means clients only need to handle one format:
 *
 * {
 *   "error": "string error code",
 *   "message": "human-readable description",
 *   "details": { ... }    // optional, only in dev or for validation errors
 * }
 */

'use strict';

const { AppError } = require('../utils/errors');

/**
 * Fastify error handler.
 * Register with: fastify.setErrorHandler(errorHandler)
 *
 * @param {Error} error
 * @param {FastifyRequest} request
 * @param {FastifyReply} reply
 */
async function errorHandler(error, request, reply) {
  // Fastify's built-in validation errors (from JSON Schema on routes)
  // have a statusCode of 400 and a validation array
  if (error.validation) {
    return reply.code(400).send({
      error: 'ValidationError',
      message: 'Request validation failed',
      details: error.validation.map(v => ({
        field: v.instancePath || v.schemaPath,
        message: v.message,
      })),
    });
  }

  // Our custom application errors — these have structured data and known status codes
  if (error instanceof AppError) {
    const level = error.statusCode >= 500 ? 'error' : 'warn';
    request.log[level](
      { statusCode: error.statusCode, errorType: error.name, details: error.details },
      error.message
    );

    return reply.code(error.statusCode).send({
      error: error.name,
      message: error.message,
      // Include details in development for easier debugging
      // In production, details can reveal internal system info — be careful
      details: process.env.NODE_ENV !== 'production' ? error.details : undefined,
    });
  }

  // Axios HTTP errors (e.g., Tally returned non-2xx unexpectedly)
  if (error.isAxiosError) {
    request.log.error(
      { statusCode: error.response?.status, url: error.config?.url },
      'Unexpected HTTP error from Tally'
    );
    return reply.code(502).send({
      error: 'BadGateway',
      message: 'Received unexpected response from Tally',
    });
  }

  // Completely unexpected errors — log with full stack trace
  request.log.error({ err: error }, 'Unhandled error');

  return reply.code(500).send({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    // Never expose stack traces to API consumers in production
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
  });
}

module.exports = { errorHandler };
