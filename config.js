/**
 * config.js
 *
 * Central configuration for the Tally Integration Project
 */

'use strict';

require('dotenv').config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
  },

  // Tally connection configuration
  tally: {
    host: process.env.TALLY_HOST || 'localhost',
    port: process.env.TALLY_PORT || '9000',
    baseUrl: process.env.TALLY_BASE_URL || 'http://localhost:9000',
    timeoutMs: parseInt(process.env.TALLY_TIMEOUT_MS) || 10000,
    maxRetries: parseInt(process.env.TALLY_MAX_RETRIES) || 3,
  },

  // Redis configuration (for caching)
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttlSeconds: parseInt(process.env.REDIS_TTL_SECONDS) || 300, // 5 minutes
  },

  // API configuration
  api: {
    keys: process.env.API_KEYS ? process.env.API_KEYS.split(',').map(k => k.trim()) : ['dev-key-local-only'],
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
    },
  },

  // Auth configuration (for middleware compatibility)
  auth: {
    apiKeys: new Set(process.env.API_KEYS ? process.env.API_KEYS.split(',').map(k => k.trim()) : ['dev-key-local-only']),
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || true,
    methods: ['GET', 'POST', 'OPTIONS'],
  },

  // Environment
  isDev: process.env.NODE_ENV !== 'production',
  isTest: process.env.NODE_ENV === 'test',
  isProd: process.env.NODE_ENV === 'production',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
