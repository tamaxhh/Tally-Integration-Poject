'use strict';

// Simple config loader for the root-level structure
const config = {
  tally: {
    host: process.env.TALLY_HOST || 'localhost',
    port: parseInt(process.env.TALLY_PORT || '9000', 10),
    timeoutMs: parseInt(process.env.TALLY_TIMEOUT_MS || '5000', 10),
    maxRetries: parseInt(process.env.TALLY_MAX_RETRIES || '2', 10),
    companyName: process.env.TALLY_COMPANY_NAME || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
  },
  api: {
    keys: (process.env.API_KEYS || 'dev-key-1234').split(',').map(k => k.trim()),
  },
  isDev: process.env.NODE_ENV !== 'production',
};

module.exports = config;
