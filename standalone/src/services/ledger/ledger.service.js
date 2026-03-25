/**
 * src/services/ledger.service.js
 *
 * THE SERVICE LAYER — WHY IT EXISTS:
 * ====================================
 * The service layer sits between routes and the Tally connector.
 * It owns the business logic and orchestration:
 *
 *   Route handler → Service → Cache (Redis) → Connector → XML Builder/Parser
 *
 * Routes should be THIN (just HTTP plumbing). Services should be THICK
 * (where decisions are made). This makes services unit-testable without
 * HTTP and gives you a stable interface even if routes change.
 *
 * This service specifically handles:
 * 1. Caching strategy (cache-aside pattern)
 * 2. Calling the correct XML builder
 * 3. Sending the request via the Tally connector
 * 4. Parsing the response via the ledger parser
 * 5. Optionally persisting to PostgreSQL for resilience
 */

'use strict';

const { sendToTally } = require('../connectors/tally.client.js');
const { buildLedgerListXml, buildSingleLedgerXml, buildLedgerBalanceXml, buildLedgerTransactionsXml } = require('../xml/builder/ledger.xml');
const { parseLedgerList, parseSingleLedger, parseLedgerBalances, parseLedgerTransactions } = require('../xml/parser/ledger.parser');
const cacheManager = require('../../cache/simple-cache');
const logger = require('../../config/logger');
const config = require('../../config');

// Cache key namespacing — using a consistent prefix makes it easy to
// invalidate all Tally cache entries at once if needed
const CACHE_PREFIX = 'tally:ledgers';

/**
 * Get all ledgers for a company.
 *
 * Cache strategy: Cache-Aside (Lazy Loading)
 * - Check cache first
 * - If miss, fetch from Tally, parse, store in cache, return
 * - Cache TTL: configurable (default 5 min)
 *
 * This is the right pattern here because:
 * - Ledger list changes infrequently
 * - Tally can be slow under load
 * - Stale-for-5-minutes is acceptable for ledger metadata
 *
 * @param {object} [options]
 * @param {string} [options.company] - Tally company name
 * @param {boolean} [options.bypassCache] - Force fresh fetch (useful for sync jobs)
 * @returns {Promise<{ ledgers: object[], total: number, fromCache: boolean }>}
 */
async function getLedgers({ company = '', bypassCache = false } = {}) {
  const cacheKey = `${CACHE_PREFIX}:${company || 'default'}`;

  // Step 1: Try cache (unless explicitly bypassed)
  if (!bypassCache) {
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      logger.debug({ cacheKey }, 'Ledger list served from cache');
      return { ...cached, fromCache: true };
    }
  }

  // Step 2: Cache miss — build XML request
  logger.info({ company, cacheKey }, 'Fetching ledger list from Tally');
  const xmlRequest = buildLedgerListXml({ company });

  // Step 3: Send to Tally (with built-in retry + circuit breaker)
  const xmlResponse = await sendToTally(xmlRequest);

  // Step 4: Parse the XML response into typed JSON
  const result = parseLedgerList(xmlResponse);

  // Step 5: Store in cache for future requests
  await cacheManager.set(cacheKey, result, config.redis.ttlSeconds);
  logger.info({ count: result.total, company }, 'Ledger list fetched and cached');

  return { ...result, fromCache: false };
}

/**
 * Get a single ledger by name.
 *
 * @param {object} options
 * @param {string} options.ledgerName - Exact ledger name as it appears in Tally
 * @param {string} [options.company]
 * @param {boolean} [options.bypassCache]
 * @returns {Promise<object|null>}
 */
async function getLedgerByName({ ledgerName, company = '', bypassCache = false } = {}) {
  // Create a slug-friendly cache key from the ledger name
  const slug = ledgerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const cacheKey = `${CACHE_PREFIX}:single:${company || 'default'}:${slug}`;

  if (!bypassCache) {
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      logger.debug({ cacheKey, ledgerName }, 'Single ledger served from cache');
      return { ...cached, fromCache: true };
    }
  }

  logger.info({ ledgerName, company }, 'Fetching single ledger from Tally');
  const xmlRequest = buildSingleLedgerXml({ ledgerName, company });
  const xmlResponse = await sendToTally(xmlRequest);
  const ledger = parseSingleLedger(xmlResponse);

  if (ledger) {
    await cacheManager.set(cacheKey, { ledger }, config.redis.ttlSeconds);
  }

  return { ledger, fromCache: false };
}

/**
 * Invalidate all ledger cache entries for a company.
 * Called by background sync jobs after fetching fresh data.
 *
 * @param {string} [company]
 */
async function invalidateLedgerCache(company = '') {
  const pattern = `${CACHE_PREFIX}:${company || '*'}*`;
  const deleted = await cacheManager.deletePattern(pattern);
  logger.info({ pattern, deleted }, 'Ledger cache invalidated');
}

/**
 * Get ledger balances for a company.
 *
 * @param {object} [options]
 * @param {string} [options.company] - Tally company name
 * @param {string} [options.from] - From date
 * @param {string} [options.to] - To date
 * @param {boolean} [options.bypassCache] - Force fresh fetch
 * @returns {Promise<{ ledgers: object[], total: number, fromCache: boolean }>}
 */
async function getLedgerBalances({ company = '', from = '', to = '', bypassCache = false } = {}) {
  const cacheKey = `${CACHE_PREFIX}:balances:${company || 'default'}:${from || 'all'}:${to || 'all'}`;

  if (!bypassCache) {
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      logger.debug({ cacheKey }, 'Ledger balances served from cache');
      return { ...cached, fromCache: true };
    }
  }

  logger.info({ company, from, to, cacheKey }, 'Fetching ledger balances from Tally');
  const xmlRequest = buildLedgerBalanceXml({ company, from, to });
  const xmlResponse = await sendToTally(xmlRequest);
  const result = parseLedgerBalances(xmlResponse);

  await cacheManager.set(cacheKey, result, 300); // 5 minutes default TTL
  logger.info({ count: result.total, company }, 'Ledger balances fetched and cached');

  return { ...result, fromCache: false };
}

/**
 * Get ledger transactions for a specific ledger.
 *
 * @param {object} options
 * @param {string} options.ledgerName - Exact ledger name
 * @param {string} [options.company] - Tally company name
 * @param {string} [options.from] - From date
 * @param {string} [options.to] - To date
 * @param {boolean} [options.bypassCache] - Force fresh fetch
 * @returns {Promise<object>}
 */
async function getLedgerTransactions({ ledgerName, company = '', from = '', to = '', bypassCache = false } = {}) {
  const slug = ledgerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const cacheKey = `${CACHE_PREFIX}:transactions:${company || 'default'}:${slug}:${from || 'all'}:${to || 'all'}`;

  if (!bypassCache) {
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      logger.debug({ cacheKey, ledgerName }, 'Ledger transactions served from cache');
      return { ...cached, fromCache: true };
    }
  }

  logger.info({ ledgerName, company, from, to }, 'Fetching ledger transactions from Tally');
  const xmlRequest = buildLedgerTransactionsXml({ ledgerName, company, from, to });
  const xmlResponse = await sendToTally(xmlRequest);
  const result = parseLedgerTransactions(xmlResponse, ledgerName, from, to);

  await cacheManager.set(cacheKey, result, 300); // 5 minutes default TTL
  logger.info({ ledgerName, company }, 'Ledger transactions fetched and cached');

  return { ...result, fromCache: false };
}

module.exports = {
  getLedgers,
  getLedgerByName,
  getLedgerBalances,
  getLedgerTransactions,
  invalidateLedgerCache,
};
