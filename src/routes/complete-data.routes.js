/**
 * src/routes/complete-data.routes.js
 *
 * Routes for complete Tally data export
 */

'use strict';

const { getCompleteTallyData, fetchAllMasterData, fetchAllTransactionData, fetchAllFinancialReports } = require('../services/complete-data.service');

/**
 * GET /api/v1/complete-data
 * Fetch complete Tally data (masters + transactions + reports)
 */
async function getCompleteDataRoute(request, reply) {
  try {
    const { company, fromDate, toDate, voucherType } = request.query;
    
    // Convert date strings to Date objects
    const startDate = fromDate ? new Date(fromDate) : undefined;
    const endDate = toDate ? new Date(toDate) : undefined;
    
    const completeData = await getCompleteTallyData({
      company,
      fromDate: startDate,
      toDate: endDate,
      voucherType
    });
    
    reply.send({
      success: true,
      data: completeData,
      meta: {
        fetchedAt: new Date().toISOString(),
        endpoint: '/api/v1/complete-data'
      }
    });
  } catch (error) {
    request.log.error(error, 'Error fetching complete Tally data');
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch complete Tally data',
      message: error.message
    });
  }
}

/**
 * GET /api/v1/ledgers/detailed
 * Fetch detailed ledger information
 */
async function getDetailedLedgersRoute(request, reply) {
  try {
    const { company, fromDate, toDate } = request.query;
    
    const startDate = fromDate ? new Date(fromDate) : undefined;
    const endDate = toDate ? new Date(toDate) : undefined;
    
    const masterData = await fetchAllMasterData({ company, fromDate: startDate, toDate: endDate });
    
    reply.send({
      success: true,
      data: masterData.ledgers,
      meta: {
        total: masterData.ledgers.length,
        fetchedAt: new Date().toISOString(),
        endpoint: '/api/v1/ledgers/detailed'
      }
    });
  } catch (error) {
    request.log.error(error, 'Error fetching detailed ledgers');
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch detailed ledgers',
      message: error.message
    });
  }
}

/**
 * GET /api/v1/vouchers/detailed
 * Fetch detailed voucher information with all entries
 */
async function getDetailedVouchersRoute(request, reply) {
  try {
    const { company, fromDate, toDate, voucherType } = request.query;
    
    const startDate = fromDate ? new Date(fromDate) : undefined;
    const endDate = toDate ? new Date(toDate) : undefined;
    
    const transactionData = await fetchAllTransactionData({
      company,
      fromDate: startDate,
      toDate: endDate,
      voucherType
    });
    
    reply.send({
      success: true,
      data: transactionData.vouchers,
      meta: {
        total: transactionData.vouchers.length,
        fetchedAt: new Date().toISOString(),
        endpoint: '/api/v1/vouchers/detailed'
      }
    });
  } catch (error) {
    request.log.error(error, 'Error fetching detailed vouchers');
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch detailed vouchers',
      message: error.message
    });
  }
}

/**
 * GET /api/v1/groups
 * Fetch account groups hierarchy
 */
async function getGroupsRoute(request, reply) {
  try {
    const { company } = request.query;
    
    const masterData = await fetchAllMasterData({ company });
    
    reply.send({
      success: true,
      data: masterData.groups,
      meta: {
        total: masterData.groups.length,
        fetchedAt: new Date().toISOString(),
        endpoint: '/api/v1/groups'
      }
    });
  } catch (error) {
    request.log.error(error, 'Error fetching groups');
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch groups',
      message: error.message
    });
  }
}

/**
 * GET /api/v1/stock-items
 * Fetch stock/inventory items
 */
async function getStockItemsRoute(request, reply) {
  try {
    const { company } = request.query;
    
    const masterData = await fetchAllMasterData({ company });
    
    reply.send({
      success: true,
      data: masterData.stockItems,
      meta: {
        total: masterData.stockItems.length,
        fetchedAt: new Date().toISOString(),
        endpoint: '/api/v1/stock-items'
      }
    });
  } catch (error) {
    request.log.error(error, 'Error fetching stock items');
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch stock items',
      message: error.message
    });
  }
}

/**
 * GET /api/v1/companies
 * Fetch company information
 */
