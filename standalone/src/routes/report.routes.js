/**
 * src/api/routes/report.routes.js
 *
 * FINANCIAL REPORTS — WHAT THEY ARE AND HOW TALLY PRODUCES THEM:
 * ================================================================
 * These are pre-built Tally reports that aggregate ledger/voucher data
 * into meaningful financial views. We proxy them through our API with
 * clean JSON output.
 *
 * ENDPOINTS:
 * ----------
 * GET /api/v1/reports/trial-balance
 *   All ledger closing balances. Shows if your books balance (Debits === Credits).
 *
 * GET /api/v1/reports/profit-loss
 *   Income - Expenses for a period. The "how much did we make" report.
 *
 * GET /api/v1/reports/balance-sheet
 *   Assets = Liabilities + Equity at a point in time.
 *
 * GET /api/v1/reports/day-book
 *   All vouchers for a date. The raw transaction log for a day.
 */

'use strict';

const reportService = require('../services/report/report.service');

const reportDateSchema = {
  querystring: {
    type: 'object',
    required: ['fromDate', 'toDate'],
    properties: {
      fromDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      toDate:   { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      company:  { type: 'string', maxLength: 255 },
    },
    additionalProperties: false,
  },
};

async function reportRoutes(fastify) {

  /**
   * GET /api/v1/reports/trial-balance
   * Returns all ledger balances. If total debit ≠ total credit, books are out of balance.
   */
  fastify.get('/reports/trial-balance', { schema: reportDateSchema }, async (request, reply) => {
    const { fromDate, toDate, company = '' } = request.query;

    const report = await reportService.getTrialBalance({
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      company,
    });

    return {
      success: true,
      data: report,
      meta: {
        reportType: 'trial-balance',
        dateRange: { from: fromDate, to: toDate },
        generatedAt: new Date().toISOString(),
      },
    };
  });

  /**
   * GET /api/v1/reports/profit-loss
   */
  fastify.get('/reports/profit-loss', { schema: reportDateSchema }, async (request, reply) => {
    const { fromDate, toDate, company = '' } = request.query;

    const report = await reportService.getProfitAndLoss({
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      company,
    });

    return {
      success: true,
      data: report,
      meta: {
        reportType: 'profit-loss',
        dateRange: { from: fromDate, to: toDate },
        generatedAt: new Date().toISOString(),
      },
    };
  });

  /**
   * GET /api/v1/reports/balance-sheet
   * Balance sheet is always as-of toDate. fromDate is used for comparison period.
   */
  fastify.get('/reports/balance-sheet', { schema: reportDateSchema }, async (request, reply) => {
    const { fromDate, toDate, company = '' } = request.query;

    const report = await reportService.getBalanceSheet({
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      company,
    });

    return {
      success: true,
      data: report,
      meta: {
        reportType: 'balance-sheet',
        asOf: toDate,
        generatedAt: new Date().toISOString(),
      },
    };
  });

  /**
   * GET /api/v1/reports/day-book?fromDate=2024-04-15&toDate=2024-04-15
   * The Day Book is effectively voucher list — but pre-formatted as a report.
   * Calling it here makes the API intent clear.
   */
  fastify.get('/reports/day-book', { schema: reportDateSchema }, async (request, reply) => {
    const { fromDate, toDate, company = '' } = request.query;

    const report = await reportService.getDayBook({
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      company,
    });

    return {
      success: true,
      data: report,
      meta: {
        reportType: 'day-book',
        dateRange: { from: fromDate, to: toDate },
        generatedAt: new Date().toISOString(),
      },
    };
  });
}

module.exports = reportRoutes;
