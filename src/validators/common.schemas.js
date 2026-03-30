/**
 * src/validators/common.schemas.js
 *
 * Common JSON Schema definitions for reuse across routes
 */

'use strict';

/**
 * Common date validation schema
 */
const dateSchema = {
  type: 'string',
  pattern: '^\\d{4}-\\d{2}-\\d{2}$'
};

/**
 * Date range validation with business logic
 */
const dateRangeSchema = {
  type: 'object',
  required: ['fromDate', 'toDate'],
  properties: {
    fromDate: dateSchema,
    toDate: dateSchema
  },
  additionalProperties: false
};

/**
 * Company name schema
 */
const companySchema = {
  type: 'string',
  minLength: 1,
  maxLength: 255
};

/**
 * Pagination schema
 */
const paginationSchema = {
  type: 'object',
  properties: {
    page: {
      type: 'integer',
      minimum: 1,
      default: 1
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 200,
      default: 50
    }
  }
};

/**
 * Common query parameters
 */
const commonQuerySchema = {
  type: 'object',
  properties: {
    company: companySchema,
    bypassCache: {
      type: 'boolean',
      default: false
    }
  }
};

/**
 * Tally connection parameters
 */
const tallyConnectionSchema = {
  type: 'object',
  required: ['tallyUrl'],
  properties: {
    tallyUrl: {
      type: 'string',
      pattern: '^[\\w\\.-]+:[0-9]+$'
    },
    requestType: {
      type: 'string',
      enum: ['ListOfLedgers', 'LedgerTransactions', 'LedgerDetails', 'TrialBalance']
    },
    ledgerName: {
      type: 'string',
      minLength: 1,
      maxLength: 255
    },
    from: dateSchema,
    to: dateSchema
  },
  additionalProperties: false
};

/**
 * Voucher type schema
 */
const voucherTypeSchema = {
  type: 'string',
  maxLength: 100,
  enum: [
    'Sales', 'Purchase', 'Payment', 'Receipt', 'Contra', 
    'Journal', 'Credit Note', 'Debit Note', 'Delivery Note',
    'Rejection In', 'Rejection Out', 'Stock Journal', 'Physical Stock'
  ]
};

/**
 * Ledger name schema
 */
const ledgerNameSchema = {
  type: 'string',
  minLength: 1,
  maxLength: 255,
  pattern: '^[\\w\\s\\-&()]+$'
};

/**
 * Response schemas for consistent API responses
 */
const responseSchemas = {
  success: {
    type: 'object',
    properties: {
      success: { type: 'boolean', const: true },
      data: { type: ['object', 'array'] },
      meta: { type: 'object' }
    },
    required: ['success', 'data']
  },
  
  error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', const: false },
      error: { type: 'string' },
      message: { type: 'string' },
      details: { type: 'object' }
    },
    required: ['success', 'error', 'message']
  }
};

module.exports = {
  dateSchema,
  dateRangeSchema,
  companySchema,
  paginationSchema,
  commonQuerySchema,
  tallyConnectionSchema,
  voucherTypeSchema,
  ledgerNameSchema,
  responseSchemas
};
