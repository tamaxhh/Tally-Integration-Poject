/**
 * src/xml/parser/index.js
 *
 * THE XML → JSON TRANSFORMATION LAYER
 * =====================================
 *
 * WHY fast-xml-parser:
 * ---------------------
 * Options we evaluated:
 * 1. xml2js           → Popular but transforms differently, harder to predict
 * 2. cheerio          → Great for HTML/scraping, overkill here
 * 3. DOMParser        → Browser only, not Node.js
 * 4. fast-xml-parser  → Pure JS, fast, predictable output, great TypeScript types
 *
 * fast-xml-parser wins on: predictability, performance, and no native deps.
 *
 * TALLY XML QUIRKS YOU MUST HANDLE:
 * -----------------------------------
 * 1. Tally wraps everything in <ENVELOPE><BODY><EXPORTDATA><REQUESTDATA>
 *    You have to dig past these wrappers to get actual data.
 *
 * 2. Single vs. array: If only one ledger exists, Tally returns an object.
 *    If multiple exist, it returns an array. Your parser MUST normalise this.
 *    (fast-xml-parser has an `isArray` option to help with this.)
 *
 * 3. Numbers come as strings: Amounts are strings like "1234.56" or "(500.00)"
 *    where parentheses mean negative. You must parse these manually.
 *
 * 4. Dates come as strings: "1-Apr-2023" or "20230401". Normalise to ISO 8601.
 *
 * 5. Empty tags: Tally may return <CLOSINGBALANCE/> (self-closing = empty/zero).
 *    fast-xml-parser can be configured to return '' or null for these.
 */

'use strict';

const { XMLParser } = require('fast-xml-parser');
const { XmlParseError } = require('../../utils/errors');

// ============================================================
// Parser configuration
// ============================================================

/**
 * Create a configured XML parser instance.
 *
 * We create ONE parser at module level (not per-request) because XMLParser
 * construction is slightly expensive. Options are frozen at creation time.
 */
const parser = new XMLParser({
  // Preserve attribute values (Tally doesn't use attributes much, but just in case)
  ignoreAttributes: false,
  attributeNamePrefix: '@_', // Prefix attributes with @_ to distinguish from elements

  // CRITICAL: Convert numeric-looking text to numbers automatically
  // "1234.56" → 1234.56  |  BUT watch out: Tally negative amounts use "(500)" format
  // We handle negatives manually in parseAmount(), so we turn this OFF
  // to avoid partial automatic conversion causing inconsistency.
  parseTagValue: false, // We'll parse types ourselves for full control

  // When only one child element exists, Tally still wraps it in the parent tag.
  // Without this, single ledger = object, multiple = array (inconsistent!).
  // We list the tags that should ALWAYS be arrays, regardless of count.
  isArray: (tagName) => {
    const alwaysArray = [
      'LEDGER',
      'VOUCHER',
      'ALLLEDGERENTRIES',
      'LEDGERENTRIES',
      'ALLINVENTORYENTRIES',
      'INVENTORYENTRIES',
      'ENTRY',
    ];
    return alwaysArray.includes(tagName.toUpperCase());
  },

  // Trim whitespace from text content — Tally sometimes adds newlines
  trimValues: true,

  // Don't create text nodes for empty elements — return null instead
  parseAttributeValue: false,
  allowBooleanAttributes: true,
});

// ============================================================
// Amount parsing
// ============================================================

/**
 * Parse a Tally amount string into a JavaScript number.
 *
 * Tally represents amounts in these formats:
 * - "1234.56"     → 1234.56  (positive)
 * - "1,234.56"    → 1234.56  (with thousands separator)
 * - "(1234.56)"   → -1234.56 (negative, using accounting notation)
 * - ""  or null   → 0
 * - "0.00"        → 0
 *
 * We return null for truly empty/missing values (not just zero).
 *
 * @param {string|number|null|undefined} value
 * @returns {number|null}
 */
function parseAmount(value) {
  if (value == null || value === '') return null;
  const str = String(value).trim();
  if (str === '' || str === '0' || str === '0.00') return 0;

  // Detect Tally's negative amount format: "(1234.56)"
  const isNegative = str.startsWith('(') && str.endsWith(')');
  const cleaned = str
    .replace(/[()]/g, '') // Remove parentheses
    .replace(/,/g, '');   // Remove thousands separators

  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return isNegative ? -num : num;
}

/**
 * Parse a Tally date string into an ISO 8601 date string.
 *
 * Tally date formats:
 * - "1-Apr-2023"  → "2023-04-01"
 * - "20230401"    → "2023-04-01"  (YYYYMMDD format in some versions)
 *
 * @param {string|null} value
 * @returns {string|null} ISO 8601 date string (YYYY-MM-DD)
 */
function parseTallyDate(value) {
  if (!value) return null;
  const str = String(value).trim();

  // Format: "20230401" (YYYYMMDD — 8 digits)
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }

  // Format: "1-Apr-2023" or "01-Apr-2023"
  const match = str.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (match) {
    const [, day, monthStr, year] = match;
    const date = new Date(`${monthStr} ${day}, ${year}`);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
    }
  }

  // If we can't parse it, return as-is rather than losing the data
  return str;
}

// ============================================================
// Core parse function
// ============================================================

/**
 * Parse a Tally XML response string into a JavaScript object.
 *
 * This is intentionally low-level — it returns the raw parsed structure.
 * Domain-specific parsers (ledger.parser.js, voucher.parser.js) call this
 * and then extract the specific data they need.
 *
 * @param {string} xmlString - Raw XML response from Tally
 * @returns {object} Parsed JavaScript object
 * @throws {XmlParseError} If the XML is malformed or Tally returned an error
 */
function parseXml(xmlString) {
  if (!xmlString || typeof xmlString !== 'string') {
    throw new XmlParseError('Empty or non-string XML response received');
  }

  let result;
  try {
    result = parser.parse(xmlString);
  } catch (err) {
    throw new XmlParseError(err.message, xmlString);
  }

  // Check for Tally error responses.
  // When Tally encounters an error, it wraps it in LINEERROR tags.
  const envelope = result?.ENVELOPE;
  const lineError = envelope?.BODY?.LINEERROR || result?.LINEERROR;
  if (lineError) {
    throw new XmlParseError(`Tally returned a LINEERROR: ${lineError}`, xmlString);
  }

  return result;
}

/**
 * Navigate safely into a deeply nested object without throwing on missing keys.
 * This is essential when Tally omits empty fields entirely.
 *
 * Example: safeGet(obj, 'ENVELOPE.BODY.EXPORTDATA') instead of
 * obj?.ENVELOPE?.BODY?.EXPORTDATA
 *
 * @param {object} obj
 * @param {string} path - Dot-separated path
 * @param {*} [defaultValue=null]
 * @returns {*}
 */
function safeGet(obj, path, defaultValue = null) {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return defaultValue;
    current = current[key];
  }
  return current ?? defaultValue;
}

/**
 * Ensure a value is always an array.
 * Handles the Tally single-vs-array problem for any field not covered by isArray config.
 *
 * @param {*} value
 * @returns {Array}
 */
function ensureArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

module.exports = {
  parseXml,
  parseAmount,
  parseTallyDate,
  safeGet,
  ensureArray,
};
