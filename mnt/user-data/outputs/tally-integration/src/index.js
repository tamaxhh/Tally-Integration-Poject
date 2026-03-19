/**
 * src/index.js
 *
 * APPLICATION ENTRY POINT
 * ========================
 * This file's only job is to start the application.
 * It does NOT contain business logic or server configuration.
 *
 * WHY SEPARATE server.js FROM index.js:
 * ----------------------------------------
 * server.js builds the Fastify app (routes, plugins, middleware).
 * index.js starts listening and launches background jobs.
 *
 * This separation means your test suite can import server.js and inject
 * a test client WITHOUT actually binding to port 3000. No port conflicts
 * in CI, no "address already in use" errors.
 */

'use strict';

const { buildServer } = require('./api/server');
const { startScheduler } = require('./jobs/scheduler');
const config = require('./config');
const logger = require('./config/logger');

async function main() {
  logger.info({ env: config.env, version: process.env.npm_package_version || '1.0.0' },
    'Starting Tally Integration Service');

  try {
    // 1. Build the Fastify app (register routes, plugins, middleware)
    const server = await buildServer();

    // 2. Start listening for HTTP requests
    const address = await server.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info({ address }, 'Server listening');

    // 3. Start background sync jobs AFTER server is ready
    // This ensures the server is accepting health checks before jobs start
    startScheduler();

    logger.info('System ready ✓');

  } catch (error) {
    logger.fatal({ error: error.message, stack: error.stack }, 'Failed to start server');
    process.exit(1);
  }
}

// Unhandled rejections should be fatal — silent failures are dangerous
process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error: error.message, stack: error.stack }, 'Uncaught exception');
  process.exit(1);
});

main();
