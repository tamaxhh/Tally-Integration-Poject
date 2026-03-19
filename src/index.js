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
      
      const tallyUrl = process.env.TALLY_HOST || 'host.docker.internal:9000';
      const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Ledgers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
    </DESC>
  </BODY>
</ENVELOPE>`;
      
      const response = await axios.post(`http://${tallyUrl}`, xmlRequest, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 10000
      });
      
      const parser = new XMLParser();
      const result = parser.parse(response.data);
      
      // Simple extraction - adjust based on actual Tally response structure
      const ledgers = result.ENVELOPE?.BODY?.DATA?.LEDGERLIST?.LEDGER || [];
      reply.send({ success: true, ledgers, count: ledgers.length });
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

