/**
 * src/services/ledger/ledger.service.js
 *
 * UNIFIED LEDGER SERVICE - Produces exact output format from standalone script
 * 
 * This service replaces all fragmented ledger logic with a single, unified approach
 * that generates the exact same JSON structure as the standalone ledger script.
 */

'use strict';

const { sendToTally } = require('../connectors/tally.client.js');
const { buildDetailedLedgerXml } = require('../xml/builder/ledger.xml');
const { parseLedgerList } = require('../xml/parser/ledger.parser');
const cacheManager = require('../../cache/simple-cache');
const logger = require('../../config/logger');
const config = require('../../config');
const fs = require('fs').promises;
const path = require('path');

// Cache key namespacing
const CACHE_PREFIX = 'tally:ledgers';

/**
 * Generate comprehensive ledger summary - matches standalone logic exactly
 */
function generateLedgerSummary(ledgers) {
  const summary = {
    byParent: {},
    withOpeningBalance: 0,
    withClosingBalance: 0,
    withGSTIN: 0,
    withBankAccounts: 0,
    totalLedgers: ledgers.length
  };
  
  ledgers.forEach(ledger => {
    // Count by parent group
    const parent = ledger.parent || 'Unspecified';
    summary.byParent[parent] = (summary.byParent[parent] || 0) + 1;
    
    // Count balances
    if (ledger.openingBalance && ledger.openingBalance !== '0') {
      summary.withOpeningBalance++;
    }
    if (ledger.closingBalance && ledger.closingBalance !== '0') {
      summary.withClosingBalance++;
    }
    
    // Count GSTIN
    if (ledger.gstin) {
      summary.withGSTIN++;
    }
    
    // Count bank accounts
    if (ledger.bankAccountNumber) {
      summary.withBankAccounts++;
    }
  });
  
  return summary;
}

/**
 * Parse ledger data from XML - uses updated parser logic
 */
function parseLedgerData(xmlResponse) {
  try {
    const result = parseLedgerList(xmlResponse);
    return result.ledgers;
  } catch (error) {
    logger.error('Error parsing ledger data:', error);
    return [];
  }
}

/**
 * MAIN FUNCTION - Get all ledgers with exact standalone output format
 * 
 * @param {object} [options]
 * @param {string} [options.company] - Tally company name
 * @param {boolean} [options.bypassCache] - Force fresh fetch
 * @returns {Promise<object>} Ledger data in exact standalone format
 */
async function getLedgers({ company = '', bypassCache = false } = {}) {
  logger.info({ company, bypassCache }, 'SERVICE CALLED - getLedgers');
  const cacheKey = `${CACHE_PREFIX}:${company || 'default'}`;

  try {
    // Step 1: Try cache (unless explicitly bypassed)
    if (!bypassCache) {
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        logger.info({ cacheKey }, '✅ CACHE HIT');
        return { ...cached, fromCache: true };
      }
    }

    // Step 2: Build XML request using detailed ledger XML (matches standalone)
    logger.info('📦 BUILDING XML...');
    const xmlRequest = buildDetailedLedgerXml({ company });
    logger.info({ xmlLength: xmlRequest.length }, 'XML built');

    // Step 3: Send to Tally
    logger.info('🚀 CALLING TALLY...');
    const xmlResponse = await sendToTally(xmlRequest);
    logger.info({ responseLength: xmlResponse.length }, '✅ TALLY RESPONSE RECEIVED');

    // Step 4: Parse the XML response
    logger.info('📊 PARSING RESPONSE...');
    const ledgers = parseLedgerData(xmlResponse);
    logger.info({ total: ledgers.length }, '✅ PARSED SUCCESSFULLY');

    // Step 5: Generate comprehensive summary
    const summary = generateLedgerSummary(ledgers);

    // Step 6: Create final result structure - matches standalone format
    const result = {
      metadata: {
        fetchTimestamp: new Date().toISOString(),
        totalLedgers: ledgers.length,
        company: company || 'Default',
        note: 'Ledger data fetched using updated parser'
      },
      ledgers: ledgers,
      summary: summary
    };

    // Step 7: Store in cache
    await cacheManager.set(cacheKey, result, config.redis.ttlSeconds);
    logger.info({ cacheKey }, '💾 CACHED RESULT');

    return { ...result, fromCache: false };
  } catch (error) {
    logger.error({ error, company, cacheKey }, 'Failed to get ledgers');
    throw error;
  }
}

/**
 * Export ledger data to JSON file - matches standalone format
 */
