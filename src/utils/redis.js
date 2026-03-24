/**
 * src/cache/redis.js
 *
 * WHY ioredis over the official 'redis' package:
 * - Built-in support for cluster mode (for scaling later)
 * - Built-in retry/reconnection logic
 * - Better TypeScript types
 * - SCAN, pipeline, and Lua scripting support
 */

'use strict';

const Redis = require('ioredis');
const config = require('../config');
const logger = require('../config/logger');

let client = null;

function createRedisClient() {
  if (client) return client; // Singleton — return existing connection

  client = new Redis(config.redis.url, {
    // Retry connection with exponential backoff — up to 30s between retries
    retryStrategy(times) {
      const delay = Math.min(times * 500, 30_000);
      logger.warn({ attempt: times, nextRetryMs: delay }, 'Redis reconnecting...');
      return delay;
    },
    // Don't crash the app if Redis is down at startup — just log
    lazyConnect: true,
    enableReadyCheck: true,
    maxRetriesPerRequest: 1, // Fail fast per request — don't queue up retries
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.error({ error: err.message }, 'Redis error'));
  client.on('close', () => logger.warn('Redis connection closed'));

  return client;
}

module.exports = { createRedisClient };
