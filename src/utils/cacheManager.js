/**
 * src/cache/cacheManager.js
 *
 * WHY A CACHE MANAGER WRAPPER:
 * -----------------------------
 * Calling Redis directly throughout the codebase couples everything to ioredis.
 * If you switch to Memcached or an in-memory map (for testing), you'd need
 * to update every call site.
 *
 * This wrapper also:
 * 1. Handles JSON serialization/deserialization
 * 2. Handles Redis connection failures gracefully (cache miss, not crash)
 * 3. Provides a clean interface for pattern-based deletion
 *
 * IMPORTANT: Cache failures must NEVER crash the application.
 * If Redis is down, we fall through to Tally. The system is degraded but alive.
 * This is why every method has a try/catch that logs + returns null/false.
 */

'use strict';

const logger = require('../config/logger');
let redis; // Lazy-loaded to avoid startup failures if Redis is not ready yet

function getRedis() {
  if (!redis) {
    const { createRedisClient } = require('./redis');
    redis = createRedisClient();
  }
  return redis;
}

/**
 * Get a cached value by key.
 *
 * @param {string} key
 * @returns {Promise<object|null>} Parsed JSON value or null if miss/error
 */
async function get(key) {
  try {
    const value = await getRedis().get(key);
    if (value === null) return null; // Cache miss
    return JSON.parse(value);
  } catch (err) {
    // Log but don't throw — cache failure is non-fatal
    logger.warn({ key, error: err.message }, 'Cache GET failed — falling through to source');
    return null;
  }
}

/**
 * Set a value in the cache with a TTL.
 *
 * @param {string} key
 * @param {object} value - Will be JSON-serialized
 * @param {number} [ttlSeconds=300]
 * @returns {Promise<boolean>} true if stored successfully
 */
async function set(key, value, ttlSeconds = 300) {
  try {
    const serialized = JSON.stringify(value);
    // EX sets the TTL in seconds
    await getRedis().set(key, serialized, 'EX', ttlSeconds);
    return true;
  } catch (err) {
    logger.warn({ key, error: err.message }, 'Cache SET failed — continuing without caching');
    return false;
  }
}

/**
 * Delete a specific cache key.
 *
 * @param {string} key
 * @returns {Promise<boolean>}
 */
async function del(key) {
  try {
    await getRedis().del(key);
    return true;
  } catch (err) {
    logger.warn({ key, error: err.message }, 'Cache DEL failed');
    return false;
  }
}

/**
 * Delete all cache keys matching a glob pattern.
 * Uses SCAN (not KEYS) to avoid blocking Redis on large datasets.
 *
 * WHY SCAN not KEYS:
 * KEYS blocks Redis while iterating all keys — dangerous in production.
 * SCAN iterates incrementally, returning a cursor each call.
 *
 * @param {string} pattern - e.g. "tally:ledgers:*"
 * @returns {Promise<number>} Number of keys deleted
 */
async function deletePattern(pattern) {
  let cursor = '0';
  let deleted = 0;
  const client = getRedis();

  try {
    do {
      // SCAN returns [nextCursor, [matching keys]]
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        await client.del(...keys); // Delete matched keys in bulk
        deleted += keys.length;
      }
    } while (cursor !== '0'); // cursor === '0' means scan is complete

    return deleted;
  } catch (err) {
    logger.warn({ pattern, error: err.message }, 'Cache pattern delete failed');
    return 0;
  }
}

module.exports = { get, set, del, deletePattern };
