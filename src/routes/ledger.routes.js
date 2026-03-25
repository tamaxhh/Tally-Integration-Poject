/**
 * src/routes/ledger.routes.js
 *
 * Fastify routes for ledger operations
 */

'use strict';

const ledgerService = require('../services/ledger/ledger.service');

/**
 * Register ledger routes with Fastify instance
 * @param {FastifyInstance} fastify - Fastify server instance
 * @param {object} options - Plugin options
 */
async function ledgerRoutes(fastify, options) {
  
  // Get all ledgers
  fastify.get('/ledgers', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          bypassCache: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { company, bypassCache } = request.query;
      const result = await ledgerService.getLedgers({ company, bypassCache });
      
      return {
        success: true,
        data: result.ledgers,
        meta: {
          total: result.total,
          fromCache: result.fromCache,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch ledgers',
        message: error.message
      };
    }
  });

  // Get ledger balances
  fastify.get('/ledgers/balances', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          from: { type: 'string' },
          to: { type: 'string' },
          bypassCache: { type: 'boolean' }
        },
        required: []
      }
    }
  }, async (request, reply) => {
    try {
      const { company, from, to, bypassCache } = request.query;
      const result = await ledgerService.getLedgerBalances({ company, from, to, bypassCache });
      
      return {
        success: true,
        data: result.ledgers,
        meta: {
          total: result.total,
          fromCache: result.fromCache,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch ledger balances',
        message: error.message
      };
    }
  });

  // Get single ledger details
  fastify.get('/ledgers/:ledgerName', {
    schema: {
      params: {
        type: 'object',
        properties: {
          ledgerName: { type: 'string' }
        },
        required: ['ledgerName']
      },
      querystring: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          bypassCache: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { ledgerName } = request.params;
      const { company, bypassCache } = request.query;
      
      const result = await ledgerService.getLedgerByName({ 
        ledgerName, 
        company, 
        bypassCache 
      });
      
      if (!result.ledger) {
        reply.code(404);
        return {
          success: false,
          error: 'Ledger not found',
          message: `Ledger "${ledgerName}" not found`
        };
      }
      
      return {
        success: true,
        data: result.ledger,
        meta: {
          fromCache: result.fromCache,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch ledger details',
        message: error.message
      };
    }
  });

  // Get ledger transactions
  fastify.get('/ledgers/:ledgerName/transactions', {
    schema: {
      params: {
        type: 'object',
        properties: {
          ledgerName: { type: 'string' }
        },
        required: ['ledgerName']
      },
      querystring: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          from: { type: 'string' },
          to: { type: 'string' },
          bypassCache: { type: 'boolean' }
        },
        required: []
      }
    }
  }, async (request, reply) => {
    try {
      const { ledgerName } = request.params;
      const { company, from, to, bypassCache } = request.query;
      
      const result = await ledgerService.getLedgerTransactions({ 
        ledgerName, 
        company, 
        from, 
        to, 
        bypassCache 
      });
      
      return {
        success: true,
        data: result,
        meta: {
          fromCache: result.fromCache,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch ledger transactions',
        message: error.message
      };
    }
  });

  // Invalidate ledger cache
  fastify.post('/ledgers/cache/invalidate', {
    schema: {
      body: {
        type: 'object',
        properties: {
          company: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { company } = request.body;
      await ledgerService.invalidateLedgerCache(company);
      
      return {
        success: true,
        message: 'Ledger cache invalidated successfully',
        meta: {
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to invalidate cache',
        message: error.message
      };
    }
  });
}

module.exports = ledgerRoutes;
