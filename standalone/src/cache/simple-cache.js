/**
 * src/cache/simple-cache.js
 *
 * Simple in-memory cache for development/testing
 * In production, replace with Redis-based cache
 */

'use strict';

const logger = require('../config/logger');

class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Get value from cache
   * @param {string} key 
   * @returns {Promise<any|null>}
   */
  async get(key) {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.timers.delete(key);
      return null;
    }

    logger.debug({ key }, 'Cache hit');
    return item.value;
  }

  /**
   * Set value in cache with TTL
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlSeconds 
   * @returns {Promise<void>}
   */
  async set(key, value, ttlSeconds = 300) {
    const expiry = Date.now() + (ttlSeconds * 1000);
    
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set new value
    this.cache.set(key, { value, expiry });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
      logger.debug({ key }, 'Cache entry expired');
    }, ttlSeconds * 1000);

    this.timers.set(key, timer);
    logger.debug({ key, ttlSeconds }, 'Cache set');
  }

  /**
   * Delete key from cache
   * @param {string} key 
   * @returns {Promise<boolean>}
   */
  async delete(key) {
    const deleted = this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    logger.debug({ key, deleted }, 'Cache delete');
    return deleted;
  }

  /**
   * Delete keys matching a pattern
   * @param {string} pattern 
   * @returns {Promise<number>} Number of deleted keys
   */
  async deletePattern(pattern) {
    let deleted = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        await this.delete(key);
        deleted++;
      }
    }

    logger.debug({ pattern, deleted }, 'Cache pattern delete');
    return deleted;
  }

  /**
   * Clear all cache
   * @returns {Promise<void>}
   */
  async clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.cache.clear();
    this.timers.clear();
    logger.debug('Cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {object}
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create singleton instance
const simpleCache = new SimpleCache();

module.exports = simpleCache;