async function getCompaniesRoute(request, reply) {
  try {
    const masterData = await fetchAllMasterData();
    
    reply.send({
      success: true,
      data: masterData.companies,
      meta: {
        total: masterData.companies.length,
        fetchedAt: new Date().toISOString(),
        endpoint: '/api/v1/companies'
      }
    });
  } catch (error) {
    request.log.error(error, 'Error fetching companies');
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch companies',
      message: error.message
    });
  }
}

/**
 * GET /api/v1/reports/all
 * Fetch all financial reports
 */
async function getAllReportsRoute(request, reply) {
  try {
    const { company, fromDate, toDate } = request.query;
    
    const startDate = fromDate ? new Date(fromDate) : undefined;
    const endDate = toDate ? new Date(toDate) : undefined;
    
    const reportsData = await fetchAllFinancialReports({
      company,
      fromDate: startDate,
      toDate: endDate
    });
    
    reply.send({
      success: true,
      data: reportsData,
      meta: {
        totalReports: Object.keys(reportsData).length,
        fetchedAt: new Date().toISOString(),
        endpoint: '/api/v1/reports/all'
      }
    });
  } catch (error) {
    request.log.error(error, 'Error fetching all reports');
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch all reports',
      message: error.message
    });
  }
}

/**
 * GET /api/v1/reports/day-book
 * Fetch Day Book report
 */
async function getDayBookRoute(request, reply) {
  try {
    const { company, fromDate, toDate } = request.query;
    
    if (!fromDate || !toDate) {
      return reply.code(400).send({
        success: false,
        error: 'Missing required parameters',
        message: 'fromDate and toDate are required'
      });
    }
    
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
    const reportsData = await fetchAllFinancialReports({
      company,
      fromDate: startDate,
      toDate: endDate
    });
    
    reply.send({
      success: true,
      data: reportsData.dayBook,
      meta: {
        dateRange: { fromDate, toDate },
        fetchedAt: new Date().toISOString(),
        endpoint: '/api/v1/reports/day-book'
      }
    });
  } catch (error) {
    request.log.error(error, 'Error fetching Day Book report');
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch Day Book report',
      message: error.message
    });
  }
}

/**
 * GET /api/v1/reports/cash-book
 * Fetch Cash Book report
 */
async function getCashBookRoute(request, reply) {
  try {
    const { company, fromDate, toDate } = request.query;
    
    if (!fromDate || !toDate) {
      return reply.code(400).send({
        success: false,
        error: 'Missing required parameters',
        message: 'fromDate and toDate are required'
      });
    }
    
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
    const reportsData = await fetchAllFinancialReports({
      company,
      fromDate: startDate,
      toDate: endDate
    });
    
    reply.send({
      success: true,
      data: reportsData.cashBook,
      meta: {
        dateRange: { fromDate, toDate },
        fetchedAt: new Date().toISOString(),
        endpoint: '/api/v1/reports/cash-book'
      }
    });
  } catch (error) {
    request.log.error(error, 'Error fetching Cash Book report');
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch Cash Book report',
      message: error.message
    });
  }
}

/**
 * GET /api/v1/reports/bank-book
 * Fetch Bank Book report
 */
async function getBankBookRoute(request, reply) {
  try {
    const { company, fromDate, toDate } = request.query;
    
    if (!fromDate || !toDate) {
      return reply.code(400).send({
        success: false,
        error: 'Missing required parameters',
        message: 'fromDate and toDate are required'
      });
    }
    
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
    const reportsData = await fetchAllFinancialReports({
      company,
      fromDate: startDate,
      toDate: endDate
    });
    
    reply.send({
      success: true,
      data: reportsData.bankBook,
      meta: {
        dateRange: { fromDate, toDate },
        fetchedAt: new Date().toISOString(),
        endpoint: '/api/v1/reports/bank-book'
      }
    });
  } catch (error) {
    request.log.error(error, 'Error fetching Bank Book report');
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch Bank Book report',
      message: error.message
    });
  }
}

// Register all routes
async function completeDataRoutes(fastify, options) {
  // Complete data export
  fastify.get('/complete-data', getCompleteDataRoute);
  
  // Detailed master data
  fastify.get('/ledgers/detailed', getDetailedLedgersRoute);
  fastify.get('/vouchers/detailed', getDetailedVouchersRoute);
  fastify.get('/groups', getGroupsRoute);
  fastify.get('/stock-items', getStockItemsRoute);
  fastify.get('/companies', getCompaniesRoute);
  
  // All financial reports
  fastify.get('/reports/all', getAllReportsRoute);
}

module.exports = completeDataRoutes;
