/**
 * src/api/routes/voucher.routes.js
 *
 * ENDPOINTS:
 * ----------
 * GET /api/v1/vouchers
 *   Query: fromDate, toDate (required), voucherType, company, page, limit
 *
 * GET /api/v1/vouchers/:voucherGuid
 *   Path: voucherGuid (URL-encoded)
 *
 * GET /api/v1/vouchers/summary
 *   Query: fromDate, toDate, company
 *   Returns: aggregated totals by voucher type
 *
 * DATE RANGE VALIDATION — WHY IT'S REQUIRED:
 * -------------------------------------------
 * Without a date range, Tally returns ALL vouchers ever entered.
 * This could be tens of thousands of records, causing:
 * - Tally to time out or freeze
 * - Massive XML responses (hundreds of MB)
 * - Your API to hang
 *
 * We enforce a maximum date range of 366 days (1 year) to prevent abuse.
 */

'use strict';

const voucherService = require('../services/voucher/voucher.service');
const { ValidationError } = require('../utils/errors');

// ============================================================
// Date validation helper
// ============================================================

/**
 * Validate and parse fromDate/toDate query params.
 * Throws ValidationError with clear messages if invalid.
 *
 * @param {string} fromDate - ISO date string (YYYY-MM-DD)
 * @param {string} toDate   - ISO date string (YYYY-MM-DD)
 * @returns {{ from: Date, to: Date }}
 */
function validateDateRange(fromDate, toDate) {
  if (!fromDate || !toDate) {
    throw new ValidationError('Both fromDate and toDate are required', {
      fromDate: !fromDate ? 'Required' : undefined,
      toDate:   !toDate   ? 'Required' : undefined,
    });
  }

  const from = new Date(fromDate);
  const to   = new Date(toDate);

  if (isNaN(from.getTime())) {
    throw new ValidationError(`Invalid fromDate: "${fromDate}". Use YYYY-MM-DD format.`);
  }
  if (isNaN(to.getTime())) {
    throw new ValidationError(`Invalid toDate: "${toDate}". Use YYYY-MM-DD format.`);
  }
  if (from > to) {
    throw new ValidationError('fromDate must be before or equal to toDate');
  }

  // Enforce max range — 366 days
  const diffDays = (to - from) / (1000 * 60 * 60 * 24);
  if (diffDays > 366) {
    throw new ValidationError(
      `Date range too large (${Math.ceil(diffDays)} days). Maximum is 366 days.`,
      { maxDays: 366, providedDays: Math.ceil(diffDays) }
    );
  }

  return { from, to };
}

// ============================================================
// JSON Schemas
// ============================================================

