/**
 * src/services/complete-data.service.js
 *
 * Complete Tally Data Export Service
 * Fetches all company data in parallel for complete data warehouse
 */

'use strict';

const { sendToTally } = require('./connectors/tally.client.js');
const { parseXml, parseAmount, safeGet, ensureArray } = require('./xml/parser/index');
const cacheManager = require('../cache/simple-cache');
const config = require('../../config');
const logger = require('../config/logger');

// Import all XML builders
const { buildDetailedLedgerXml } = require('./xml/builder/ledger.xml');
const { buildDetailedVoucherXml } = require('./xml/builder/voucher.xml');
const { buildGroupsListXml } = require('./xml/builder/groups.xml');
const { buildStockItemsListXml } = require('./xml/builder/stock.xml');
const { buildCompaniesListXml } = require('./xml/builder/company.xml');
const { buildExportEnvelope } = require('./xml/builder/ledger.xml');
const { 
  buildDayBookXml, 
  buildCashBookXml, 
  buildBankBookXml, 
  buildSalesRegisterXml, 
  buildPurchaseRegisterXml 
} = require('./xml/builder/all-reports.xml');

const CACHE_PREFIX = 'tally:complete';

/**
 * Generic data fetcher with timeout and error handling
 */
async function fetchDataWithTimeout(xmlBuilder, params, timeout = 60000) {
  try {
    const xml = xmlBuilder(params);
    logger.debug({ xmlLength: xml.length }, 'Sending XML to Tally');
    const xmlResponse = await sendToTally(xml, { timeout });
    return parseXml(xmlResponse);
  } catch (error) {
    logger.error({ error: error.message, params }, 'Failed to fetch data from Tally');
    throw error;
  }
}

/**
 * Fetch complete master data (ledgers, groups, stock items, companies)
 */
async function fetchAllMasterData({ company, fromDate, toDate } = {}) {
  logger.info({ company }, 'Fetching all master data from Tally');
  
  const [ledgersData, groupsData, stockItemsData, companiesData] = await Promise.all([
    fetchDataWithTimeout(buildDetailedLedgerXml, { company, fromDate, toDate }),
    fetchDataWithTimeout(buildGroupsListXml, { company }),
    fetchDataWithTimeout(buildStockItemsListXml, { company }),
    fetchDataWithTimeout(buildCompaniesListXml, {})
  ]);

  return {
    ledgers: parseLedgerData(ledgersData),
    groups: parseGroupData(groupsData),
    stockItems: parseStockItemData(stockItemsData),
    companies: parseCompanyData(companiesData)
  };
}

/**
 * Fetch complete transaction data (all vouchers with details)
 */
async function fetchAllTransactionData({ company, fromDate, toDate, voucherType } = {}) {
  logger.info({ company, fromDate, toDate, voucherType }, 'Fetching all transaction data from Tally');
  
  const vouchersData = await fetchDataWithTimeout(buildDetailedVoucherXml, {
    company, fromDate, toDate, voucherType
  });

  return {
    vouchers: parseVoucherData(vouchersData)
  };
}

/**
 * Fetch all financial reports
 */
async function fetchAllFinancialReports({ company, fromDate, toDate } = {}) {
  logger.info({ company, fromDate, toDate }, 'Fetching all financial reports from Tally');
  
  const [trialBalance, profitLoss, balanceSheet, dayBook, cashBook, bankBook, salesRegister, purchaseRegister] = await Promise.all([
    fetchDataWithTimeout(buildExportEnvelope, { reportName: 'Trial Balance', fromDate, toDate, company }),
    fetchDataWithTimeout(buildExportEnvelope, { reportName: 'Profit & Loss', fromDate, toDate, company }),
    fetchDataWithTimeout(buildExportEnvelope, { reportName: 'Balance Sheet', fromDate, toDate, company }),
    fetchDataWithTimeout(buildDayBookXml, { fromDate, toDate, company }),
    fetchDataWithTimeout(buildCashBookXml, { fromDate, toDate, company }),
    fetchDataWithTimeout(buildBankBookXml, { fromDate, toDate, company }),
    fetchDataWithTimeout(buildSalesRegisterXml, { fromDate, toDate, company }),
    fetchDataWithTimeout(buildPurchaseRegisterXml, { fromDate, toDate, company })
  ]);

  return {
    trialBalance: parseReportData(trialBalance),
    profitLoss: parseReportData(profitLoss),
    balanceSheet: parseReportData(balanceSheet),
    dayBook: parseReportData(dayBook),
    cashBook: parseReportData(cashBook),
    bankBook: parseReportData(bankBook),
    salesRegister: parseReportData(salesRegister),
    purchaseRegister: parseReportData(purchaseRegister)
  };
}

