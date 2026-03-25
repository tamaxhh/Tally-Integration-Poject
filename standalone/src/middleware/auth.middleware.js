/**
 * src/api/middleware/auth.js
 *
 * API KEY AUTHENTICATION — WHY THIS APPROACH:
 * --------------------------------------------
 * Options we considered:
 * 1. JWT tokens    → Great for user-facing apps, overkill for server-to-server
 * 2. OAuth 2.0     → Standard but complex; needs identity provider
 * 3. API Keys      → Simple, fast, perfect for internal/B2B APIs
 *
 * API keys win for this use case because:
 * - Tally integration is typically consumed by internal services
 * - No user authentication needed (it's a data API, not a user API)
 * - O(1) Set.has() lookup — no database round-trip per request
 *
 * IMPROVEMENT for production: Use a database + rotate keys. The current
 * implementation stores keys in memory (from env vars), which means
 * key rotation requires a service restart.
 */

'use strict';

const config = require('../config');

/**
 * Fastify hook that validates the X-API-Key header on every request.
 * Registers as a global onRequest hook in server.js.
 *
 * @param {FastifyRequest} request
 * @param {FastifyReply} reply
 */
async function authMiddleware(request, reply) {
  // Skip auth for health check — monitoring systems need unauthenticated access
  if (request.routerPath === '/health' || request.routerPath === '/') {
    return;
  }

  const apiKey = request.headers['x-api-key'];

  if (!apiKey) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Missing X-API-Key header',
    });
  }

  if (!config.auth.apiKeys.has(apiKey)) {
    // Log failed auth attempts — useful for detecting key exposure
    request.log.warn({ ip: request.ip, path: request.url }, 'Invalid API key attempt');
    return reply.code(403).send({
      error: 'Forbidden',
      message: 'Invalid API key',
    });
  }
}

module.exports = { authMiddleware };
