/**
 * web-app.js
 *
 * Simple web server to serve the HTML UI with the API
 * This serves the frontend files while the API runs on port 3000
 */

'use strict';

const fastify = require('fastify');
const path = require('path');

async function startWebApp() {
  const app = fastify({
    logger: false
  });

  // Serve static files from public directory
  await app.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/public/'
  });

  // Main route - redirect to UI
  app.get('/', async (request, reply) => {
    return reply.redirect('/public/index.html');
  });

  // Health check for web server
  app.get('/web-health', async (request, reply) => {
    return { 
      status: 'ok', 
      service: 'web-ui',
      timestamp: new Date().toISOString()
    };
  });

  try {
    // Run on different port to avoid conflict with API
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🌐 Web UI running at: http://localhost:3001');
    console.log('📱 Main page: http://localhost:3001/public/index.html');
    console.log('🔗 API should be running at: http://localhost:3000');
  } catch (err) {
    console.error('❌ Failed to start web app:', err);
    process.exit(1);
  }
}

startWebApp();
