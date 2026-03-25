/**
 * src/api/server.js
 *
 * FASTIFY SERVER SETUP — PLUGIN ARCHITECTURE
 * ============================================
 * Fastify uses a plugin system where everything (routes, middleware, decorators)
 * is a plugin. This gives you:
 * - Encapsulation: plugins can have their own scope
 * - Composability: register the same server config in tests without side effects
 * - Lifecycle hooks: onRequest, preSerialization, onSend, etc.
 *
 * WHY WE EXPORT buildServer() instead of starting the server directly:
 * -----------------------------------------------------------------------
 * This pattern separates "building the server" from "starting the server".
 * Tests can call buildServer() and pass the Fastify instance to supertest
 * without actually binding to a port. The entry point (src/index.js) handles
 * the actual listen() call.
 */

'use strict';

const fastify = require('fastify');
const config = require('../config');
const logger = require('./config/logger');
const { authMiddleware } = require('./middleware/auth.middleware');
const { errorHandler } = require('./middleware/errorHandler.middleware');

// Route handlers
const ledgerRoutes = require('./routes/ledger.routes');
// const voucherRoutes = require('./routes/voucher.routes');
// const reportRoutes = require('./routes/report.routes');
const healthRoutes = require('./routes/health.routes');

/**
 * Build and configure the Fastify server instance.
 * Does NOT start listening — call server.listen() separately.
 *
 * @returns {FastifyInstance}
 */
async function buildServer() {
  const server = fastify({
    // Use our Pino logger directly — Fastify has first-class Pino support
    logger,
    // Generate unique request IDs — invaluable for tracing requests in logs
    genReqId: () => require('crypto').randomUUID(),
    // Allow Fastify's serializer to handle BigInt (common in financial data)
    // Without this, JSON.stringify throws on BigInt values
    disableRequestLogging: false,
  });

  // ============================================================
  // Security plugins
  // ============================================================

  // helmet sets security headers: X-Content-Type-Options, X-Frame-Options, etc.
  await server.register(require('@fastify/helmet'), {
    // CSP is not needed for a pure JSON API
    contentSecurityPolicy: false,
  });

  // CORS — configure which origins can call your API
  await server.register(require('@fastify/cors'), {
    // In production, set this to your actual frontend domain(s)
    origin: config.isDev ? true : (process.env.CORS_ORIGIN || false),
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  // ============================================================
  // Rate limiting
  // ============================================================
  // Prevents abuse and protects Tally from being overwhelmed.
  // 100 requests per minute per IP is generous for a data API.
  // Rate limiting with simple configuration
  await server.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: 60000, // 1 minute
    errorResponseBuilder: (request, context) => ({
      error: 'TooManyRequests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      limit: context.max,
      remaining: 0,
    }),
  });

  // ============================================================
  // Global middleware (hooks)
  // ============================================================

  // Auth runs on EVERY request before route handlers
  server.addHook('onRequest', authMiddleware);

  // ============================================================
  // Global error handler
  // ============================================================
  server.setErrorHandler(errorHandler);

  // 404 handler — when no route matches
  server.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: 'NotFound',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  // ============================================================
  // Routes — register with prefix for clean URL structure
  // ============================================================
  // All routes are versioned under /api/v1/
  // This lets you introduce /api/v2/ later without breaking existing clients

  const API_PREFIX = '/api/v1';

  await server.register(healthRoutes);                          // /health (no prefix — monitoring needs simple URL)
  await server.register(ledgerRoutes, { prefix: API_PREFIX });  // /api/v1/ledgers
  // await server.register(voucherRoutes, { prefix: API_PREFIX }); // /api/v1/vouchers
  // await server.register(reportRoutes, { prefix: API_PREFIX });  // /api/v1/reports

  // ============================================================
  // Graceful shutdown
  // ============================================================
  // On SIGTERM (Docker stop, k8s pod termination), finish in-flight requests
  // before closing. Without this, you drop requests during deployments.

  const gracefulShutdown = async (signal) => {
    logger.info({ signal }, 'Shutdown signal received — closing gracefully');
    try {
      await server.close();
      logger.info('Server closed cleanly');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
}

module.exports = { buildServer };
