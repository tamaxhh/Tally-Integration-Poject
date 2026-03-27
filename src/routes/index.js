const express = require('express');
const healthRoutes = require('./health.routes');
const reportRoutes = require('./report.routes');
const voucherRoutes = require('./voucher.routes');
const ledgerRoutes = require('./ledger.routes');

function setupRoutes(app) {
  // Health check routes (no auth required)
  app.use('/health', healthRoutes);
  
  // API routes (auth required)
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/vouchers', voucherRoutes);
  app.use('/api/v1/ledgers', ledgerRoutes);
  
  // Note: Groups routes are now registered in app.js using Fastify plugin system
  
  return app;
}

module.exports = setupRoutes;