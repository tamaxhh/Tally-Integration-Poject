/**
 * src/api/server.js
 *
 * FASTIFY SERVER SETUP — PLUGIN ARCHITECTURE
 * ============================================
 * Fastify uses a plugin system where everything (routes, middleware, decorators)
 * is a plugin. This gives you:
 * - Encapsulation: plugins can have their own scope
 * - Composability: register the same server config in tests without side effects
 * - Lifecycle hooks: onRequest, preSerialization, onSend, etc.
 *
 * WHY WE EXPORT buildServer() instead of starting the server directly:
 * -----------------------------------------------------------------------
 * This pattern separates "building the server" from "starting the server".
 * Tests can call buildServer() and pass the Fastify instance to supertest
 * without actually binding to a port. The entry point (src/index.js) handles
 * the actual listen() call.
 */

'use strict';

const path = require('path');
const fastify = require('fastify');
const config = require('./config');
const logger = require('./config/logger');
const { authMiddleware } = require('./middleware/auth.middleware');
const { errorHandler } = require('./middleware/errorHandler.middleware');

// Route handlers
const healthRoutes = require('./routes/health.routes');
const ledgerRoutes = require('./routes/ledger.routes');
const voucherRoutes = require('./routes/voucher.routes');
const reportRoutes = require('./routes/report.routes');
const completeDataRoutes = require('./routes/complete-data.routes');
const groupsRoutes = require('./routes/groups.routes');

/**
 * Build and configure the Fastify server instance.
 * Does NOT start listening — call server.listen() separately.
 *
 * @returns {FastifyInstance}
 */
