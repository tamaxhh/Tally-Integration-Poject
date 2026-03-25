/**
 * start-server.js
 *
 * Entry point for the production Fastify server
 */

'use strict';

const { buildServer } = require('./src/app');

async function start() {
  try {
    const server = await buildServer();
    
    const config = require('./config');
    const address = await server.listen({ 
      port: config.server.port, 
      host: config.server.host 
    });
    
    console.log(`🚀 Tally API Server running at: ${address}`);
    console.log(`📊 Health check: ${address}/health`);
    console.log(`📚 API docs: ${address}/api/v1/ledgers`);
    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      try {
        await server.close();
        console.log('✅ Server closed cleanly');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
