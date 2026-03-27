/**
 * src/routes/ledger.routes.js
 *
 * Fastify routes for ledger operations
 */

'use strict';

const ledgerService = require('../services/ledger/ledger.service.js');

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
    console.log('🎯 API HIT - /ledgers endpoint - START');
    try {
      const { company, bypassCache } = request.query;
      console.log('📥 Request params:', { company, bypassCache });
      
      // Use the enhanced ledger service
      const result = await ledgerService.getLedgers({ company, bypassCache });
      
      return {
        success: true,
        data: result.ledgers,
        meta: {
          total: result.total,
          fromCache: result.fromCache,
          summary: result.summary,
          metadata: result.metadata,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ API ERROR:', error.message);
      reply.code(500).send({
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      });
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

  // Export ledger data to JSON file
  fastify.post('/ledgers/export', {
    schema: {
      body: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          outputDir: { type: 'string' },
          bypassCache: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { company, outputDir, bypassCache } = request.body;
      const result = await ledgerService.exportLedgerData({ company, outputDir, bypassCache });
      
      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to export ledger data',
        message: error.message
      };
    }
  });

  // Get top ledgers by balance
  fastify.get('/ledgers/top-by-balance', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          limit: { type: 'number', default: 10 },
          sortBy: { type: 'string', enum: ['absolute', 'value'], default: 'absolute' },
          bypassCache: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { company, limit, sortBy, bypassCache } = request.query;
      const result = await ledgerService.getTopLedgersByBalance({ 
        company, 
        limit: parseInt(limit) || 10, 
        sortBy, 
        bypassCache 
      });
      
      return {
        success: true,
        data: result.topLedgers,
        meta: {
          total: result.total,
          company: result.company,
          sortBy: result.sortBy,
          limit: result.limit,
          summary: result.summary,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch top ledgers by balance',
        message: error.message
      };
    }
  });
}

module.exports = ledgerRoutes;
