/**
 * src/validators/validation.test.js
 *
 * Tests for validation utilities and schemas
 */

'use strict';

const {
  validateDateRange,
  validateTallyUrl,
  validateLedgerName,
  validateVoucherType,
  validateCompanyName,
  validatePagination,
  validateRequestType,
  createValidationError,
  validateRequiredFields
} = require('./validation.helpers');

describe('Validation Helpers', () => {
  describe('validateDateRange', () => {
    test('should accept valid date range', () => {
      const result = validateDateRange('2024-01-01', '2024-01-31');
      expect(result.from).toBeInstanceOf(Date);
      expect(result.to).toBeInstanceOf(Date);
      expect(result.from <= result.to).toBe(true);
    });

    test('should throw error for missing dates', () => {
      expect(() => validateDateRange('', '2024-01-31')).toThrow('Both fromDate and toDate are required');
      expect(() => validateDateRange('2024-01-01', '')).toThrow('Both fromDate and toDate are required');
    });

    test('should throw error for invalid date format', () => {
      expect(() => validateDateRange('01-01-2024', '2024-01-31')).toThrow('Invalid fromDate');
      expect(() => validateDateRange('2024-01-01', '31-01-2024')).toThrow('Invalid toDate');
    });

    test('should throw error when from > to', () => {
      expect(() => validateDateRange('2024-01-31', '2024-01-01')).toThrow('fromDate must be before or equal to toDate');
    });

    test('should throw error for date range exceeding limit', () => {
      expect(() => validateDateRange('2024-01-01', '2024-12-31')).toThrow('Date range too large');
    });
  });

  describe('validateTallyUrl', () => {
    test('should accept valid tally URL', () => {
      const result = validateTallyUrl('localhost:9000');
      expect(result.host).toBe('localhost');
      expect(result.port).toBe(9000);
    });

    test('should throw error for missing URL', () => {
      expect(() => validateTallyUrl('')).toThrow('Tally URL is required');
      expect(() => validateTallyUrl(null)).toThrow('Tally URL is required');
    });

    test('should throw error for invalid format', () => {
      expect(() => validateTallyUrl('localhost')).toThrow('Invalid Tally URL format');
      expect(() => validateTallyUrl('localhost:abc')).toThrow('Invalid Tally URL format');
    });

    test('should throw error for invalid port', () => {
      expect(() => validateTallyUrl('localhost:0')).toThrow('Port must be between 1 and 65535');
      expect(() => validateTallyUrl('localhost:65536')).toThrow('Port must be between 1 and 65535');
    });
  });

  describe('validateLedgerName', () => {
    test('should accept valid ledger name', () => {
      const result = validateLedgerName('Cash Account');
      expect(result).toBe('Cash Account');
    });

    test('should throw error for empty name', () => {
      expect(() => validateLedgerName('')).toThrow('Ledger name is required');
      expect(() => validateLedgerName('   ')).toThrow('Ledger name cannot be empty');
    });

    test('should throw error for too long name', () => {
      const longName = 'A'.repeat(256);
      expect(() => validateLedgerName(longName)).toThrow('Ledger name must be less than 255 characters');
    });

    test('should throw error for invalid characters', () => {
      expect(() => validateLedgerName('Cash@Account')).toThrow('Ledger name contains invalid characters');
    });
  });

  describe('validateVoucherType', () => {
    test('should accept valid voucher types', () => {
      expect(validateVoucherType('Sales')).toBe('Sales');
      expect(validateVoucherType('Payment')).toBe('Payment');
      expect(validateVoucherType('Journal')).toBe('Journal');
    });

    test('should throw error for invalid voucher type', () => {
      expect(() => validateVoucherType('Invalid')).toThrow('Invalid voucher type');
      expect(() => validateVoucherType('')).toThrow('Voucher type is required');
    });
  });

  describe('validateCompanyName', () => {
    test('should accept valid company name', () => {
      const result = validateCompanyName('Test Company');
      expect(result).toBe('Test Company');
    });

    test('should throw error for empty name', () => {
      expect(() => validateCompanyName('')).toThrow('Company name is required');
    });

    test('should throw error for too long name', () => {
      const longName = 'A'.repeat(256);
      expect(() => validateCompanyName(longName)).toThrow('Company name must be less than 255 characters');
    });
  });

  describe('validatePagination', () => {
    test('should accept valid pagination parameters', () => {
      const result = validatePagination(1, 50);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    test('should use defaults for invalid parameters', () => {
      const result = validatePagination();
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    test('should throw error for invalid page', () => {
      expect(() => validatePagination(0)).toThrow('Page must be a positive integer');
      expect(() => validatePagination(-1)).toThrow('Page must be a positive integer');
    });

    test('should throw error for invalid limit', () => {
      expect(() => validatePagination(1, 0)).toThrow('Limit must be between 1 and 200');
      expect(() => validatePagination(1, 201)).toThrow('Limit must be between 1 and 200');
    });
  });

  describe('validateRequestType', () => {
    test('should accept valid request types', () => {
      expect(validateRequestType('ListOfLedgers')).toBe('ListOfLedgers');
      expect(validateRequestType('LedgerTransactions')).toBe('LedgerTransactions');
    });

    test('should throw error for invalid request type', () => {
      expect(() => validateRequestType('InvalidType')).toThrow('Invalid request type');
      expect(() => validateRequestType('')).toThrow('Request type is required');
    });
  });

  describe('createValidationError', () => {
    test('should create validation error with details', () => {
      const error = createValidationError('Test message', { field: 'test' });
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test message');
      expect(error.details.fieldErrors.field).toBe('test');
    });
  });

  describe('validateRequiredFields', () => {
    test('should pass when all required fields are present', () => {
      expect(() => {
        validateRequiredFields({ name: 'test', email: 'test@example.com' }, ['name', 'email']);
      }).not.toThrow();
    });

    test('should throw error when required fields are missing', () => {
      expect(() => {
        validateRequiredFields({ name: 'test' }, ['name', 'email']);
      }).toThrow('Validation failed');
    });

    test('should throw error when required fields are empty', () => {
      expect(() => {
        validateRequiredFields({ name: '', email: 'test@example.com' }, ['name', 'email']);
      }).toThrow('Validation failed');
    });
  });
});