/**
 * Main function to fetch complete Tally data
 */
async function getCompleteTallyData({ company, fromDate, toDate, voucherType } = {}) {
  const cacheKey = `${CACHE_PREFIX}:complete:${company || 'default'}:${fromDate || 'all'}:${toDate || 'all'}`;
  
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    logger.debug({ cacheKey }, 'Complete data served from cache');
    return cached;
  }

  logger.info({ company, fromDate, toDate }, 'Fetching complete Tally data');
  
  const [masters, transactions, reports] = await Promise.all([
    fetchAllMasterData({ company, fromDate, toDate }),
    fetchAllTransactionData({ company, fromDate, toDate, voucherType }),
    fetchAllFinancialReports({ company, fromDate, toDate })
  ]);

  const completeData = {
    masters,
    transactions,
    reports,
    meta: {
      company: company || 'Default',
      dateRange: { 
        fromDate: fromDate ? fromDate.toISOString().split('T')[0] : null,
        toDate: toDate ? toDate.toISOString().split('T')[0] : null
      },
      fetchedAt: new Date().toISOString(),
      recordCounts: {
        ledgers: masters.ledgers.length,
        groups: masters.groups.length,
        stockItems: masters.stockItems.length,
        companies: masters.companies.length,
        vouchers: transactions.vouchers.length,
        reports: Object.keys(reports).length
      }
    }
  };

  await cacheManager.set(cacheKey, completeData, config.redis.ttlSeconds * 2); // Longer cache for complete data
  return completeData;
}

/**
 * Parse ledger data from XML response
 */
function parseLedgerData(xmlData) {
  const requestData = safeGet(xmlData, 'ENVELOPE.BODY.EXPORTDATA.REQUESTDATA');
  const messages = ensureArray(safeGet(requestData, 'TALLYMESSAGE'));
  
  return messages
    .map(msg => msg.LEDGER)
    .filter(Boolean)
    .map(ledger => ({
      name: ledger.NAME,
      guid: ledger.GUID,
      parent: ledger.PARENT,
      openingBalance: parseAmount(ledger.OPENINGBALANCE),
      closingBalance: parseAmount(ledger.CLOSINGBALANCE),
      currentBalance: parseAmount(ledger.CURRENTBALANCE),
      partyName: ledger.PARTYNAME,
      partyEmail: ledger.PARTYMAIL,
      partyPhone: ledger.PARTYPHONE,
      gstin: ledger.PARTYGSTIN,
      pan: ledger.PAN,
      isBillByBill: ledger.BILLBYBILL === 'Yes',
      affectsStock: ledger.AFFECTSSTOCK === 'Yes'
    }));
}

/**
 * Parse group data from XML response
 */
function parseGroupData(xmlData) {
  const requestData = safeGet(xmlData, 'ENVELOPE.BODY.EXPORTDATA.REQUESTDATA');
  const messages = ensureArray(safeGet(requestData, 'TALLYMESSAGE'));
  
  return messages
    .map(msg => msg.GROUP)
    .filter(Boolean)
    .map(group => ({
      name: group.NAME,
      guid: group.GUID,
      parent: group.PARENT,
      isGroup: group.ISGROUP === 'Yes',
      isDeemedPositive: group.ISDEEMEDPOSITIVE === 'Yes',
      behaviour: group.BEHAVIOUR,
      isPrimary: group.ISPRIMARYGROUP === 'Yes'
    }));
}

/**
 * Parse stock item data from XML response
 */