async function exportLedgerData({ company = '', outputDir = './exports', bypassCache = false } = {}) {
  try {
    logger.info({ company, outputDir }, 'Starting ledger data export');
    
    // Get ledger data
    const ledgerData = await getLedgers({ company, bypassCache });
    
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `ledger-data-${timestamp}.json`;
    const filepath = path.join(outputDir, filename);
    
    // Write to file
    await fs.writeFile(filepath, JSON.stringify(ledgerData, null, 2));
    
    logger.info({ filepath, total: ledgerData.metadata.totalLedgers }, 'Ledger data exported successfully');
    
    return {
      success: true,
      filepath: filepath,
      filename: filename,
      total: ledgerData.metadata.totalLedgers,
      company: company || 'Default',
      summary: ledgerData.summary
    };
    
  } catch (error) {
    logger.error({ error, company, outputDir }, 'Failed to export ledger data');
    throw error;
  }
}

/**
 * Get top ledgers by balance - new analysis function
 */
async function getTopLedgersByBalance({ company = '', limit = 10, sortBy = 'absolute', bypassCache = false } = {}) {
  try {
    logger.info({ company, limit, sortBy }, 'Fetching top ledgers by balance');
    
    // Get ledger data
    const ledgerData = await getLedgers({ company, bypassCache });
    
    // Filter and sort ledgers
    const withBalances = ledgerData.ledgers.filter(ledger => 
      ledger.closingBalance !== null && 
      ledger.closingBalance !== undefined && 
      ledger.closingBalance !== ''
    );
    
    const sortedLedgers = withBalances
      .map(ledger => ({ 
        ...ledger, 
        balanceValue: parseFloat(ledger.closingBalance) || 0 
      }))
      .sort((a, b) => {
        if (sortBy === 'absolute') {
          return Math.abs(b.balanceValue) - Math.abs(a.balanceValue);
        } else {
          return b.balanceValue - a.balanceValue;
        }
      })
      .slice(0, limit);
    
    logger.info({ company, count: sortedLedgers.length }, 'Top ledgers by balance fetched');
    
    return {
      success: true,
      company: company || 'Default',
      sortBy: sortBy,
      limit: limit,
      total: sortedLedgers.length,
      summary: ledgerData.summary,
      topLedgers: sortedLedgers
    };
    
  } catch (error) {
    logger.error({ error, company, limit, sortBy }, 'Failed to get top ledgers by balance');
    throw error;
  }
}

/**
 * Invalidate ledger cache
 */
async function invalidateLedgerCache(company = '') {
  const pattern = `${CACHE_PREFIX}:${company || '*'}*`;
  const deleted = await cacheManager.deletePattern(pattern);
  logger.info({ pattern, deleted }, 'Ledger cache invalidated');
}

/**
 * Get ledger balances - placeholder implementation
 */
async function getLedgerBalances({ company = '', from, to, bypassCache = false } = {}) {
  try {
    // For now, return the same as getLedgers since balances are included
    const result = await getLedgers({ company, bypassCache });
    return {
      ledgers: result.ledgers,
      total: result.ledgers.length,
      fromCache: result.fromCache
    };
  } catch (error) {
    logger.error({ error, company }, 'Failed to get ledger balances');
    throw error;
  }
}

/**
 * Get single ledger by name - placeholder implementation
 */
async function getLedgerByName({ ledgerName, company = '', bypassCache = false } = {}) {
  try {
    const result = await getLedgers({ company, bypassCache });
    const ledger = result.ledgers.find(l => l.name === ledgerName);
    return {
      ledger: ledger || null,
      fromCache: result.fromCache
    };
  } catch (error) {
    logger.error({ error, company, ledgerName }, 'Failed to get ledger by name');
    throw error;
  }
}

/**
 * Get ledger transactions - placeholder implementation
 */
async function getLedgerTransactions({ ledgerName, company = '', from, to, bypassCache = false } = {}) {
  try {
    // Placeholder implementation - would need voucher parsing in real scenario
    return {
      ledger: { name: ledgerName },
      transactions: [],
      summary: {
        opening_balance: 0,
        total_debit: 0,
        total_credit: 0,
        closing_balance: 0,
      },
      fromCache: false
    };
  } catch (error) {
    logger.error({ error, company, ledgerName }, 'Failed to get ledger transactions');
    throw error;
  }
}

// Export only essential functions - clean, unified approach
module.exports = {
  getLedgers,
  exportLedgerData,
  getTopLedgersByBalance,
  invalidateLedgerCache,
  getLedgerBalances,
  getLedgerByName,
  getLedgerTransactions,
};
