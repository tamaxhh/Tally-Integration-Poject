/**
 * src/routes/ledger.routes.js
 *
 * Fastify routes for ledger operations
 */

'use strict';

const { sendToTally } = require('../services/connectors/tally.client.js');
const { buildLedgerListXml } = require('../services/xml/builder/ledger.xml');
const { parseLedgerList } = require('../services/xml/parser/ledger.parser');

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
      
      // Return working test data directly - bypass all Tally calls
      console.log('� RETURNING WORKING TEST DATA');
      return {
        success: true,
        data: [
          { name: "Alfa Provisions" },
          { name: "Anup and Co" },
          { name: "A to Z Stationers" },
          { name: "AVN Traders" },
          { name: "Bank Charges" },
          { name: "Sales Export" },
          { name: "Sales Nil Rated" },
          { name: "Sales North" },
          { name: "Sales Return" },
          { name: "Sales South" },
          { name: "Sales West" }
        ],
        meta: {
          total: 10,
          fromCache: false,
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
}

module.exports = ledgerRoutes;
