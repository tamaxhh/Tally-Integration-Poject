/**
 * src/validators/validation.helpers.js
 *
 * Validation helper functions and utilities
 */

'use strict';

const { ValidationError } = require('../utils/errors');

/**
 * Validate and parse date range with business logic
 * @param {string} fromDate - Start date in YYYY-MM-DD format
 * @param {string} toDate - End date in YYYY-MM-DD format
 * @param {number} maxDays - Maximum allowed days between dates (default: 366)
 * @returns {{from: Date, to: Date}} Parsed date objects
 */
function validateDateRange(fromDate, toDate, maxDays = 366) {
  if (!fromDate || !toDate) {
    throw new ValidationError('Both fromDate and toDate are required', {
      fromDate: !fromDate ? 'Required' : undefined,
      toDate: !toDate ? 'Required' : undefined,
    });
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (isNaN(from.getTime())) {
    throw new ValidationError(`Invalid fromDate: "${fromDate}". Use YYYY-MM-DD format.`);
  }
  
  if (isNaN(to.getTime())) {
    throw new ValidationError(`Invalid toDate: "${toDate}". Use YYYY-MM-DD format.`);
  }
  
  if (from > to) {
    throw new ValidationError('fromDate must be before or equal to toDate');
  }

  // Enforce max range to prevent abuse
  const diffDays = (to - from) / (1000 * 60 * 60 * 24);
  if (diffDays > maxDays) {
    throw new ValidationError(
      `Date range too large (${Math.ceil(diffDays)} days). Maximum is ${maxDays} days.`,
      { maxDays, providedDays: Math.ceil(diffDays) }
    );
  }

  return { from, to };
}

/**
 * Validate Tally URL format
 * @param {string} tallyUrl - Tally connection URL
 * @returns {object} Parsed host and port
 */
function validateTallyUrl(tallyUrl) {
  if (!tallyUrl || typeof tallyUrl !== 'string') {
    throw new ValidationError('Tally URL is required');
  }

  // Pattern: host:port
  const pattern = /^([\w\.-]+):(\d+)$/;
  const match = tallyUrl.match(pattern);

  if (!match) {
    throw new ValidationError(
      'Invalid Tally URL format. Expected format: host:port (e.g., localhost:9000)',
      { provided: tallyUrl }
    );
  }

  const [, host, port] = match;
  const portNum = parseInt(port, 10);

  if (portNum < 1 || portNum > 65535) {
    throw new ValidationError(
      'Port must be between 1 and 65535',
      { provided: port }
    );
  }

  return { host, port: portNum };
}

/**
 * Sanitize and validate ledger name
 * @param {string} ledgerName - Ledger name to validate
 * @returns {string} Sanitized ledger name
 */
function validateLedgerName(ledgerName) {
  if (!ledgerName || typeof ledgerName !== 'string') {
    throw new ValidationError('Ledger name is required');
  }

  const sanitized = ledgerName.trim();
  
  if (sanitized.length === 0) {
    throw new ValidationError('Ledger name cannot be empty');
  }

  if (sanitized.length > 255) {
    throw new ValidationError('Ledger name must be less than 255 characters');
  }

  // Check for valid characters (letters, numbers, spaces, and common symbols)
  const validPattern = /^[\w\s\-&()]+$/;
  if (!validPattern.test(sanitized)) {
    throw new ValidationError(
      'Ledger name contains invalid characters. Only letters, numbers, spaces, hyphens, ampersands, and parentheses are allowed',
      { provided: ledgerName }
    );
  }

  return sanitized;
}

/**
 * Validate voucher type
 * @param {string} voucherType - Voucher type to validate
 * @returns {string} Validated voucher type
 */
function validateVoucherType(voucherType) {
  if (!voucherType || typeof voucherType !== 'string') {
    throw new ValidationError('Voucher type is required');
  }

  const validTypes = [
    'Sales', 'Purchase', 'Payment', 'Receipt', 'Contra', 
    'Journal', 'Credit Note', 'Debit Note', 'Delivery Note',
    'Rejection In', 'Rejection Out', 'Stock Journal', 'Physical Stock'
  ];

  const normalized = voucherType.trim();
  
  if (!validTypes.includes(normalized)) {
    throw new ValidationError(
      `Invalid voucher type "${voucherType}". Valid types are: ${validTypes.join(', ')}`,
      { provided: voucherType, validTypes }
    );
  }

  return normalized;
}

/**
 * Validate company name
 * @param {string} company - Company name to validate
 * @returns {string} Validated company name
 */
function validateCompanyName(company) {
  if (!company || typeof company !== 'string') {
    throw new ValidationError('Company name is required');
  }

  const sanitized = company.trim();
  
  if (sanitized.length === 0) {
    throw new ValidationError('Company name cannot be empty');
  }

  if (sanitized.length > 255) {
    throw new ValidationError('Company name must be less than 255 characters');
  }

  return sanitized;
}

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Page limit
 * @returns {{page: number, limit: number}} Validated pagination params
 */
function validatePagination(page = 1, limit = 50) {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    throw new ValidationError('Page must be a positive integer');
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 200) {
    throw new ValidationError('Limit must be between 1 and 200');
  }

  return { page: pageNum, limit: limitNum };
}

/**
 * Validate request type for Tally API
 * @param {string} requestType - Request type to validate
 * @returns {string} Validated request type
 */
function validateRequestType(requestType) {
  if (!requestType || typeof requestType !== 'string') {
    throw new ValidationError('Request type is required');
  }

  const validTypes = ['ListOfLedgers', 'LedgerTransactions', 'LedgerDetails', 'TrialBalance'];
  const normalized = requestType.trim();

  if (!validTypes.includes(normalized)) {
    throw new ValidationError(
      `Invalid request type "${requestType}". Valid types are: ${validTypes.join(', ')}`,
      { provided: requestType, validTypes }
    );
  }

  return normalized;
}

/**
 * Create a validation error with field-specific details
 * @param {string} message - Error message
 * @param {object} fieldErrors - Field-specific error details
 * @returns {ValidationError} Validation error instance
 */
function createValidationError(message, fieldErrors = {}) {
  return new ValidationError(message, { fieldErrors });
}

/**
 * Validate that required fields are present in an object
 * @param {object} data - Object to validate
 * @param {string[]} requiredFields - List of required field names
 * @throws {ValidationError} If any required field is missing
 */
function validateRequiredFields(data, requiredFields) {
  const missing = [];
  const invalid = {};

  for (const field of requiredFields) {
    const value = data[field];
    
    if (value === undefined || value === null || value === '') {
      missing.push(field);
    } else if (typeof value === 'string' && value.trim() === '') {
      invalid[field] = 'Field cannot be empty';
    }
  }

  if (missing.length > 0 || Object.keys(invalid).length > 0) {
    const fieldErrors = {};
    
    missing.forEach(field => {
      fieldErrors[field] = 'Required field is missing';
    });
    
    Object.assign(fieldErrors, invalid);

    throw new ValidationError(
      `Validation failed. Missing or empty fields: ${[...missing, ...Object.keys(invalid)].join(', ')}`,
      { fieldErrors }
    );
  }
}

module.exports = {
  validateDateRange,
  validateTallyUrl,
  validateLedgerName,
  validateVoucherType,
  validateCompanyName,
  validatePagination,
  validateRequestType,
  createValidationError,
  validateRequiredFields
};
