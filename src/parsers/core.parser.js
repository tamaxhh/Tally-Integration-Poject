const { XMLParser, parseXml, safeGet, ensureArray } = require('fast-xml-parser');

// Core parsing utilities
function parseAmount(value) {
  return parseFloat(value) || 0;
}

function parseTallyDate(dateStr) {
  if (!dateStr) return null;
  return dateStr; // Tally date format
}

function safeGet(obj, path, defaultValue = null) {
  if (!obj || typeof obj !== 'object') return defaultValue;
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

function ensureArray(value) {
  return Array.isArray(value) ? value : (value ? [value] : []);
}

module.exports = {
  parseAmount,
  parseTallyDate,
  parseXml,
  safeGet,
  ensureArray
};
