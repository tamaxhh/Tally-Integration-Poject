/**
 * src/xml/builder/voucher.xml.js
 *
 * TALLY VOUCHERS — WHAT THEY ARE:
 * ---------------------------------
 * In Tally, a "Voucher" is any financial transaction entry. Every debit/credit
 * in Tally is a voucher. Types include:
 *   - Payment    → Money going out (vendor payments, expenses)
 *   - Receipt    → Money coming in (customer payments)
 *   - Sales      → Sales invoice entries
 *   - Purchase   → Purchase invoice entries
 *   - Contra     → Bank to cash transfers
 *   - Journal    → Manual accounting adjustments
 *
 * Vouchers are the raw transaction data. Most accounting reports
 * (P&L, Balance Sheet) are aggregations of vouchers.
 *
 * FETCHING VOUCHERS — DATE RANGES ARE MANDATORY:
 * ------------------------------------------------
 * Tally has tens of thousands of vouchers in a typical company.
 * Always filter by date range. Without it, Tally may return everything
 * and time out on large datasets.
 */

'use strict';

const { buildExportEnvelope, xmlEscape } = require('./ledger.xml');
// We reuse buildExportEnvelope from the ledger builder to keep things DRY

/**
 * Build XML to fetch vouchers within a date range.
 * This is the core voucher query — most other voucher operations filter on top of this.
 *
 * @param {object} options
 * @param {Date} options.fromDate - Start of date range (inclusive)
 * @param {Date} options.toDate - End of date range (inclusive)
 * @param {string} [options.voucherType] - Filter by type: "Sales", "Payment", etc.
 * @param {string} [options.company] - Tally company name
 * @returns {string} XML request string
 */
function buildVoucherListXml({ fromDate, toDate, voucherType, company } = {}) {
  if (!fromDate || !toDate) {
    throw new Error('fromDate and toDate are required for voucher queries');
  }

  // Optional: filter by voucher type
  const typeFilter = voucherType
    ? `<VOUCHERTYPENAME>${xmlEscape(voucherType)}</VOUCHERTYPENAME>`
    : '';

  return buildExportEnvelope({
    reportName: 'Day Book',
    // "Day Book" in Tally is the complete transaction register — shows all vouchers
    // in a date range. This is the most reliable way to fetch vouchers.
    company,
    fromDate,
    toDate,
    extraVars: typeFilter,
  });
}

/**
 * Build XML to fetch a single voucher by its voucher number.
 *
 * @param {object} options
 * @param {string} options.voucherNumber - The voucher number (e.g. "Sal-001")
 * @param {string} [options.company]
 * @returns {string} XML request string
 */
function buildSingleVoucherXml({ voucherNumber, company } = {}) {
  if (!voucherNumber) throw new Error('voucherNumber is required');

  return buildExportEnvelope({
    reportName: 'Voucher',
    company,
    extraVars: `<VOUCHERNUMBER>${xmlEscape(voucherNumber)}</VOUCHERNUMBER>`,
  });
}

/**
 * Build XML to fetch a summary of vouchers by type for a period.
 * Useful for the dashboard endpoint showing total sales, payments, etc.
 *
 * @param {object} options
 * @param {Date} options.fromDate
 * @param {Date} options.toDate
 * @param {string} [options.company]
 * @returns {string} XML request string
 */
function buildVoucherSummaryXml({ fromDate, toDate, company } = {}) {
  if (!fromDate || !toDate) {
    throw new Error('fromDate and toDate are required for voucher summary');
  }

  return buildExportEnvelope({
    reportName: 'Voucher Type Summary',
    company,
    fromDate,
    toDate,
  });
}

module.exports = {
  buildVoucherListXml,
  buildSingleVoucherXml,
  buildVoucherSummaryXml,
};
