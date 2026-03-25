/**
 * src/jobs/scheduler.js
 *
 * BACKGROUND SYNC JOBS — WHY THEY MATTER:
 * ========================================
 * Tally has no webhooks. It can't push data to your system when something changes.
 * This means we must PULL data periodically.
 *
 * Without background sync:
 * - Every API request hits Tally directly → slow under load
 * - If Tally is briefly offline → users get errors, not stale data
 *
 * With background sync:
 * - Jobs continuously pull fresh data and store in Redis/PostgreSQL
 * - API requests serve from cache → fast and resilient
 * - Even if Tally goes offline for 10 minutes, your API keeps serving last-good data
 *
 * THIS IS THE WEBHOOK SIMULATION PATTERN:
 * ----------------------------------------
 * Since Tally can't push, we pull frequently. A 5-minute sync interval means
 * data is at most 5 minutes stale. For most accounting use cases, this is fine.
 * For real-time requirements, reduce the interval (but be careful not to
 * overload Tally — it's a desktop app, not a production database server).
 *
 * JOB IDEMPOTENCY:
 * ----------------
 * Every job MUST be safe to run multiple times. If a job is running when
 * the next trigger fires (slow Tally response), two instances would overlap.
 * We use a simple lock mechanism to prevent concurrent runs.
 */

'use strict';

const cron = require('node-cron');
const config = require('../config');
const logger = require('../config/logger');
const { isTallyOnline } = require('../services/connectors/tally.client.js');

// In-memory job lock — prevents concurrent runs of the same job
// For multi-process setups, use Redis-based distributed locks instead
const runningJobs = new Set();

/**
 * Wrap a job function with:
 * - Pre-run Tally health check (skip if offline)
 * - Concurrency lock (skip if already running)
 * - Error catching (job failures don't crash the process)
 * - Timing and logging
 *
 * @param {string} jobName - Identifier for logging and lock key
 * @param {Function} jobFn - Async function containing the job logic
 * @returns {Function} Wrapped function suitable for cron.schedule()
 */
function createJob(jobName, jobFn) {
  return async () => {
    // Concurrency guard: if this job is already running, skip this tick
    if (runningJobs.has(jobName)) {
      logger.warn({ jobName }, 'Job skipped — previous run still in progress');
      return;
    }

    // Pre-check: don't bother if Tally is offline
    const tallyUp = await isTallyOnline();
    if (!tallyUp) {
      logger.warn({ jobName }, 'Job skipped — Tally is not reachable');
      return;
    }

    runningJobs.add(jobName);
    const startTime = Date.now();
    logger.info({ jobName }, 'Job started');

    try {
      await jobFn();
      const duration = Date.now() - startTime;
      logger.info({ jobName, durationMs: duration }, 'Job completed');
    } catch (error) {
      const duration = Date.now() - startTime;
      // Log but don't rethrow — a job failure should NEVER crash the process
      logger.error({ jobName, durationMs: duration, error: error.message }, 'Job failed');
    } finally {
      runningJobs.delete(jobName);
    }
  };
}

/**
 * Register and start all background jobs.
 * Call this from src/index.js after the server starts.
 */
function startScheduler() {
  logger.info('Starting background job scheduler');

  // ---- Ledger sync job ----
  // Pulls all ledgers and refreshes the cache.
  // Ledgers change infrequently — every 10 minutes is plenty.
  cron.schedule(config.jobs.syncLedgersCron, createJob('sync-ledgers', async () => {
    const ledgerService = require('../services/ledger.service');
    // bypassCache: true forces a fresh Tally fetch, updating the cache
    const { ledgers, total } = await ledgerService.getLedgers({ bypassCache: true });
    logger.info({ count: total }, 'Ledger sync: updated cache');
  }));

  // ---- Voucher sync job ----
  // Pulls today's and yesterday's vouchers (in case any were missed).
  // Runs every 5 minutes to catch newly entered transactions quickly.
  cron.schedule(config.jobs.syncVouchersCron, createJob('sync-vouchers', async () => {
    const voucherService = require('../services/voucher.service');

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Sync yesterday + today to handle vouchers entered after midnight
    const { total } = await voucherService.getVouchers({
      fromDate: yesterday,
      toDate: today,
      bypassCache: true,
    });

    logger.info({ count: total, from: yesterday.toDateString(), to: today.toDateString() },
      'Voucher sync: updated cache');
  }));

  logger.info({
    ledgersCron:  config.jobs.syncLedgersCron,
    vouchersCron: config.jobs.syncVouchersCron,
  }, 'Scheduler started — jobs registered');
}

/**
 * Stop all scheduled jobs (used in graceful shutdown and tests).
 */
function stopScheduler() {
  cron.getTasks().forEach(task => task.destroy());
  logger.info('Scheduler stopped');
}

module.exports = { startScheduler, stopScheduler };
