/**
 * src/services/report.service.js
 *
 * FINANCIAL REPORT SERVICE
 * =========================
 * Reports are higher-level aggregations that Tally computes internally.
 * We ask Tally to generate the report, then parse and normalise the XML.
 *
 * Unlike ledgers and vouchers (raw data), reports have computed totals —
 * Tally does the aggregation, we just format the output.
 */

'use strict';

const { sendToTally } = require('../../../../services/connectors/tally.client');
const { buildExportEnvelope } = require('../../../../services/xml/builder/ledger.xml');
const { parseXml, parseAmount, safeGet, ensureArray } = require('../../../../services/xml/parser/index');
const cacheManager = require('../../../../cache/simple-cache');
const config = require('../../../../../config');
const logger = require('../../../../config/logger');

const CACHE_PREFIX = 'tally:reports';

/**
 * Generic report fetcher — sends a Tally report request and returns parsed data.
 * All specific report functions (getTrialBalance, getProfitAndLoss etc.) use this.
 *
 * @param {string} reportName - Tally report name
 * @param {Date} fromDate
 * @param {Date} toDate
 * @param {string} [company]
 * @returns {Promise<object>} Raw parsed report data
 */
async function fetchReport({ reportName, fromDate, toDate, company }) {
  const from = fromDate.toISOString().split('T')[0];
  const to   = toDate.toISOString().split('T')[0];
  const slug = reportName.toLowerCase().replace(/\s+/g, '_');
  const cacheKey = `${CACHE_PREFIX}:${slug}:${company || 'default'}:${from}:${to}`;

  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    logger.debug({ cacheKey, reportName }, 'Report served from cache');
    return cached;
  }

  logger.info({ reportName, from, to, company }, 'Fetching report from Tally');
  const xml = buildExportEnvelope({ reportName, fromDate, toDate, company });
  const xmlResponse = await sendToTally(xml);
  const parsed = parseXml(xmlResponse);

  await cacheManager.set(cacheKey, parsed, config.redis.ttlSeconds);
  return parsed;
}

/**
 * Parse a Tally group row (used in Trial Balance, P&L, Balance Sheet).
 * Tally represents report rows as GROUP elements with nested sub-groups.
 */
function parseGroupRow(group) {
  if (!group) return null;
  return {
    name: group['@_NAME'] || group.NAME || '',
    openingBalance: parseAmount(group.OPENINGBALANCE),
    closingBalance: parseAmount(group.CLOSINGBALANCE),
    subGroups: ensureArray(group.GROUP).map(parseGroupRow).filter(Boolean),
  };
}

/**
 * GET /api/v1/reports/trial-balance
 * Lists all ledger groups with their debit/credit balances.
 */
async function getTrialBalance({ fromDate, toDate, company } = {}) {
  const parsed = await fetchReport({ reportName: 'Trial Balance', fromDate, toDate, company });

  const requestData = safeGet(parsed, 'ENVELOPE.BODY.EXPORTDATA.REQUESTDATA');
  const messages    = ensureArray(safeGet(requestData, 'TALLYMESSAGE'));

  const groups = [];
  let totalDebit = 0;
  let totalCredit = 0;

  for (const msg of messages) {
    const rawGroups = ensureArray(msg.GROUP);
    for (const g of rawGroups) {
      const row = parseGroupRow(g);
      if (!row) continue;
      groups.push(row);
      const balance = row.closingBalance || 0;
      if (balance >= 0) totalCredit += balance;
      else totalDebit += Math.abs(balance);
    }
  }

  return {
    groups,
    totals: {
      debit:    parseFloat(totalDebit.toFixed(2)),
      credit:   parseFloat(totalCredit.toFixed(2)),
      isBalanced: Math.abs(totalDebit - totalCredit) < 1,
    },
  };
}

/**
 * GET /api/v1/reports/profit-loss
 * Income statement for the period.
 */
async function getProfitAndLoss({ fromDate, toDate, company } = {}) {
  const parsed = await fetchReport({ reportName: 'Profit & Loss', fromDate, toDate, company });

  const requestData = safeGet(parsed, 'ENVELOPE.BODY.EXPORTDATA.REQUESTDATA');
  const messages = ensureArray(safeGet(requestData, 'TALLYMESSAGE'));

  const income  = [];
  const expense = [];

  for (const msg of messages) {
    for (const g of ensureArray(msg.GROUP)) {
      const row = parseGroupRow(g);
      if (!row) continue;
      // Tally P&L structure: income groups have positive balances, expense groups negative
      if ((row.closingBalance || 0) >= 0) income.push(row);
      else expense.push(row);
    }
  }

  const totalIncome  = income.reduce((s, g) => s + (g.closingBalance || 0), 0);
  const totalExpense = expense.reduce((s, g) => s + Math.abs(g.closingBalance || 0), 0);

  return {
    income,
    expense,
    summary: {
      totalIncome:  parseFloat(totalIncome.toFixed(2)),
      totalExpense: parseFloat(totalExpense.toFixed(2)),
      netProfit:    parseFloat((totalIncome - totalExpense).toFixed(2)),
      isProfitable: totalIncome > totalExpense,
    },
  };
}

/**
 * GET /api/v1/reports/balance-sheet
 * Assets and Liabilities as of toDate.
 */
async function getBalanceSheet({ fromDate, toDate, company } = {}) {
  const parsed = await fetchReport({ reportName: 'Balance Sheet', fromDate, toDate, company });

  const requestData = safeGet(parsed, 'ENVELOPE.BODY.EXPORTDATA.REQUESTDATA');
  const messages = ensureArray(safeGet(requestData, 'TALLYMESSAGE'));

  const assets      = [];
  const liabilities = [];

  for (const msg of messages) {
    for (const g of ensureArray(msg.GROUP)) {
      const row = parseGroupRow(g);
      if (!row) continue;
      // Tally balance sheet: assets have debit closing (negative), liabilities credit (positive)
      if ((row.closingBalance || 0) >= 0) liabilities.push(row);
      else assets.push(row);
    }
  }

  const totalAssets      = assets.reduce((s, g) => s + Math.abs(g.closingBalance || 0), 0);
  const totalLiabilities = liabilities.reduce((s, g) => s + (g.closingBalance || 0), 0);

  return {
    assets,
    liabilities,
    summary: {
      totalAssets:      parseFloat(totalAssets.toFixed(2)),
      totalLiabilities: parseFloat(totalLiabilities.toFixed(2)),
      isBalanced:       Math.abs(totalAssets - totalLiabilities) < 1,
    },
  };
}

/**
 * GET /api/v1/reports/day-book
 * All vouchers entered on one or more days.
 */
async function getDayBook({ fromDate, toDate, company } = {}) {
  // Day book is essentially the voucher list — reuse voucher service
  const { getVouchers } = require('./voucher.service');
  return getVouchers({ fromDate, toDate, company });
}

module.exports = {
  getTrialBalance,
  getProfitAndLoss,
  getBalanceSheet,
  getDayBook,
};
