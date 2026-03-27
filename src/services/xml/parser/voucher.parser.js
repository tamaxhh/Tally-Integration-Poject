/**
 * src/services/xml/parser/voucher.parser.js
 *
 * Parses Tally XML responses for voucher operations
 */

'use strict';

const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (tagName) => {
    const alwaysArray = ['VOUCHER', 'ALLLEDGERENTRIES', 'LEDGERENTRIES'];
    return alwaysArray.includes(tagName.toUpperCase());
  },
  trimValues: true,
});

/**
 * Parse voucher list XML response - Updated to match standalone regex approach
 */
function parseVoucherList(xmlResponse) {
  try {
    // Use regex-based parsing like the working standalone version
    const vouchers = [];
    
    // Extract VOUCHER elements using regex - matches working logic
    const voucherMatches = xmlResponse.match(/<VOUCHER[^>]*>[\s\S]*?<\/VOUCHER>/g);
    
    if (voucherMatches) {
      voucherMatches.forEach(voucherXml => {
        const voucher = {};
        
        // Extract basic fields using regex - matches standalone logic
        voucher.guid = extractField(voucherXml, 'GUID');
        voucher.date = extractField(voucherXml, 'DATE');
        voucher.voucherType = extractField(voucherXml, 'VOUCHERTYPENAME');
        voucher.voucherNumber = extractField(voucherXml, 'VOUCHERNUMBER');
        voucher.narration = extractField(voucherXml, 'NARRATION');
        voucher.partyName = extractField(voucherXml, 'PARTYNAME');
        voucher.amount = extractField(voucherXml, 'AMOUNT');
        
        // Extract ledger entries using regex - matches standalone logic
        const ledgerEntryMatches = voucherXml.match(/<ALLLEDGERENTRIES\.LIST[^>]*>[\s\S]*?<\/ALLLEDGERENTRIES\.LIST>/g);
        if (ledgerEntryMatches) {
          voucher.ledgerEntries = ledgerEntryMatches.map(entryXml => ({
            ledgerName: extractField(entryXml, 'LEDGERNAME'),
            amount: extractField(entryXml, 'AMOUNT'),
            ledgerType: extractField(entryXml, 'ISDEEMEDPOSITIVE')
          }));
        }
        
        // Only add voucher if it has meaningful data
        if (voucher.guid || voucher.date || voucher.voucherType || voucher.voucherNumber) {
          vouchers.push(voucher);
        }
      });
    }

    return {
      vouchers,
      total: vouchers.length,
      raw: xmlResponse,
    };
  } catch (error) {
    console.error('Error parsing voucher list:', error);
    return { vouchers: [], total: 0, error: error.message };
  }
}

/**
 * Helper function to extract field value from XML - matches standalone logic
 */
function extractField(xml, fieldName) {
  const regex = new RegExp(`<${fieldName}[^>]*>([^<]*)</${fieldName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Parse and normalize voucher data - Updated to use regex extraction
 */
function normaliseVoucher(voucher) {
  return {
    guid: voucher.GUID,
    date: voucher.DATE,
    voucherType: voucher.VOUCHERTYPENAME,
    voucherNumber: voucher.VOUCHERNUMBER,
    narration: voucher.NARRATION,
    partyName: voucher.PARTYNAME,
    ledgerEntries: voucher.ledgerEntries || [],
    amount: voucher.AMOUNT,
    reference: voucher.REFERENCE,
    reversedVoucher: voucher.ISREVERSEDVOUCHER === 'Yes',
  };
}

/**
 * Parse Tally amount string
 */
function parseAmount(value) {
  if (!value || value === '') return null;
  
  if (typeof value === 'string') {
    value = value.trim();
    if (value.startsWith('(') && value.endsWith(')')) {
      return -parseFloat(value.slice(1, -1));
    }
    return parseFloat(value) || null;
  }
  
  return value;
}

module.exports = {
  parseVoucherList,
  normaliseVoucher,
  extractField,
};
