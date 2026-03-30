/**
 * src/utils/validation.test.js
 *
 * Tests for frontend validation schemas and utilities
 */

import {
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
} from './validation';

describe('Validation Schemas', () => {
  describe('dateSchema', () => {
    test('should accept valid date in YYYY-MM-DD format', () => {
      expect(() => dateSchema.parse('2024-01-15')).not.toThrow();
      expect(() => dateSchema.parse('2024-12-31')).not.toThrow();
    });

    test('should reject invalid date formats', () => {
      expect(() => dateSchema.parse('15-01-2024')).toThrow();
      expect(() => dateSchema.parse('2024/01/15')).toThrow();
      expect(() => dateSchema.parse('Jan 15, 2024')).toThrow();
    });

    test('should reject invalid dates', () => {
      expect(() => dateSchema.parse('2024-02-30')).toThrow();
      expect(() => dateSchema.parse('2024-13-01')).toThrow();
    });
  });

  describe('dateRangeSchema', () => {
    test('should accept valid date range', () => {
      expect(() => dateRangeSchema.parse({
        fromDate: '2024-01-01',
        toDate: '2024-01-31'
      })).not.toThrow();
    });

    test('should reject when from > to', () => {
      expect(() => dateRangeSchema.parse({
        fromDate: '2024-01-31',
        toDate: '2024-01-01'
      })).toThrow();
    });

    test('should reject date range exceeding 366 days', () => {
      expect(() => dateRangeSchema.parse({
        fromDate: '2024-01-01',
        toDate: '2024-12-31'
      })).toThrow();
    });
  });

  describe('companySchema', () => {
    test('should accept valid company name', () => {
      expect(() => companySchema.parse('Test Company')).not.toThrow();
      expect(() => companySchema.parse('A')).not.toThrow();
    });

    test('should reject empty company name', () => {
      expect(() => companySchema.parse('')).toThrow();
      expect(() => companySchema.parse('   ')).toThrow();
    });

    test('should reject company name that is too long', () => {
      const longName = 'A'.repeat(256);
      expect(() => companySchema.parse(longName)).toThrow();
    });
  });

  describe('tallyUrlSchema', () => {
    test('should accept valid tally URL', () => {
      expect(() => tallyUrlSchema.parse('localhost:9000')).not.toThrow();
      expect(() => tallyUrlSchema.parse('192.168.1.100:9000')).not.toThrow();
      expect(() => tallyUrlSchema.parse('tally.example.com:9000')).not.toThrow();
    });

    test('should reject invalid tally URL format', () => {
      expect(() => tallyUrlSchema.parse('localhost')).toThrow();
      expect(() => tallyUrlSchema.parse('localhost:abc')).toThrow();
      expect(() => tallyUrlSchema.parse('localhost:0')).toThrow();
      expect(() => tallyUrlSchema.parse('localhost:65536')).toThrow();
    });
  });

  describe('ledgerNameSchema', () => {
    test('should accept valid ledger names', () => {
      expect(() => ledgerNameSchema.parse('Cash Account')).not.toThrow();
      expect(() => ledgerNameSchema.parse('Bank - HDFC')).not.toThrow();
      expect(() => ledgerNameSchema.parse('Sales & Marketing')).not.toThrow();
    });

    test('should reject invalid characters', () => {
      expect(() => ledgerNameSchema.parse('Cash@Account')).toThrow();
      expect(() => ledgerNameSchema.parse('Cash#Account')).toThrow();
    });

    test('should reject empty ledger name', () => {
      expect(() => ledgerNameSchema.parse('')).toThrow();
    });
  });

  describe('voucherTypeSchema', () => {
    test('should accept valid voucher types', () => {
      expect(() => voucherTypeSchema.parse('Sales')).not.toThrow();
      expect(() => voucherTypeSchema.parse('Payment')).not.toThrow();
      expect(() => voucherTypeSchema.parse('Journal')).not.toThrow();
    });

    test('should reject invalid voucher types', () => {
      expect(() => voucherTypeSchema.parse('Invalid')).toThrow();
      expect(() => voucherTypeSchema.parse('Sale')).toThrow();
    });
  });

  describe('requestTypeSchema', () => {
    test('should accept valid request types', () => {
      expect(() => requestTypeSchema.parse('ListOfLedgers')).not.toThrow();
      expect(() => requestTypeSchema.parse('LedgerTransactions')).not.toThrow();
    });

    test('should reject invalid request types', () => {
      expect(() => requestTypeSchema.parse('InvalidType')).toThrow();
    });
  });

  describe('paginationSchema', () => {
    test('should accept valid pagination parameters', () => {
      expect(() => paginationSchema.parse({ page: 1, limit: 50 })).not.toThrow();
      expect(() => paginationSchema.parse({ page: '2', limit: '25' })).not.toThrow();
    });

    test('should use default values', () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    test('should reject invalid page numbers', () => {
      expect(() => paginationSchema.parse({ page: 0 })).toThrow();
      expect(() => paginationSchema.parse({ page: -1 })).toThrow();
    });

    test('should reject invalid limit values', () => {
      expect(() => paginationSchema.parse({ limit: 0 })).toThrow();
      expect(() => paginationSchema.parse({ limit: 201 })).toThrow();
    });
  });

  describe('settingsFormSchema', () => {
    test('should accept valid settings', () => {
      expect(() => settingsFormSchema.parse({
        baseUrl: 'http://localhost:3000/api/v1',
        apiKey: 'test-key',
        timeout: 10000
      })).not.toThrow();
    });

    test('should reject invalid URL', () => {
      expect(() => settingsFormSchema.parse({
        baseUrl: 'invalid-url',
        apiKey: 'test-key',
        timeout: 10000
      })).toThrow();
    });

    test('should reject negative timeout', () => {
      expect(() => settingsFormSchema.parse({
        baseUrl: 'http://localhost:3000/api/v1',
        apiKey: 'test-key',
        timeout: -1000
      })).toThrow();
    });
  });

  describe('connectionTestSchema', () => {
    test('should accept valid connection test data', () => {
      expect(() => connectionTestSchema.parse({
        tallyUrl: 'localhost:9000',
        requestType: 'ListOfLedgers'
      })).not.toThrow();
    });

    test('should reject missing tallyUrl', () => {
      expect(() => connectionTestSchema.parse({
        requestType: 'ListOfLedgers'
      })).toThrow();
    });
  });

  describe('voucherSearchSchema', () => {
    test('should accept valid voucher search parameters', () => {
      expect(() => voucherSearchSchema.parse({
        company: 'Test Company',
        voucherType: 'Sales',
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
        page: 1,
        limit: 50
      })).not.toThrow();
    });

    test('should reject invalid date range', () => {
      expect(() => voucherSearchSchema.parse({
        fromDate: '2024-01-31',
        toDate: '2024-01-01',
        page: 1,
        limit: 50
      })).toThrow();
    });
  });

  describe('ledgerSearchSchema', () => {
    test('should accept valid ledger search parameters', () => {
      expect(() => ledgerSearchSchema.parse({
        company: 'Test Company',
        search: 'Cash',
        parent: 'Bank Accounts',
        bypassCache: false
      })).not.toThrow();
    });
  });

  describe('reportFormSchema', () => {
    test('should accept valid report parameters', () => {
      expect(() => reportFormSchema.parse({
        company: 'Test Company',
        fromDate: '2024-01-01',
        toDate: '2024-01-31'
      })).not.toThrow();
    });

    test('should reject invalid date range', () => {
      expect(() => reportFormSchema.parse({
        company: 'Test Company',
        fromDate: '2024-01-31',
        toDate: '2024-01-01'
      })).toThrow();
    });
  });
});

describe('Validation Utilities', () => {
  describe('validateForm', () => {
    test('should return success for valid data', () => {
      const result = validateForm(companySchema, 'Test Company');
      expect(result.success).toBe(true);
      expect(result.data).toBe('Test Company');
      expect(result.errors).toBeNull();
    });

    test('should return errors for invalid data', () => {
      const result = validateForm(companySchema, '');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateField', () => {
    test('should return success for valid field', () => {
      const result = validateField(companySchema, 'Test Company');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should return error for invalid field', () => {
      const result = validateField(companySchema, '');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validationMessages', () => {
    test('should contain all required validation messages', () => {
      expect(validationMessages.required).toBe('This field is required');
      expect(validationMessages.invalidEmail).toBe('Please enter a valid email address');
      expect(validationMessages.invalidDate).toBe('Please enter a valid date in YYYY-MM-DD format');
      expect(validationMessages.dateRange).toBe('End date must be after start date');
    });
  });
});
