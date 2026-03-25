'use strict';

async function start() {
  const fastify = require('fastify')({ logger: true });

  // Add CORS for local HTML file:// access (dev only)
  await fastify.register(require('@fastify/cors'), { origin: true });

  fastify.get('/health/live', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  fastify.get('/health/ready', async (request, reply) => {
    return { status: 'ready', timestamp: new Date().toISOString() };
  });

  fastify.get('/health', async (request, reply) => {
    return { status: 'healthy' };
  });

  // Simple API key check decorator (exclude health endpoints)
  fastify.addHook('preHandler', (req, reply, done) => {
    // Skip auth for health endpoints
    if (req.url.startsWith('/health')) {
      return done();
    }
    
    const apiKey = req.query.apiKey;
    const allowedKeys = (process.env.API_KEYS || 'dev-key-local-only').split(',').map(k => k.trim());
    if (!apiKey || !allowedKeys.includes(apiKey)) {
      reply.code(401).send({ error: 'Unauthorized', message: 'Valid apiKey required' });
    } else {
      done();
    }
  });

  // Ledger transactions endpoint - complete transaction history
  fastify.get('/api/v1/ledger-transactions', async (request, reply) => {
    try {
      const axios = require('axios');
      const XMLParser = require('fast-xml-parser').XMLParser;
      
      // API key check
      const apiKey = request.query.apiKey;
      const allowedKeys = (process.env.API_KEYS || 'dev-key-local-only').split(',').map(k => k.trim());
      if (!apiKey || !allowedKeys.includes(apiKey)) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'Valid apiKey required' });
      }
      
      const { ledgerName, from, to } = request.query;
      if (!ledgerName) {
        return reply.code(400).send({ error: 'Ledger name is required' });
      }
      
      const tallyHost = process.env.TALLY_HOST || 'host.docker.internal';
      const tallyPort = process.env.TALLY_PORT || '9000';
      const tallyUrl = `${tallyHost}:${tallyPort}`;
      
      // For now, return mock data structure matching your expected format
      // In production, this would be replaced with actual Tally XML requests
      const companyName = "Venkateshwara Traders"; // From your example
      
      // Process ledger data into transaction format
      const transactions = [];
      let totalDebit = 0;
      let totalCredit = 0;
      
      // Create mock transaction data matching your expected format
      // This simulates the structure you want - in production, replace with real Tally voucher parsing
      const mockTransactions = [
        {
          date: "2024-04-01",
          particulars: "Sales",
          voucher_type: "Sales",
          voucher_no: 108,
          debit: 53500.00,
          credit: 0
        },
        {
          date: "2024-04-01",
          particulars: "Bank of Baroda-Savings A/c",
          voucher_type: "Receipt",
          voucher_no: 66,
          debit: 0,
          credit: 53500.00
        },
        {
          date: "2024-04-02",
          particulars: "Sales",
          voucher_type: "Sales",
          voucher_no: 109,
          debit: 53500.00,
          credit: 0
        },
        {
          date: "2024-04-03",
          particulars: "Bank of Baroda-Savings A/c",
          voucher_type: "Receipt",
          voucher_no: 67,
          debit: 0,
          credit: 53500.00
        }
      ];
      
      // Calculate totals from mock data
      totalDebit = mockTransactions.reduce((sum, t) => sum + t.debit, 0);
      totalCredit = mockTransactions.reduce((sum, t) => sum + t.credit, 0);
      const openingBalance = 148912.00; // From your example
      const closingBalance = openingBalance + totalDebit - totalCredit;
      
      transactions.push(...mockTransactions);
      
      const startTime = Date.now();
      
      reply.send({ 
        success: true, 
        ledger: {
          name: ledgerName,
          company: companyName,
          period: {
            from: from || '2021-03-01',
            to: to || '2021-03-31'
          }
        },
        transactions: transactions,
        summary: {
          opening_balance: openingBalance,
          total_debit: totalDebit,
          total_credit: totalCredit,
          closing_balance: closingBalance
        },
        meta: {
          ledgerName: ledgerName,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Ledger transactions fetch failed', message: err.message });
    }
  });

  // Comprehensive ledger details endpoint
  fastify.get('/api/v1/ledger-details', async (request, reply) => {
    try {
      const axios = require('axios');
      const XMLParser = require('fast-xml-parser').XMLParser;
      
      // API key check
      const apiKey = request.query.apiKey;
      const allowedKeys = (process.env.API_KEYS || 'dev-key-local-only').split(',').map(k => k.trim());
      if (!apiKey || !allowedKeys.includes(apiKey)) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'Valid apiKey required' });
      }
      
      const tallyHost = process.env.TALLY_HOST || 'host.docker.internal';
      const tallyPort = process.env.TALLY_PORT || '9000';
      const tallyUrl = `${tallyHost}:${tallyPort}`;
      
      const { ledgerName } = request.query;
      if (!ledgerName) {
        return reply.code(400).send({ error: 'Ledger name is required' });
      }
      
      // Build detailed ledger request
      const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>Ledger Details</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Ledger Details" ISMODIFY="No">
            <TYPE>Ledger</TYPE>
            <FETCH>*</FETCH>
            <FILTER>NAME = "${ledgerName}"</FILTER>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
      
      const startTime = Date.now();
      const response = await axios.post(`http://${tallyUrl}`, xmlRequest, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 10000
      });
      
      const parser = new XMLParser();
      const result = parser.parse(response.data);
      
      reply.send({ 
        success: true, 
        ledger: result,
        meta: {
          ledgerName: ledgerName,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Ledger details fetch failed', message: err.message });
    }
  });

  // Tally Ledgers endpoint
  fastify.get('/api/v1/ledgers', async (request, reply) => {
    try {
      const axios = require('axios');
      const XMLParser = require('fast-xml-parser').XMLParser;
      
      const tallyHost = process.env.TALLY_HOST || 'host.docker.internal';
      const tallyPort = process.env.TALLY_PORT || '9000';
      const tallyUrl = `${tallyHost}:${tallyPort}`;
      // Build Tally XML request based on type
      function buildTallyRequest(type = 'TrialBalance', options = {}) {
        const requests = {
          TrialBalance: {
            id: 'Trial Balance',
            fetch: '<FETCH>*</FETCH>',
            staticVars: options.dateRange 
              ? `<STATICVARIABLES><SVFROMDATE>${options.from}</SVFROMDATE><SVTODATE>${options.to}</SVTODATE></STATICVARIABLES>`
              : '<STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>'
          },
          LedgerBalance: {
            id: 'Ledger Balance',
            fetch: '<FETCH>NAME,OPENINGBALANCE,CLOSINGBALANCE,CURRENTBALANCE,PARENT,GUID</FETCH>',
            staticVars: '<STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>'
          },
          ListOfLedgers: {
            id: 'List of Ledgers', 
            fetch: '<FETCH>NAME</FETCH>',
            staticVars: '<STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>'
          }
        };
        
        const config = requests[type] || requests.TrialBalance;
        
        return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>${config.id}</ID>
  </HEADER>
  <BODY>
    <DESC>
      ${config.staticVars}
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="${config.id}" ISMODIFY="No">
            <TYPE>Ledger</TYPE>
            ${config.fetch}
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
      }
      
      const requestType = request.query.type || process.env.TALLY_REQUEST_TYPE || 'LedgerBalance';
      const includeBalances = request.query.includeBalances !== 'false';
      const effectiveType = includeBalances ? 'LedgerBalance' : 'ListOfLedgers';
      const from = request.query.from;
      const to = request.query.to;
      const xmlRequest = buildTallyRequest(effectiveType, { from, to });
      
      const startTime = Date.now();
      
      const response = await axios.post(`http://${tallyUrl}`, xmlRequest, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 10000
      });
      
      // Debug: Log the raw XML response
      console.log('=== RAW TALLY XML RESPONSE ===');
      console.log(response.data);
      console.log('=== END RAW RESPONSE ===');
      
      const parser = new XMLParser();
      const result = parser.parse(response.data);
      
      // Debug: Log the parsed result
      console.log('Parsed Result (first 1000 chars):', JSON.stringify(result, null, 2).substring(0, 1000));
      
      // Debug: Check if we have TALLYMESSAGE
      if (result.ENVELOPE?.BODY?.DATA?.TALLYMESSAGE) {
        console.log('Found TALLYMESSAGE!');
        const tallyMessage = Array.isArray(result.ENVELOPE.BODY.DATA.TALLYMESSAGE) 
          ? result.ENVELOPE.BODY.DATA.TALLYMESSAGE 
          : [result.ENVELOPE.BODY.DATA.TALLYMESSAGE];
        
        console.log('TALLYMESSAGE length:', tallyMessage.length);
        console.log('First TALLYMESSAGE keys:', Object.keys(tallyMessage[0] || {}));
        
        if (tallyMessage[0]?.COLLECTION) {
          console.log('Found COLLECTION!');
          console.log('COLLECTION keys:', Object.keys(tallyMessage[0].COLLECTION));
          
          if (tallyMessage[0].COLLECTION.LEDGER) {
            console.log('Found LEDGER!');
            console.log('LEDGER type:', typeof tallyMessage[0].COLLECTION.LEDGER);
            console.log('LEDGER is array:', Array.isArray(tallyMessage[0].COLLECTION.LEDGER));
          }
        }
      } else {
        console.log('No TALLYMESSAGE found!');
        console.log('Available paths:', Object.keys(result.ENVELOPE?.BODY?.DATA || {}));
      }
      
      // Extract ledgers from the actual Tally response structure
      let ledgers = [];
      
      // Handle Trial Balance format
      if (result.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER) {
        const ledgerData = result.ENVELOPE.BODY.DATA.COLLECTION.LEDGER;
        ledgers = Array.isArray(ledgerData) ? ledgerData : [ledgerData];
        console.log('Found ledgers in Trial Balance format:', ledgers.length);
      }
      // Fallback to regular ledger list format
      else if (result.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER) {
        const ledgerData = result.ENVELOPE.BODY.DATA.COLLECTION.LEDGER;
        ledgers = Array.isArray(ledgerData) ? ledgerData : [ledgerData];
        console.log('Found ledgers in regular format:', ledgers.length);
      }
      else if (result.ENVELOPE?.BODY?.DATA?.TALLYMESSAGE) {
        // Fallback to the old structure
        const tallyMessage = Array.isArray(result.ENVELOPE.BODY.DATA.TALLYMESSAGE) 
          ? result.ENVELOPE.BODY.DATA.TALLYMESSAGE 
          : [result.ENVELOPE.BODY.DATA.TALLYMESSAGE];
        
        // Extract LEDGER objects from COLLECTION
        ledgers = tallyMessage
          .map(msg => msg.COLLECTION?.LEDGER)
          .filter(ledger => ledger)
          .flat();
        console.log('Found ledgers under TALLYMESSAGE:', ledgers.length);
      }
      
      // Clean up ledger data - extract names from the nested LANGUAGENAME structure
      // Helper function to parse Tally amounts
        function parseTallyAmount(value) {
          if (!value || value === '') return null;
          
          // Handle Tally's negative amounts in parentheses
          if (typeof value === 'string') {
            value = value.trim();
            if (value.startsWith('(') && value.endsWith(')')) {
              return -parseFloat(value.slice(1, -1));
            }
            return parseFloat(value) || null;
          }
          return value;
        }
      
      const cleanLedgers = ledgers.map((ledger, index) => {
        let name = 'Unknown';
        
        // Debug first few ledgers to understand structure
        if (index < 3) {
          console.log(`Ledger ${index} structure:`, JSON.stringify(ledger, null, 2));
        }
        
        // Extract name from the nested structure we saw in logs
        if (ledger['LANGUAGENAME.LIST']?.['NAME.LIST']?.NAME) {
          // Handle the keys with dots in them
          name = ledger['LANGUAGENAME.LIST']['NAME.LIST'].NAME.replace(/&#13;&#10;/g, '').trim();
        } else if (ledger.LANGUAGENAME?.LIST?.NAME?.LIST) {
          const nameList = Array.isArray(ledger.LANGUAGENAME.LIST.NAME.LIST) 
            ? ledger.LANGUAGENAME.LIST.NAME.LIST 
            : [ledger.LANGUAGENAME.LIST.NAME.LIST];
          
          if (nameList.length > 0 && nameList[0].NAME) {
            name = nameList[0].NAME.replace(/&#13;&#10;/g, '').trim();
          }
        } else if (ledger.NAME) {
          name = ledger.NAME.replace(/&#13;&#10;/g, '').trim();
        } else if (ledger.LANGUAGENAME?.LIST?.NAME) {
          // Try direct path
          name = ledger.LANGUAGENAME.LIST.NAME.replace(/&#13;&#10;/g, '').trim();
        }
        
        return {
          name: name || 'Unknown',
          openingBalance: parseTallyAmount(ledger.OPENINGBALANCE),
          closingBalance: parseTallyAmount(ledger.CLOSINGBALANCE),
          currentBalance: parseTallyAmount(ledger.CURRENTBALANCE),
          parent: ledger.PARENT || ledger.PARENTNAME || ledger.GROUP || null,
          guid: ledger.GUID || ledger.ID || ledger.UNIQUEID || null
        };
      });
      
      console.log(`Extracted ${cleanLedgers.length} ledgers. First few:`, cleanLedgers.slice(0, 3));
      
      reply.send({ 
        success: true, 
        ledgers: cleanLedgers, 
        count: cleanLedgers.length,
        meta: {
          requestType: effectiveType,
          includeBalances: includeBalances,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Tally fetch failed', message: err.message });
    }
  });

  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port 3000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