const voucherQuerySchema = {
  querystring: {
    type: 'object',
    required: ['fromDate', 'toDate'],
    properties: {
      fromDate:    { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      toDate:      { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      voucherType: { type: 'string', maxLength: 100 },
      company:     { type: 'string', maxLength: 255 },
      page:        { type: 'integer', minimum: 1, default: 1 },
      limit:       { type: 'integer', minimum: 1, maximum: 200, default: 50 },
    },
    additionalProperties: false,
  },
};

// Add custom validator for date range
const voucherQuerySchemaWithValidation = {
  querystring: {
    ...voucherQuerySchema.querystring,
    // Custom validation for date range
    customValidator: function(value) {
      if (value.fromDate && value.toDate) {
        const from = new Date(value.fromDate);
        const to = new Date(value.toDate);
        const diffDays = (to - from) / (1000 * 60 * 60 * 24);
        
        if (diffDays > 366) {
          return new Error('Date range cannot exceed 366 days');
        }
        
        if (from > to) {
          return new Error('fromDate must be before or equal to toDate');
        }
      }
      return true;
    }
  }
};

const voucherParamSchema = {
  params: {
    type: 'object',
    required: ['voucherGuid'],
    properties: {
      voucherGuid: { type: 'string', minLength: 1, maxLength: 100 },
    },
  },
};

// ============================================================
// Route plugin
// ============================================================

async function voucherRoutes(fastify) {

  /**
   * GET /api/v1/vouchers
   * Fetch vouchers within a date range.
   *
   * Example: GET /api/v1/vouchers?fromDate=2024-04-01&toDate=2024-04-30&voucherType=Sales
   */
  fastify.get('/vouchers', { 
  schema: voucherQuerySchema,
  preHandler: async (request, reply) => {
    const { fromDate, toDate } = request.query;
    
    // Additional validation for date range logic
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        reply.code(400).send({
          error: 'ValidationError',
          message: 'Invalid date format',
          details: { fromDate, toDate }
        });
        return; // Important: return to stop execution
      }
      
      if (from > to) {
        reply.code(400).send({
          error: 'ValidationError',
          message: 'fromDate must be before or equal to toDate',
          details: { fromDate, toDate }
        });
        return; // Important: return to stop execution
      }
      
      const diffDays = (to - from) / (1000 * 60 * 60 * 24);
      console.log(`🔍 DEBUG: Date range validation - from: ${from}, to: ${to}, diffDays: ${diffDays}`);
      if (diffDays > 366) {
        console.log(`🔍 DEBUG: Date range too large - ${diffDays} > 366`);
        reply.code(400).send({
          error: 'ValidationError',
          message: 'Date range cannot exceed 366 days',
          details: { maxDays: 366, providedDays: Math.ceil(diffDays) }
        });
        return; // Important: return to stop execution
      }
    }
  }
}, async (request, reply) => {
    const { fromDate, toDate, voucherType, company = '', page = 1, limit = 50 } = request.query;

    // The preHandler already validated the date range, so we can safely parse it
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const { vouchers, total, fromCache } = await voucherService.getVouchers({
      fromDate: from,
      toDate: to,
      voucherType,
      company,
    });

    const start = (page - 1) * limit;
    const paginated = vouchers.slice(start, start + limit);

    reply.header('X-Cache', fromCache ? 'HIT' : 'MISS');

    return {
      success: true,
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        dateRange: { from: fromDate, to: toDate },
        fromCache,
      },
    };
  });

  /**
   * GET /api/v1/vouchers/:voucherGuid
   * Fetch a single voucher by GUID.
   *
   * Example: GET /api/v1/vouchers/12345678-1234-1234-1234-123456789abc
   */
  fastify.get('/vouchers/:voucherGuid', { schema: voucherParamSchema }, async (request, reply) => {
    const voucherGuid = decodeURIComponent(request.params.voucherGuid);

    const { voucher, fromCache } = await voucherService.getVoucherByGuid({ voucherGuid });

    if (!voucher) {
      return reply.code(404).send({
        success: false,
        error: 'NotFound',
        message: `Voucher with GUID "${voucherGuid}" not found`,
      });
    }

    reply.header('X-Cache', fromCache ? 'HIT' : 'MISS');
    return { success: true, data: voucher, meta: { fromCache } };
  });

  /**
   * GET /api/v1/vouchers/summary
   * Returns total amounts grouped by voucher type for the date range.
   *
   * Example: GET /api/v1/vouchers/summary?fromDate=2024-04-01&toDate=2024-04-30
   *
   * Response:
   * {
   *   "Sales":    { count: 45, totalAmount: 450000 },
   *   "Payment":  { count: 12, totalAmount: 120000 },
   *   ...
   * }
   */
  fastify.get('/vouchers/summary', async (request, reply) => {
    const { fromDate, toDate, company = '' } = request.query;
    const { from, to } = validateDateRange(fromDate, toDate);

    const summary = await voucherService.getVoucherSummary({ fromDate: from, toDate: to, company });

    return {
      success: true,
      data: summary,
      meta: { dateRange: { from: fromDate, to: toDate } },
    };
  });
}

module.exports = voucherRoutes;
