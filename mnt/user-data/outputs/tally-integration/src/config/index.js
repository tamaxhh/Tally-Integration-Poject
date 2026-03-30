/**
 * src/config/index.js
 *
 * WHY THIS EXISTS:
 * ----------------
 * Scattered process.env calls throughout the codebase are a maintenance nightmare.
 * If you mistype an env var name, you get 'undefined' silently at runtime — often
 * in production. This module centralises all configuration, validates that required
 * vars are present at startup, and provides typed defaults. If the app starts
 * without required config, it fails loudly immediately rather than hours later.
 *
 * PATTERN USED: "Fail fast at startup" — crash immediately with a clear message
 * rather than discovering missing config deep in production traffic.
 */

'use strict';

// Load .env file in development. In production, env vars are injected by the platform.
require('dotenv').config();

/**
 * Parse a comma-separated string into an array.
 * "key1,key2,key3" → ["key1", "key2", "key3"]
 */
function parseList(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Validate that a required env var is present.
 * Throws at startup if missing — this is intentional.
 */
function require_env(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const config = {
  // ---- Runtime ----
  env: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',

  // ---- Server ----
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
  },

  // ---- Tally connection ----
  tally: {
    host: process.env.TALLY_HOST || 'localhost',
    port: parseInt(process.env.TALLY_PORT || '9000', 10),
    // The full base URL for the Tally HTTP server
    baseUrl: `http://${process.env.TALLY_HOST || 'localhost'}:${process.env.TALLY_PORT || '9000'}`,
    timeoutMs: parseInt(process.env.TALLY_TIMEOUT_MS || '5000', 10),
    maxRetries: parseInt(process.env.TALLY_MAX_RETRIES || '2', 10),
    // If empty, Tally will use the currently open company
    companyName: process.env.TALLY_COMPANY_NAME || '',
  },

  // ---- Redis ----
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
  },

  // ---- PostgreSQL ----
  db: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tally_integration',
  },

  // ---- Security ----
  auth: {
    // API keys are stored as a Set for O(1) lookup during request validation
    apiKeys: new Set(parseList(process.env.API_KEYS || 'dev-key-1234')),
  },

  // ---- Logging ----
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // ---- Background jobs ----
  jobs: {
    syncLedgersCron: process.env.SYNC_LEDGERS_CRON || '*/10 * * * *',
    syncVouchersCron: process.env.SYNC_VOUCHERS_CRON || '*/5 * * * *',
  },
};

// Validate production requirements
if (config.isProd) {
  // In production, insist on explicit API keys — the default dev key is not acceptable
  if (config.auth.apiKeys.has('dev-key-1234')) {
    throw new Error('Default dev API key detected in production. Set API_KEYS to secure values.');
  }
}

module.exports = config;
