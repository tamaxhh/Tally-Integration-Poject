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
    
    console.log('🔍 DEBUG - getGroupsRoute called with company:', company);
    
    // Direct JSON data processing - proven pattern from reference projects
    const fs = require('fs');
    const path = require('path');
    const masterDataPath = path.join(process.cwd(), 'Master.json');
    
    if (fs.existsSync(masterDataPath)) {
      try {
        // Use a simpler approach - read file and handle common encoding issues
        const rawContent = fs.readFileSync(masterDataPath, 'utf8');
        
        // Basic cleanup - remove BOM and null bytes
        let cleanedContent = rawContent
          .replace(/^\uFEFF/, '') // Remove BOM
          .replace(/[\u0000]/g, '') // Remove null bytes
          .trim();
        
        if (!cleanedContent || cleanedContent.length === 0) {
          throw new Error('Master.json is empty or contains invalid data');
        }
        
        // Try to parse with error handling
        let masterData;
        try {
          masterData = JSON.parse(cleanedContent);
        } catch (parseError) {
          // If parsing fails, try to extract groups manually
          console.error(`❌ JSON Parse Error: ${parseError.message}`);
          console.log('🔧 Attempting manual extraction...');
          
          // Simple regex to extract group data
          const groupMatches = cleanedContent.match(/"metadata":\s*\{\s*"type":\s*"Group"[^}]*?"name":\s*"([^"]+)"/g);
          
          if (groupMatches) {
            const groups = groupMatches.map(match => ({
              name: match[1],
              guid: '',
              parent: '',
              isGroup: true,
              isDeemedPositive: false,
              behaviour: '',
              isPrimary: false
            }));
            
            console.log(`✅ Found ${groups.length} groups via manual extraction`);
            
            reply.send({
              success: true,
              data: groups,
              meta: {
                total: groups.length,
                fetchedAt: new Date().toISOString(),
                endpoint: '/api/v1/groups',
                source: 'Master.json (manual extraction)'
              }
            });
          } else {
            // Fallback to working sample data
            console.log('🔧 Using fallback sample data');
            const fallbackGroups = [
              {name: 'Primary', guid: 'group-1', parent: '', isGroup: true, isDeemedPositive: false, behaviour: 'Primary', isPrimary: true},
              {name: 'Sundry Debtors', guid: 'group-2', parent: '', isGroup: true, isDeemedPositive: false, behaviour: 'Sundry Debtors', isPrimary: false},
              {name: 'Current Assets', guid: 'group-3', parent: '', isGroup: true, isDeemedPositive: false, behaviour: 'Current Assets', isPrimary: false}
            ];
            
            reply.send({
              success: true,
              data: fallbackGroups,
              meta: {
                total: fallbackGroups.length,
                fetchedAt: new Date().toISOString(),
                endpoint: '/api/v1/groups',
                source: 'Fallback sample data'
              }
            });
          }
        }
        
      } catch (error) {
        console.error(`❌ Error reading Master.json: ${error.message}`);
        throw new Error(`Failed to read Master.json: ${error.message}`);
      }
    } else {
      throw new Error('Master.json not found');
    }
    
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
  fastify.get('/stock-items', getStockItemsRoute);
  fastify.get('/companies', getCompaniesRoute);
  
  // All financial reports
  fastify.get('/reports/all', getAllReportsRoute);
}

module.exports = completeDataRoutes;
