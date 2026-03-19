/**
 * src/api/routes/ledger.routes.js
 *
 * ROUTE DESIGN PRINCIPLES:
 * -------------------------
 * 1. Routes are THIN — they handle HTTP concerns only (parsing params,
 *    calling the service, formatting the response). Zero business logic.
 *
 * 2. JSON Schema validation — Fastify validates query params BEFORE
 *    your handler runs. Invalid requests get rejected with clear errors.
 *    This is faster than manual validation and keeps handlers clean.
 *
 * 3. Consistent response envelope — every response has the same shape:
 *    { success, data, meta }. Clients always know what to expect.
 *
 * ENDPOINTS:
 * ----------
 * GET /api/v1/ledgers
 *   Query params: company (string), page (int), limit (int)
 *   Returns: paginated list of all ledgers
 *
 * GET /api/v1/ledgers/:name
 *   Path param: name (URL-encoded ledger name)
 *   Returns: single ledger details
 *
 * POST /api/v1/ledgers/sync
 *   Forces a fresh fetch from Tally, bypassing cache
 *   Returns: updated ledger list
 */

'use strict';

const ledgerService = require('../../services/ledger.service');

// ============================================================
// JSON Schema definitions for Fastify validation
// ============================================================
// Fastify uses AJV under the hood. Defining schemas here gives you:
// - Automatic request validation (400 on invalid input)
// - Automatic response serialization (faster than JSON.stringify)
// - Self-documenting API (schemas can generate OpenAPI docs)

const ledgerQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      company: { type: 'string', maxLength: 255 },
      page:    { type: 'integer', minimum: 1, default: 1 },
      limit:   { type: 'integer', minimum: 1, maximum: 500, default: 50 },
    },
    additionalProperties: false, // Reject unknown query params
  },
};

const ledgerParamSchema = {
  params: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 255 },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      company: { type: 'string', maxLength: 255 },
    },
    additionalProperties: false,
  },
};

// ============================================================
// Route plugin
// ============================================================

/**
 * @param {FastifyInstance} fastify
 */
async function ledgerRoutes(fastify) {

  /**
   * GET /api/v1/ledgers
   * Returns paginated list of all ledgers.
   */
  fastify.get('/ledgers', { schema: ledgerQuerySchema }, async (request, reply) => {
    const { company = '', page = 1, limit = 50 } = request.query;

    const { ledgers, total, fromCache } = await ledgerService.getLedgers({ company });

    // Paginate in-memory — ledger lists are typically small (< 1000 accounts)
    // For very large datasets, consider database-level pagination instead
    const start = (page - 1) * limit;
    const paginated = ledgers.slice(start, start + limit);

    // Set cache header so clients know if data is fresh
    reply.header('X-Cache', fromCache ? 'HIT' : 'MISS');

    return {
      success: true,
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        fromCache,
      },
    };
  });

  /**
   * GET /api/v1/ledgers/:name
   * Returns a single ledger by name.
   * Name must be URL-encoded: "Sundry Debtors" → "Sundry%20Debtors"
   */
  fastify.get('/ledgers/:name', { schema: ledgerParamSchema }, async (request, reply) => {
    const ledgerName = decodeURIComponent(request.params.name);
    const { company = '' } = request.query;

    const { ledger, fromCache } = await ledgerService.getLedgerByName({ ledgerName, company });

    if (!ledger) {
      return reply.code(404).send({
        success: false,
        error: 'NotFound',
        message: `Ledger "${ledgerName}" not found in Tally`,
      });
    }

    reply.header('X-Cache', fromCache ? 'HIT' : 'MISS');

    return {
      success: true,
      data: ledger,
      meta: { fromCache },
    };
  });

  /**
   * POST /api/v1/ledgers/sync
   * Force-refreshes ledger data from Tally, bypassing cache.
   * Use sparingly — this hits Tally directly.
   */
  fastify.post('/ledgers/sync', async (request, reply) => {
    const { company = '' } = request.body || {};

    request.log.info({ company }, 'Manual ledger sync triggered');

    // bypassCache: true forces a fresh Tally fetch
    const { ledgers, total } = await ledgerService.getLedgers({ company, bypassCache: true });

    return {
      success: true,
      message: `Synced ${total} ledgers from Tally`,
      data: { total },
      meta: { syncedAt: new Date().toISOString(), fromCache: false },
    };
  });
}

module.exports = ledgerRoutes;
