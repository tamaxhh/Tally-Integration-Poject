/**
 * src/services/voucher.service.js
 *
 * Voucher service — orchestrates XML building, Tally connector, parsing, and caching.
 *
 * CACHING STRATEGY FOR VOUCHERS vs LEDGERS:
 * -------------------------------------------
 * Ledgers: Cache aggressively (5-10 min). Chart of accounts changes rarely.
 * Vouchers: Cache conservatively (1-2 min). New transactions are entered constantly.
 *
 * The cache key includes the full date range so that:
 *   - April vouchers don't pollute May's cache key
 *   - Date range queries are independently cached
 *   - Cache invalidation is surgical (invalidate one range, not all vouchers)
 */

'use strict';

const { sendToTally } = require('../connectors/tally/client');
const { buildVoucherListXml, buildSingleVoucherXml } = require('../xml/builder/voucher.xml');
const { parseVoucherList, normaliseVoucher } = require('../xml/parser/voucher.parser');
const { parseXml, ensureArray, safeGet } = require('../xml/parser/index');
const cacheManager = require('../cache/cacheManager');
const config = require('../config');
const logger = require('../config/logger');

const CACHE_PREFIX = 'tally:vouchers';
// Vouchers get shorter TTL than ledgers — data changes more frequently
const VOUCHER_TTL = Math.min(config.redis.ttlSeconds, 120); // Max 2 minutes

/**
 * Get vouchers within a date range.
 *
 * @param {object} options
 * @param {Date} options.fromDate
 * @param {Date} options.toDate
 * @param {string} [options.voucherType]
 * @param {string} [options.company]
 * @param {boolean} [options.bypassCache]
 * @returns {Promise<{ vouchers: object[], total: number, fromCache: boolean }>}
 */
async function getVouchers({ fromDate, toDate, voucherType, company = '', bypassCache = false } = {}) {
  // Build a deterministic cache key from all query parameters
  const from = fromDate.toISOString().split('T')[0];
  const to   = toDate.toISOString().split('T')[0];
  const typeSlug = voucherType ? voucherType.toLowerCase().replace(/\s+/g, '_') : 'all';
  const cacheKey = `${CACHE_PREFIX}:${company || 'default'}:${from}:${to}:${typeSlug}`;

  if (!bypassCache) {
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      logger.debug({ cacheKey }, 'Vouchers served from cache');
      return { ...cached, fromCache: true };
    }
  }

  logger.info({ from, to, voucherType, company }, 'Fetching vouchers from Tally');
  const xmlRequest = buildVoucherListXml({ fromDate, toDate, voucherType, company });
  const xmlResponse = await sendToTally(xmlRequest);
  const result = parseVoucherList(xmlResponse);

  await cacheManager.set(cacheKey, result, VOUCHER_TTL);
  logger.info({ count: result.total, from, to }, 'Vouchers fetched and cached');

  return { ...result, fromCache: false };
}

/**
 * Get a single voucher by number.
 *
 * @param {object} options
 * @param {string} options.voucherNumber
 * @param {string} [options.company]
 * @returns {Promise<{ voucher: object|null, fromCache: boolean }>}
 */
async function getVoucherByNumber({ voucherNumber, company = '' } = {}) {
  const slug = voucherNumber.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const cacheKey = `${CACHE_PREFIX}:single:${company || 'default'}:${slug}`;

  const cached = await cacheManager.get(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const xmlRequest = buildSingleVoucherXml({ voucherNumber, company });
  const xmlResponse = await sendToTally(xmlRequest);

  // Single voucher response parsing
  const parsed = parseXml(xmlResponse);
  const requestData = safeGet(parsed, 'ENVELOPE.BODY.EXPORTDATA.REQUESTDATA');
  const messages = ensureArray(safeGet(requestData, 'TALLYMESSAGE'));
  let voucher = null;

  for (const message of messages) {
    const rawVouchers = ensureArray(message.VOUCHER);
    if (rawVouchers.length > 0) {
      voucher = normaliseVoucher(rawVouchers[0]);
      break;
    }
  }

  if (voucher) {
    await cacheManager.set(cacheKey, { voucher }, VOUCHER_TTL);
  }

  return { voucher, fromCache: false };
}

/**
 * Get a summary of vouchers grouped by type.
 *
 * @param {object} options
 * @param {Date} options.fromDate
 * @param {Date} options.toDate
 * @param {string} [options.company]
 * @returns {Promise<object>} Summary keyed by voucher type
 */
async function getVoucherSummary({ fromDate, toDate, company = '' } = {}) {
  // Fetch all vouchers, then aggregate — simple and reliable
  const { vouchers } = await getVouchers({ fromDate, toDate, company });

  // Aggregate by voucher type
  const summary = {};
  for (const voucher of vouchers) {
    const type = voucher.voucherType || 'Unknown';
    if (!summary[type]) {
      summary[type] = { count: 0, totalAmount: 0, vouchers: [] };
    }
    summary[type].count++;
    summary[type].totalAmount += voucher.amount || 0;
  }

  // Round amounts to avoid floating point artifacts
  for (const type of Object.keys(summary)) {
    summary[type].totalAmount = parseFloat(summary[type].totalAmount.toFixed(2));
  }

  return summary;
}

module.exports = { getVouchers, getVoucherByNumber, getVoucherSummary };
