/**
 * src/services/xml/parser/index.js
 *
 * Core XML parsing utilities and shared parser configuration
 * ===========================================================
 * This module provides the foundation for parsing Tally XML responses.
 * It includes the main XMLParser instance and utility functions used
 * across all domain-specific parsers (ledgers, vouchers, reports).
 */

'use strict';

const { XMLParser } = require('fast-xml-parser');

/**
 * Standard XML parser configuration for all Tally responses
 * - Preserves attributes with @_ prefix
 * - Converts common Tally arrays automatically
 * - Trims whitespace from values
 * - Handles numeric conversion
 */
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (tagName) => {
    // Tally elements that should always be arrays
    const alwaysArray = [
      'VOUCHER', 'LEDGER', 'GROUP', 'ALLLEDGERENTRIES', 'LEDGERENTRIES',
      'TALLYMESSAGE', 'COLLECTION', 'LINEITEM', 'BILLALLOCATIONS'
    ];
    return alwaysArray.includes(tagName.toUpperCase());
  },
  trimValues: true,
  parseTagValue: true,
  parseAttributeValue: true,
  parseTrueNumberOnly: false,
});

/**
 * Parse XML string into JavaScript object
 * @param {string} xmlString - Raw XML response from Tally
 * @returns {object} Parsed XML object
 */
function parseXml(xmlString) {
  if (!xmlString || typeof xmlString !== 'string') {
    throw new Error('Invalid XML string provided');
  }
  
  try {
    return parser.parse(xmlString);
  } catch (error) {
    throw new Error(`XML parsing failed: ${error.message}`);
  }
}

/**
 * Safely get nested property from object using dot notation
 * @param {object} obj - Source object
 * @param {string} path - Dot-separated path (e.g., 'ENVELOPE.BODY.DATA')
 * @param {*} defaultValue - Default value if path doesn't exist
 * @returns {*} Property value or default
 */
function safeGet(obj, path, defaultValue = null) {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }
  
  return current;
}

/**
 * Ensure value is always an array
 * @param {*} value - Value to convert
 * @returns {array} Array version of value
 */
function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return value ? [value] : [];
}

/**
 * Parse Tally amount string to number
 * Tally uses parentheses for negative amounts: "(100.00)" = -100.00
 * @param {string|number} value - Amount value from Tally
 * @returns {number|null} Parsed amount or null if invalid
 */
function parseAmount(value) {
  if (!value || value === '') {
    return null;
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Handle Tally's negative amount format: (100.00)
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      const numStr = trimmed.slice(1, -1);
      const parsed = parseFloat(numStr);
      return isNaN(parsed) ? null : -parsed;
    }
    
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? null : parsed;
  }
  
  return null;
}

/**
 * Parse Tally date string
 * Tally uses various date formats, most commonly YYYYMMDD
 * @param {string} dateStr - Date string from Tally
 * @returns {string|null} Normalized date string or null
 */
function parseTallyDate(dateStr) {
  if (!dateStr) {
    return null;
  }
  
  const trimmed = dateStr.trim();
  
  // Handle Tally's common YYYYMMDD format
  if (/^\d{8}$/.test(trimmed)) {
    const year = trimmed.substring(0, 4);
    const month = trimmed.substring(4, 6);
    const day = trimmed.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  
  // Return as-is if it's already in a recognizable format
  return trimmed;
}

/**
 * Clean and normalize text values from Tally
 * @param {string} value - Text value from Tally
 * @returns {string} Cleaned text
 */
function cleanText(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }
  
  return value.trim().replace(/\s+/g, ' ');
}

module.exports = {
  parseXml,
  safeGet,
  ensureArray,
  parseAmount,
  parseTallyDate,
  cleanText,
};
