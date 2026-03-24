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

  // Simple API key check decorator
  fastify.addHook('preHandler', (req, reply, done) => {
    const apiKey = req.query.apiKey;
    const allowedKeys = (process.env.API_KEYS || 'dev-key-local-only').split(',').map(k => k.trim());
    if (!apiKey || !allowedKeys.includes(apiKey)) {
      reply.code(401).send({ error: 'Unauthorized', message: 'Valid apiKey required' });
    } else {
      done();
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
      const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
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
            <FETCH>*</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
      
      const response = await axios.post(`http://${tallyUrl}`, xmlRequest, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 10000
      });
      
      // Debug: Log the raw XML response
      console.log('Raw Tally Response:', response.data);
      
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
      
      // The data is directly under COLLECTION, not TALLYMESSAGE
      if (result.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER) {
        const ledgerData = result.ENVELOPE.BODY.DATA.COLLECTION.LEDGER;
        ledgers = Array.isArray(ledgerData) ? ledgerData : [ledgerData];
        console.log('Found ledgers directly under COLLECTION:', ledgers.length);
      } else if (result.ENVELOPE?.BODY?.DATA?.TALLYMESSAGE) {
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
          openingBalance: ledger.OPENINGBALANCE || null,
          closingBalance: ledger.CLOSINGBALANCE || null,
          parent: ledger.PARENT || null,
          guid: ledger.GUID || null
        };
      });
      
      console.log(`Extracted ${cleanLedgers.length} ledgers. First few:`, cleanLedgers.slice(0, 3));
      
      reply.send({ success: true, ledgers: cleanLedgers, count: cleanLedgers.length });
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