function parseStockItemData(xmlData) {
  const requestData = safeGet(xmlData, 'ENVELOPE.BODY.EXPORTDATA.REQUESTDATA');
  const messages = ensureArray(safeGet(requestData, 'TALLYMESSAGE'));
  
  return messages
    .map(msg => msg.STOCKITEM)
    .filter(Boolean)
    .map(item => ({
      name: item.NAME,
      guid: item.GUID,
      parent: item.PARENT,
      baseUnits: item.BASEUNITS,
      openingBalance: parseAmount(safeGet(item, 'OPENINGBALANCE.LIST.0.AMOUNT')),
      closingBalance: parseAmount(safeGet(item, 'CLOSINGBALANCE.LIST.0.AMOUNT')),
      rate: parseAmount(item.RATE),
      isRevenue: item.ISREVENUEITEM === 'Yes',
      isTaxable: item.ISTAXABLE === 'Yes'
    }));
}

/**
 * Parse company data from XML response
 */
function parseCompanyData(xmlData) {
  const requestData = safeGet(xmlData, 'ENVELOPE.BODY.EXPORTDATA.REQUESTDATA');
  const messages = ensureArray(safeGet(requestData, 'TALLYMESSAGE'));
  
  return messages
    .map(msg => msg.COMPANY)
    .filter(Boolean)
    .map(company => ({
      name: company.NAME,
      guid: company.GUID,
      mailingName: company.MAILINGNAME,
      address: {
        line1: company.ADDRESS1,
        line2: company.ADDRESS2,
        line3: company.ADDRESS3,
        city: company.ADDRESS4,
        state: company.STATE,
        country: company.COUNTRY,
        pincode: company.PINCODE
      },
      contact: {
        email: company.EMAIL,
        telephone: company.TELEPHONE,
        website: company.WEBSITE
      },
      taxDetails: {
        pan: company.PAN,
        tin: company.TIN,
        gst: company.SERVICETAXNUMBER
      },
      financialYear: {
        startDate: company.STARTDATE,
        yearFrom: company.FINANCIALYEARFROM
      }
    }));
}

/**
 * Parse voucher data from XML response
 */
function parseVoucherData(xmlData) {
  const requestData = safeGet(xmlData, 'ENVELOPE.BODY.EXPORTDATA.REQUESTDATA');
  const messages = ensureArray(safeGet(requestData, 'TALLYMESSAGE'));
  
  return messages
    .map(msg => msg.VOUCHER)
    .filter(Boolean)
    .map(voucher => ({
      date: voucher.DATE,
      voucherType: voucher.VOUCHERTYPENAME,
      voucherNumber: voucher.VOUCHERNUMBER,
      narration: voucher.NARRATION,
      reference: voucher.REFERENCE,
      amount: parseAmount(voucher.AMOUNT),
      ledgerEntries: ensureArray(voucher.ALLLEDGERENTRIES?.LIST).map(entry => ({
        ledgerName: entry.LEDGERNAME,
        amount: parseAmount(entry.AMOUNT),
        isDeemedPositive: entry.ISDEEMEDPOSITIVE === 'Yes'
      })),
      inventoryEntries: ensureArray(voucher.ALLINVENTORYENTRIES?.LIST).map(entry => ({
        stockItemName: entry.STOCKITEMNAME,
        quantity: parseAmount(entry.QUANTITY),
        rate: parseAmount(entry.RATE),
        amount: parseAmount(entry.AMOUNT)
      }))
    }));
}

/**
 * Parse report data from XML response
 */
function parseReportData(xmlData) {
  const requestData = safeGet(xmlData, 'ENVELOPE.BODY.EXPORTDATA.REQUESTDATA');
  const messages = ensureArray(safeGet(requestData, 'TALLYMESSAGE'));
  
  return {
    groups: messages
      .map(msg => msg.GROUP)
      .filter(Boolean)
      .map(group => ({
        name: group.NAME,
        openingBalance: parseAmount(group.OPENINGBALANCE),
        closingBalance: parseAmount(group.CLOSINGBALANCE),
        subGroups: ensureArray(group.GROUP).map(subGroup => ({
          name: subGroup.NAME,
          openingBalance: parseAmount(subGroup.OPENINGBALANCE),
          closingBalance: parseAmount(subGroup.CLOSINGBALANCE)
        }))
      }))
  };
}

module.exports = {
  getCompleteTallyData,
  fetchAllMasterData,
  fetchAllTransactionData,
  fetchAllFinancialReports
};