async function buildServer() {
  const server = fastify({
    // Use our Pino logger directly — Fastify has first-class Pino support
    logger: {
      level: config.logLevel || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    // Generate unique request IDs — invaluable for tracing requests in logs
    genReqId: () => require('crypto').randomUUID(),
    // Allow Fastify's serializer to handle BigInt (common in financial data)
    // Without this, JSON.stringify throws on BigInt values
    disableRequestLogging: false,
  });

  // ============================================================
  // Security plugins
  // ============================================================

  // helmet sets security headers: X-Content-Type-Options, X-Frame-Options, etc.
  await server.register(require('@fastify/helmet'), {
    // CSP is not needed for a pure JSON API
    contentSecurityPolicy: false,
  });

  // CORS — configure which origins can call your API
  await server.register(require('@fastify/cors'), {
    // In production, set this to your actual frontend domain(s)
    origin: config.isDev ? true : (process.env.CORS_ORIGIN || false),
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  // Static file serving for frontend (temporarily disabled for Docker debugging)
  // await server.register(require('@fastify/static'), {
  //   root: path.join(__dirname, '..', 'public'),
  //   prefix: '/', // Optional: remove prefix if you want to serve from root
  // });

  // ============================================================
  // Rate limiting
  // ============================================================
  // Prevents abuse and protects Tally from being overwhelmed.
  // 100 requests per minute per IP is generous for a data API.
  // Rate limiting with simple configuration
  await server.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: 60000, // 1 minute
    errorResponseBuilder: (request, context) => ({
      error: 'TooManyRequests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      limit: context.max,
      remaining: 0,
    }),
  });

  // ============================================================
  // Global middleware (hooks)
  // ============================================================

  // Auth runs on EVERY request before route handlers
  server.addHook('onRequest', authMiddleware);

  // ============================================================
  // Global error handler
  // ============================================================
  server.setErrorHandler(errorHandler);

  // 404 handler — when no route matches
  server.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: 'NotFound',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  // ============================================================
  // Routes — register with prefix for clean URL structure
  // ============================================================
  // All routes are versioned under /api/v1/
  // This lets you introduce /api/v2/ later without breaking existing clients

  const API_PREFIX = '/api/v1';

  await server.register(healthRoutes);                          // /health (no prefix — monitoring needs simple URL)
  await server.register(ledgerRoutes, { prefix: API_PREFIX });  // /api/v1/ledgers
  await server.register(voucherRoutes, { prefix: API_PREFIX }); // /api/v1/vouchers
  await server.register(reportRoutes, { prefix: API_PREFIX });  // /api/v1/reports
  await server.register(groupsRoutes, { prefix: API_PREFIX });  // /api/v1/groups
  
  await server.register(completeDataRoutes, { prefix: API_PREFIX }); // /api/v1/complete-data

  // Frontend API endpoints (no prefix for direct access)
  server.post('/api/test-connection', async (request, reply) => {
    try {
      console.log('🔍 DEBUG - Request body:', request.body);
      console.log('🔍 DEBUG - Request headers:', request.headers);
      
      if (!request.body) {
        return reply.code(400).send({
          success: false,
          connected: false,
          error: 'Request body missing - ensure Content-Type: application/json header is sent',
          details: 'MISSING_REQUEST_BODY'
        });
      }
      
      const { tallyUrl } = request.body || {};
      
      // Validate required field
      if (!tallyUrl) {
        return reply.code(400).send({
          success: false,
          connected: false,
          error: 'tallyUrl is required in request body',
          details: 'MISSING_TALLY_URL'
        });
      }
      
      const startTime = Date.now();
      
      // Test connection to Tally
      const axios = require('axios');
      const testXml = `<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>List of Companies</REPORTNAME></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`;
      
      await axios.post(`http://${tallyUrl}`, testXml, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 5000
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        connected: true,
        responseTime: responseTime,
        message: 'Successfully connected to Tally',
        tallyUrl: tallyUrl
      };
    } catch (error) {
      return {
        success: false,
        connected: false,
        error: error.message,
        details: error.code,
        tallyUrl: request.body?.tallyUrl || 'unknown'
      };
    }
  });

  server.get('/health', async (request, reply) => {
    try {
      const axios = require('axios');
      const startTime = Date.now();
      const response = await axios.get(`http://${process.env.TALLY_HOST}:${process.env.TALLY_PORT}`, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 5000
      });
      
      return reply.send({
        success: true,
        connected: true,
        responseTime: Date.now() - startTime,
        message: 'Successfully connected to Tally',
        tallyUrl: `${process.env.TALLY_HOST}:${process.env.TALLY_PORT}`
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error.message,
        connected: false
      });
    }
  });

  server.get('/api/full-company-data', async (request, reply) => {
    try {
      const { company } = request.query;
      
      if (!company) {
        return reply.code(400).send({
          success: false,
          error: 'Company name is required'
        });
      }
      
      console.log('🔍 DEBUG - Fetching complete company data for:', company);
      
      const { getCompleteCompanyData } = require('./services/company.service');
      const data = await getCompleteCompanyData(company);
      
      return reply.send(data);
    } catch (error) {
      console.error('❌ ERROR - Failed to fetch company data:', error);
      return reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  server.post('/api/fetch-tally-data', async (request, reply) => {
    try {
      console.log('🔍 DEBUG - Request body:', request.body);
      console.log('🔍 DEBUG - Request headers:', request.headers);
      
      if (!request.body) {
        return reply.code(400).send({
          success: false,
          error: 'Request body missing - ensure Content-Type: application/json header is sent',
          details: 'MISSING_REQUEST_BODY'
        });
      }
      
      const { tallyUrl, requestType, ledgerName, from, to } = request.body || {};
      
      // Validate required fields
      if (!tallyUrl) {
        return reply.code(400).send({
          success: false,
          error: 'tallyUrl is required in request body',
          details: 'MISSING_TALLY_URL'
        });
      }
      
      if (!requestType) {
        return reply.code(400).send({
          success: false,
          error: 'requestType is required in request body',
          details: 'MISSING_REQUEST_TYPE'
        });
      }
      
      const axios = require('axios');
      const XMLParser = require('fast-xml-parser').XMLParser;
      
      let xmlRequest = '';
      
      // Build XML request based on request type
      switch (requestType) {
        case 'ListOfLedgers':
          xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Ledgers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Ledgers" ISMODIFY="No">
            <TYPE>Ledger</TYPE>
            <FETCH>NAME</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
          break;
          
        case 'LedgerTransactions':
          if (!ledgerName) {
            return reply.code(400).send({
              success: false,
              error: 'Ledger name is required for Ledger Transactions'
            });
          }
          // Sanitize and trim ledger name
          const sanitizedLedgerName = ledgerName.trim().replace(/"/g, '&quot;');
          console.log('🔍 DEBUG - Sanitized ledger name:', sanitizedLedgerName);
          
          // Use the EXACT same XML as ListOfLedgers since it works
          xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Ledgers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Ledgers" ISMODIFY="No">
            <TYPE>Ledger</TYPE>
            <FETCH>NAME,OPENINGBALANCE,CLOSINGBALANCE</FETCH>
            <FILTER>NAME = "${sanitizedLedgerName}"</FILTER>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
          break;
          
        case 'LedgerDetails':
          if (!ledgerName) {
            return reply.code(400).send({
              success: false,
              error: 'Ledger name is required for Ledger Details'
            });
          }
          // Sanitize and trim ledger name
          const sanitizedLedgerNameDetails = ledgerName.trim().replace(/"/g, '&quot;');
          console.log('🔍 DEBUG - Sanitized ledger name:', sanitizedLedgerNameDetails);
          
          // Try a simpler XML structure similar to working ListOfLedgers
          xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>Ledger</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Ledger" ISMODIFY="No">
            <TYPE>Ledger</TYPE>
            <FETCH>NAME</FETCH>
            <FILTER>NAME = "${sanitizedLedgerNameDetails}"</FILTER>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
          break;
          
        case 'TrialBalance':
          xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>Trial Balance</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Trial Balance" ISMODIFY="No">
            <TYPE>Ledger</TYPE>
            <FETCH>NAME,OPENINGBALANCE,CLOSINGBALANCE</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
          break;
          
        default:
          return reply.code(400).send({
            success: false,
            error: 'Invalid request type'
          });
      }
      
      const startTime = Date.now();
      const response = await axios.post(`http://${tallyUrl}`, xmlRequest, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 10000
      });
      
      console.log('🔍 DEBUG - Tally response status:', response.status);
      console.log('🔍 DEBUG - Tally response length:', response.data.length);
      console.log('🔍 DEBUG - First 500 chars of response:', response.data.substring(0, 500));
      
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        parseTagValue: false,
        isArray: (tagName) => ['LEDGER', 'VOUCHER'].includes(tagName.toUpperCase()),
        trimValues: true,
      });
      
      const result = parser.parse(response.data);
      console.log('🔍 DEBUG - Parsed result keys:', Object.keys(result));
      
      let data = [];
      
      // Extract and transform data based on request type
      if (requestType === 'LedgerTransactions') {
        // Transform to business format for detailed ledger transactions
        if (result.ENVELOPE?.BODY?.DATA?.COLLECTION?.VOUCHER) {
          const vouchers = Array.isArray(result.ENVELOPE.BODY.DATA.COLLECTION.VOUCHER) 
            ? result.ENVELOPE.BODY.DATA.COLLECTION.VOUCHER 
            : [result.ENVELOPE.BODY.DATA.COLLECTION.VOUCHER];
          
          console.log('🔍 DEBUG - Found vouchers:', vouchers.length);
          
          // Extract company info from first voucher or use default
          const company = vouchers.length > 0 && vouchers[0].COMPANY ? vouchers[0].COMPANY : 'Default Company';
          
          // Calculate summary from actual vouchers
          const totalDebit = vouchers.reduce((sum, v) => sum + (parseFloat(v.DEBIT) || 0), 0);
          const totalCredit = vouchers.reduce((sum, v) => sum + (parseFloat(v.CREDIT) || 0), 0);
          const openingBalance = 0; // Will need to get this from ledger info separately if needed
          const closingBalance = openingBalance + totalDebit - totalCredit;
          
          data = [{
            ledger_name: sanitizedLedgerName,
            company: company,
            period: {
              from: from || '',
              to: to || ''
            },
            transactions: vouchers.map(v => ({
              date: v.DATE,
              particulars: v.PARTICULARS,
              voucher_type: v.VOUCHERTYPE,
              voucher_no: parseInt(v.VOUCHERNUMBER) || null,
              debit: v.DEBIT ? parseFloat(v.DEBIT) : null,
              credit: v.CREDIT ? parseFloat(v.CREDIT) : null
            })),
            summary: {
              opening_balance: openingBalance,
              total_debit: totalDebit,
              total_credit: totalCredit,
              closing_balance: closingBalance
            }
          }];
          
          console.log('🔍 DEBUG - Transformed ledger transactions:', data[0]);
        }
      } else if (result.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER) {
        const ledgerData = result.ENVELOPE.BODY.DATA.COLLECTION.LEDGER;
        data = Array.isArray(ledgerData) ? ledgerData : [ledgerData];
        console.log('🔍 DEBUG - Found ledgers:', data.length);
      } else if (result.ENVELOPE?.BODY?.DATA?.COLLECTION) {
        // Handle TrialBalance and other collection types
        const collectionData = result.ENVELOPE.BODY.DATA.COLLECTION;
        if (Array.isArray(collectionData)) {
          data = collectionData;
        } else if (typeof collectionData === 'object') {
          data = Object.values(collectionData).filter(item => typeof item === 'object' && item !== null);
        }
        console.log('🔍 DEBUG - Found collection items:', data.length);
      } else {
        console.log('🔍 DEBUG - No data found in response structure');
        console.log('🔍 DEBUG - ENVELOPE structure:', result.ENVELOPE ? 'exists' : 'missing');
        console.log('🔍 DEBUG - BODY structure:', result.ENVELOPE?.BODY ? 'exists' : 'missing');
        console.log('🔍 DEBUG - DATA structure:', result.ENVELOPE?.BODY?.DATA ? 'exists' : 'missing');
      }
      
      return {
        success: true,
        data: data,
        requestType: requestType,
        processingTime: Date.now() - startTime,
        count: data.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.code
      };
    }
  });

  // ============================================================
  // Graceful shutdown
  // ============================================================
  // On SIGTERM (Docker stop, k8s pod termination), finish in-flight requests
  // before closing. Without this, you drop requests during deployments.

  const gracefulShutdown = async (signal) => {
    logger.info({ signal }, 'Shutdown signal received — closing gracefully');
    try {
      await server.close();
      logger.info('Server closed cleanly');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
}

module.exports = { buildServer };
