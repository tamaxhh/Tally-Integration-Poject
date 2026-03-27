/**
 * src/services/xml/parser/ledger.parser.js
 *
 * Parses Tally XML responses for ledger operations - Updated with working logic
 */

'use strict';

const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

/**
 * Parse ledger list XML response - Updated with working logic
 */
function parseLedgerList(xmlResponse) {
  try {
    const ledgers = [];
    
    // Extract LEDGER elements using regex - matches working logic
    const ledgerMatches = xmlResponse.match(/<LEDGER[^>]*>[\s\S]*?<\/LEDGER>/g);
    
    if (ledgerMatches) {
      ledgerMatches.forEach(ledgerXml => {
        const ledger = {};
        
        // Extract basic fields
        ledger.name = extractField(ledgerXml, 'NAME');
        ledger.guid = extractField(ledgerXml, 'GUID');
        ledger.parent = extractField(ledgerXml, 'PARENT');
        ledger.openingBalance = extractField(ledgerXml, 'OPENINGBALANCE');
        ledger.closingBalance = extractField(ledgerXml, 'CLOSINGBALANCE');
        
        // Extract detailed fields - matching standalone version
        ledger.gstin = extractField(ledgerXml, 'GSTIN');
        ledger.bankAccountNumber = extractField(ledgerXml, 'BANKACCOUNTNUMBER');
        ledger.bankName = extractField(ledgerXml, 'BANKNAME');
        ledger.pan = extractField(ledgerXml, 'PAN');
        ledger.email = extractField(ledgerXml, 'EMAIL');
        
        // Extract billing details
        const billingDetails = {};
        billingDetails.ledgerName = extractField(ledgerXml, 'LEDGERNAME');
        billingDetails.address = extractField(ledgerXml, 'ADDRESS');
        billingDetails.state = extractField(ledgerXml, 'STATE');
        billingDetails.country = extractField(ledgerXml, 'COUNTRY');
        ledger.billingDetails = billingDetails;
        
        ledgers.push(ledger);
      });
    }

    return {
      ledgers,
      total: ledgers.length,
      raw: xmlResponse,
    };
  } catch (error) {
    console.error('Error parsing ledger list:', error);
    return { ledgers: [], total: 0, error: error.message };
  }
}

/**
 * Parse single ledger XML response
 */
function parseSingleLedger(xmlResponse) {
  try {
    const data = parser.parse(xmlResponse);
    
    if (data.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER) {
      const ledger = data.ENVELOPE.BODY.DATA.COLLECTION.LEDGER;
      return {
        name: extractLedgerName(ledger),
        openingBalance: parseAmount(ledger.OPENINGBALANCE),
        closingBalance: parseAmount(ledger.CLOSINGBALANCE),
        currentBalance: parseAmount(ledger.CURRENTBALANCE),
        parent: ledger.PARENT || ledger.PARENTNAME || ledger.GROUP,
        guid: ledger.GUID || ledger.ID || ledger.UNIQUEID,
        ...extractAdditionalFields(ledger),
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing single ledger:', error);
    return null;
  }
}

/**
 * Parse ledger balance XML response
 */
function parseLedgerBalances(xmlResponse) {
  try {
    const data = parser.parse(xmlResponse);
    const ledgers = [];

    if (data.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER) {
      const ledgerData = data.ENVELOPE.BODY.DATA.COLLECTION.LEDGER;
      const ledgerArray = Array.isArray(ledgerData) ? ledgerData : [ledgerData];
      
      ledgerArray.forEach(ledger => {
        const name = extractLedgerName(ledger);
        if (name) {
          ledgers.push({
            name,
            openingBalance: parseAmount(ledger.OPENINGBALANCE),
            closingBalance: parseAmount(ledger.CLOSINGBALANCE),
            currentBalance: parseAmount(ledger.CURRENTBALANCE),
            parent: ledger.PARENT || ledger.PARENTNAME || ledger.GROUP,
            guid: ledger.GUID || ledger.ID || ledger.UNIQUEID,
          });
        }
      });
    }

    return {
      ledgers,
      total: ledgers.length,
      raw: data,
    };
  } catch (error) {
    console.error('Error parsing ledger balances:', error);
    return { ledgers: [], total: 0, error: error.message };
  }
}

/**
 * Parse ledger transactions XML response
 */
function parseLedgerTransactions(xmlResponse, ledgerName, from, to) {
  try {
    const data = parser.parse(xmlResponse);
    const transactions = [];

    // This is a simplified parser - in real implementation, you'd need to handle
    // voucher parsing which is more complex
    if (data.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER) {
      // For now, return a mock structure that matches the expected format
      // In real implementation, you'd parse actual voucher data
      return createTransactionResponse(ledgerName, from, to);
    }

    return {
      ledger: { name: ledgerName },
      transactions: [],
      summary: {
        opening_balance: 0,
        total_debit: 0,
        total_credit: 0,
        closing_balance: 0,
      },
    };
  } catch (error) {
    console.error('Error parsing ledger transactions:', error);
    return {
      ledger: { name: ledgerName },
      transactions: [],
      summary: {
        opening_balance: 0,
        total_debit: 0,
        total_credit: 0,
        closing_balance: 0,
      },
      error: error.message,
    };
  }
}

/**
 * Helper function to extract field value from XML - from working logic
 */
function extractField(xml, fieldName) {
  const regex = new RegExp(`<${fieldName}[^>]*>([^<]*)<\/${fieldName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Helper function to parse Tally amounts
 */
function parseAmount(value) {
  if (!value || value === '') return null;
  
  if (typeof value === 'string') {
    value = value.trim();
    // Handle Tally's negative amounts in parentheses
    if (value.startsWith('(') && value.endsWith(')')) {
      return -parseFloat(value.slice(1, -1));
    }
    return parseFloat(value) || null;
  }
  
  return value;
}

/**
 * Extract additional fields from ledger data
 */
function extractAdditionalFields(ledger) {
  const additional = {};
  
  // Extract commonly used fields
  const fields = [
    'ADDRESS', 'MAILINGNAME', 'PHONE', 'EMAIL', 'GSTIN', 'PAN', 
    'BANKNAME', 'ACCOUNTNUMBER', 'IFS CODE', 'BANKBRANCHNAME'
  ];
  
  fields.forEach(field => {
    if (ledger[field]) {
      additional[field.toLowerCase()] = ledger[field];
    }
  });
  
  return additional;
}

/**
 * Create transaction response (temporary - replace with real voucher parsing)
 */
function createTransactionResponse(ledgerName, from, to) {
  // This is a placeholder - in real implementation, parse actual voucher data
  const transactions = [
    {
      date: from || "2021-03-01",
      particulars: "Sales",
      voucher_type: "Sales",
      voucher_no: 108,
      debit: 53500.00,
      credit: 0
    },
    {
      date: from || "2021-03-01", 
      particulars: "Bank of Baroda-Savings A/c",
      voucher_type: "Receipt",
      voucher_no: 66,
      debit: 0,
      credit: 53500.00
    }
  ];
  
  const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
  const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);
  const openingBalance = 148912.00;
  const closingBalance = openingBalance + totalDebit - totalCredit;
  
  return {
    ledger: {
      name: ledgerName,
      company: "Default Company",
      period: { from: from || '2021-03-01', to: to || '2021-03-31' }
    },
    transactions,
    summary: {
      opening_balance: openingBalance,
      total_debit: totalDebit,
      total_credit: totalCredit,
      closing_balance: closingBalance
    }
  };
}

module.exports = {
  parseLedgerList,
  parseSingleLedger,
  parseLedgerBalances,
  parseLedgerTransactions,
  extractField,
};
