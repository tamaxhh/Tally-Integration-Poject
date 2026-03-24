const express = require('express');
const healthRoutes = require('./health.routes');
const reportRoutes = require('./report.routes');
const voucherRoutes = require('./voucher.routes');

function setupRoutes(app) {
  // Health check routes (no auth required)
  app.use('/health', healthRoutes);
  
  // API routes (auth required)
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/vouchers', voucherRoutes);
  
  return app;
}

module.exports = setupRoutes;