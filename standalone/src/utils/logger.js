/**
 * src/config/logger.js
 *
 * WHY PINO:
 * ---------
 * console.log is fine for scripts. For production services, you need:
 * 1. Structured JSON logs (so log aggregators like Datadog/Loki can query them)
 * 2. Log levels (don't emit debug logs in production)
 * 3. Minimal performance overhead — Pino is the fastest Node.js logger (~5x faster than Winston)
 *
 * In development, pino-pretty formats logs as readable colored output.
 * In production, logs are raw JSON piped to stdout for log collectors.
 */

'use strict';

const pino = require('pino');
const config = require('./index');

const logger = pino({
  level: config.log.level,

  // In development, use pretty-printed output so humans can read logs.
  // In production, emit raw JSON — log aggregators prefer it.
  transport: config.isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // These fields appear on every log line — useful for filtering in dashboards
  base: {
    service: 'tally-integration',
    env: config.env,
  },

  // Automatically redact sensitive fields before logging.
  // This is a safety net — you should never log raw secrets anyway.
  redact: {
    paths: ['req.headers.authorization', 'req.headers["x-api-key"]', '*.apiKey', '*.password'],
    censor: '[REDACTED]',
  },
});

module.exports = logger;
