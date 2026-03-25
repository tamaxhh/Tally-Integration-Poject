/**
 * src/routes/health.routes.js
 *
 * Health check routes for monitoring and load balancers
 */

'use strict';

/**
 * Register health check routes
 * @param {FastifyInstance} fastify - Fastify server instance
 */
async function healthRoutes(fastify) {
  
  // Basic health check
  fastify.get('/live', async (request, reply) => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  });

  // Readiness check (could include database checks)
  fastify.get('/ready', async (request, reply) => {
    return { 
      status: 'ready', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  });

  // Combined health endpoint
  fastify.get('/', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    };
  });
}

module.exports = healthRoutes;
