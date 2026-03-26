'use strict';

const { buildServer } = require('./app');

async function start() {
  let server;
  try {
    server = await buildServer();
    
    await server.listen({ port: 3000, host: '0.0.0.0' });
    server.log.info('Server listening on port 3000');
  } catch (err) {
    if (server) {
      server.log.error(err);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

start();
