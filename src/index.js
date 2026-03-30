'use strict';

const { buildServer } = require('./app');
const config = require('../config');

async function start() {
  let server;
  try {
    console.log('🔍 Starting Tally Integration Server...');
    console.log(`📊 Tally Configuration: ${config.tally.host}:${config.tally.port}`);
    
    // Test Tally connectivity before starting server
    console.log('🔌 Testing Tally connectivity...');
    const { isTallyOnline } = require('./services/connectors/tally.client');
    const tallyOnline = await isTallyOnline();
    
    if (!tallyOnline) {
      console.warn('⚠️  WARNING: Tally is not responding at configured address');
      console.warn(`   Expected: ${config.tally.host}:${config.tally.port}`);
      console.warn('   Please ensure:');
      console.warn('   1. Tally ERP is running');
      console.warn('   2. ODBC Server is enabled (F12 → Configure → ODBC Server Settings)');
      console.warn('   3. Port 9000 is not blocked by firewall');
      console.log('   Server will start anyway, but API calls to Tally will fail');
    } else {
      console.log('✅ Tally connectivity confirmed');
    }
    
    server = await buildServer();
    
    await server.listen({ port: config.server.port, host: config.server.host });
    server.log.info(`🚀 Server listening on ${config.server.host}:${config.server.port}`);
    server.log.info(`📊 Tally endpoint: ${config.tally.baseUrl}`);
  } catch (err) {
    if (server) {
      server.log.error(err);
    } else {
      console.error('❌ Failed to start server:', err);
    }
    process.exit(1);
  }
}

start();
