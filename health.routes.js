/**
 * src/api/routes/health.routes.js
 *
 * HEALTH ENDPOINTS — WHY YOU NEED BOTH:
 * ========================================
 * Production systems typically need two health endpoints:
 *
 * 1. /health/live (liveness)
 *    "Is the process running?"
 *    Used by Kubernetes/Docker to decide if the container should be RESTARTED.
 *    Should ALWAYS return 200 unless the process is truly broken.
 *    Never include dependency checks here — a Redis outage shouldn't restart your pod.
 *
 * 2. /health/ready (readiness)
 *    "Is this instance ready to receive traffic?"
 *    Used by load balancers to decide if requests should be ROUTED to this pod.
 *    Should check all dependencies (Tally, Redis, DB).
 *    Return 503 if critical dependencies are down — the load balancer will
 *    route traffic to other healthy instances instead.
 *
 * 3. /health (combined, for simple setups)
 *    Returns status of all components in one response.
 *    Used by monitoring dashboards, on-call engineers debugging issues.
 */

'use strict';

const { isTallyOnline, getBreakerStatus } = require('../../connectors/tally/client');
const { createRedisClient } = require('../../cache/redis');

async function healthRoutes(fastify) {

  /**
   * GET /health
   * Comprehensive health check. Returns status of all system components.
   * Not authenticated — monitoring tools need unauthenticated access.
   */
  fastify.get('/health', async (request, reply) => {
    const startTime = Date.now();
    const checks = {};

    // ---- Tally health ----
    // We check the circuit breaker first — if it's OPEN, we know Tally is down
    // without making a live HTTP call (which would be slow)
    const breakerStatus = getBreakerStatus();
    if (breakerStatus.state === 'OPEN') {
      checks.tally = {
        status: 'unhealthy',
        reason: 'Circuit breaker is OPEN',
        breaker: breakerStatus,
      };
    } else {
      const tallyUp = await isTallyOnline();
      checks.tally = {
        status: tallyUp ? 'healthy' : 'unhealthy',
        breaker: breakerStatus,
      };
    }

    // ---- Redis health ----
    try {
      const redis = createRedisClient();
      await redis.ping();
      checks.redis = { status: 'healthy' };
    } catch (err) {
      checks.redis = { status: 'unhealthy', reason: err.message };
    }

    // Overall status: healthy only if all CRITICAL components are up
    // Redis is degraded (not unhealthy) — we can survive without it
    const isCriticalHealthy = checks.tally.status === 'healthy';
    const overallStatus = isCriticalHealthy ? 'healthy' : 'degraded';

    const statusCode = isCriticalHealthy ? 200 : 503;

    return reply.code(statusCode).send({
      status: overallStatus,
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  /**
   * GET /health/live
   * Liveness probe — just checks the process is running.
   * Always 200 unless the Node.js event loop is blocked.
   */
  fastify.get('/health/live', async () => ({
    status: 'alive',
    timestamp: new Date().toISOString(),
  }));

  /**
   * GET /health/ready
   * Readiness probe — checks if instance can handle requests.
   */
  fastify.get('/health/ready', async (request, reply) => {
    const tallyUp = await isTallyOnline();

    if (!tallyUp) {
      return reply.code(503).send({
        status: 'not_ready',
        reason: 'Tally is not reachable',
      });
    }

    return { status: 'ready', timestamp: new Date().toISOString() };
  });
}

module.exports = healthRoutes;
