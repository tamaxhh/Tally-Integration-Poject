/**
 * src/utils/validation.js
 *
 * Frontend validation schemas and utilities using Zod
 */

import { z } from 'zod';

// Common validation patterns
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const tallyUrlPattern = /^[\w\.-]+:[0-9]+$/;
const ledgerNamePattern = /^[\w\s\-&()]+$/;

/**
 * Date validation schema
 */
export const dateSchema = z.string()
  .regex(datePattern, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const d = new Date(date);
    return !isNaN(d.getTime());
  }, 'Invalid date');

/**
 * Date range validation schema
 */
export const dateRangeSchema = z.object({
  fromDate: dateSchema,
  toDate: dateSchema
}).refine((data) => {
  const from = new Date(data.fromDate);
  const to = new Date(data.toDate);
  return from <= to;
}, {
  message: 'fromDate must be before or equal to toDate',
  path: ['toDate']
}).refine((data) => {
  const from = new Date(data.fromDate);
  const to = new Date(data.toDate);
  const diffDays = (to - from) / (1000 * 60 * 60 * 24);
  return diffDays <= 366;
}, {
  message: 'Date range cannot exceed 366 days',
  path: ['toDate']
});

/**
 * Company name validation
 */
export const companySchema = z.string()
  .min(1, 'Company name is required')
  .max(255, 'Company name must be less than 255 characters');

/**
 * Tally URL validation
 */
export const tallyUrlSchema = z.string()
  .regex(tallyUrlPattern, 'Tally URL must be in format host:port (e.g., localhost:9000)')
  .refine((url) => {
    const [, port] = url.split(':');
    const portNum = parseInt(port, 10);
    return portNum >= 1 && portNum <= 65535;
  }, 'Port must be between 1 and 65535');

/**
 * Ledger name validation
 */
export const ledgerNameSchema = z.string()
  .min(1, 'Ledger name is required')
  .max(255, 'Ledger name must be less than 255 characters')
  .regex(ledgerNamePattern, 'Ledger name contains invalid characters');

/**
 * Voucher type validation
 */
export const voucherTypeSchema = z.enum([
  'Sales', 'Purchase', 'Payment', 'Receipt', 'Contra', 
  'Journal', 'Credit Note', 'Debit Note', 'Delivery Note',
  'Rejection In', 'Rejection Out', 'Stock Journal', 'Physical Stock'
], {
  errorMap: () => ({ message: 'Invalid voucher type' })
});

/**
 * Request type validation for Tally API
 */
export const requestTypeSchema = z.enum([
  'ListOfLedgers', 'LedgerTransactions', 'LedgerDetails', 'TrialBalance'
], {
  errorMap: () => ({ message: 'Invalid request type' })
});

/**
 * Pagination validation
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

/**
 * Settings form validation
 */
export const settingsFormSchema = z.object({
  baseUrl: z.string()
    .url('Invalid URL format')
    .default('http://localhost:3000/api/v1'),
  apiKey: z.string()
    .min(1, 'API key is required')
    .default('dev-key-local-only'),
  timeout: z.coerce.number()
    .int()
    .positive()
    .max(60000, 'Timeout cannot exceed 60 seconds')
    .default(10000)
});

/**
 * Connection test form validation
 */
export const connectionTestSchema = z.object({
  tallyUrl: tallyUrlSchema,
  requestType: requestTypeSchema.optional(),
  ledgerName: ledgerNameSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional()
}).refine((data) => {
  // If requestType requires ledgerName, ensure it's provided
  if (data.requestType && ['LedgerTransactions', 'LedgerDetails'].includes(data.requestType)) {
    return !!data.ledgerName;
  }
  return true;
}, {
  message: 'Ledger name is required for this request type',
  path: ['ledgerName']
});

/**
 * Voucher search form validation
 */
export const voucherSearchSchema = z.object({
  company: companySchema.optional(),
  voucherType: voucherTypeSchema.optional(),
  fromDate: dateSchema,
  toDate: dateSchema,
  ...paginationSchema.shape
}).merge(dateRangeSchema);

/**
 * Ledger search form validation
 */
export const ledgerSearchSchema = z.object({
  company: companySchema.optional(),
  search: z.string().optional(),
  parent: z.string().max(255, 'Parent group name must be less than 255 characters').optional(),
  bypassCache: z.boolean().default(false)
});

/**
 * Report form validation
 */
export const reportFormSchema = z.object({
  company: companySchema.optional(),
  fromDate: dateSchema,
  toDate: dateSchema
}).merge(dateRangeSchema);

/**
 * Validate form data with proper error handling
 */
export const validateForm = (schema, data) => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
      });
      return { success: false, data: null, errors: formattedErrors };
    }
    return { success: false, data: null, errors: { general: 'Validation failed' } };
  }
};

/**
 * Real-time validation for form fields
 */
export const validateField = (schema, fieldName, value) => {
  try {
    const fieldSchema = schema.shape[fieldName];
    if (!fieldSchema) return { success: true, error: null };
    
    fieldSchema.parse(value);
    return { success: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid value' };
    }
    return { success: false, error: 'Invalid value' };
  }
};

/**
 * Common validation error messages
 */
export const validationMessages = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  invalidUrl: 'Please enter a valid URL',
  invalidDate: 'Please enter a valid date in YYYY-MM-DD format',
  dateRange: 'End date must be after start date',
  maxRange: 'Date range cannot exceed 366 days',
  invalidPort: 'Port must be between 1 and 65535',
  invalidCharacters: 'Contains invalid characters',
  tooLong: 'Value is too long',
  tooShort: 'Value is too short'
};

export default {
  dateSchema,
  dateRangeSchema,
  companySchema,
  tallyUrlSchema,
  ledgerNameSchema,
  voucherTypeSchema,
  requestTypeSchema,
  paginationSchema,
  settingsFormSchema,
  connectionTestSchema,
  voucherSearchSchema,
  ledgerSearchSchema,
  reportFormSchema,
  validateForm,
  validateField,
  validationMessages
};
