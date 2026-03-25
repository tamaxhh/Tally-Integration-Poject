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
 * Parse voucher list XML response
 */
function parseVoucherList(xmlResponse) {
  try {
    const data = parser.parse(xmlResponse);
    const vouchers = [];

    if (data.ENVELOPE?.BODY?.DATA?.COLLECTION?.VOUCHER) {
      const voucherData = data.ENVELOPE.BODY.DATA.COLLECTION.VOUCHER;
      const voucherArray = Array.isArray(voucherData) ? voucherData : [voucherData];
      
      voucherArray.forEach(voucher => {
        vouchers.push({
          guid: voucher.GUID,
          date: voucher.DATE,
          voucherType: voucher.VOUCHERTYPENAME,
          voucherNumber: voucher.VOUCHERNUMBER,
          narration: voucher.NARRATION,
          ledgerEntries: parseLedgerEntries(voucher.ALLLEDGERENTRIES?.LEDGERENTRIES),
          amount: parseAmount(voucher.AMOUNT),
        });
      });
    }

    return {
      vouchers,
      total: vouchers.length,
      raw: data,
    };
  } catch (error) {
    console.error('Error parsing voucher list:', error);
    return { vouchers: [], total: 0, error: error.message };
  }
}

/**
 * Parse and normalize voucher data
 */
function normaliseVoucher(voucher) {
  return {
    guid: voucher.GUID,
    date: voucher.DATE,
    voucherType: voucher.VOUCHERTYPENAME,
    voucherNumber: voucher.VOUCHERNUMBER,
    narration: voucher.NARRATION,
    ledgerEntries: parseLedgerEntries(voucher.ALLLEDGERENTRIES?.LEDGERENTRIES),
    amount: parseAmount(voucher.AMOUNT),
    party: voucher.PARTYNAME,
    reference: voucher.REFERENCE,
    reversedVoucher: voucher.ISREVERSEDVOUCHER === 'Yes',
  };
}

/**
 * Parse ledger entries from voucher
 */
function parseLedgerEntries(entries) {
  if (!entries) return [];
  
  const entryArray = Array.isArray(entries) ? entries : [entries];
  return entryArray.map(entry => ({
    ledgerName: entry.LEDGERNAME,
    amount: parseAmount(entry.AMOUNT),
    isDebit: entry.ISDEEMED === 'Yes',
    rate: parseAmount(entry.RATE),
    quantity: parseAmount(entry.AMOUNT) / parseAmount(entry.RATE) || 0,
  }));
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
};
