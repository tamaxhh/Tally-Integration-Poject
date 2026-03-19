'use strict';

const { parseAmount, parseTallyDate, parseLedgerList, parseVoucherList } = require('../../parser.test.js');

describe('XML Parser Unit Tests', () => {
  describe('parseAmount', () => {
    test('should parse positive amounts', () => {
      expect(parseAmount('5000.00')).toBe(5000.00);
    });

    test('should parse negative amounts in parentheses', () => {
      expect(parseAmount('(10000.00)')).toBe(-10000.00);
    });

    test('should return null for empty values', () => {
      expect(parseAmount('')).toBeNull();
      expect(parseAmount(null)).toBeNull();
    });
  });

  describe('parseTallyDate', () => {
    test('should convert Tally date format to ISO', () => {
      expect(parseTallyDate('1-Apr-2023')).toBe('2023-04-01');
      expect(parseTallyDate('15-Jan-2024')).toBe('2024-01-15');
    });

    test('should handle null/empty dates', () => {
      expect(parseTallyDate(null)).toBeNull();
      expect(parseTallyDate('')).toBeNull();
    });
  });

  describe('parseLedgerList', () => {
    test('should parse basic ledger XML', () => {
      const xml = `<?xml version="1.0"?>
<ENVELOPE>
  <BODY>
    <EXPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <GROUP NAME="Sundry Debtors">
            <LEDGER NAME="Test Customer">
              <PARENT>Sundry Debtors</PARENT>
              <OPENINGBALANCE>1000.00</OPENINGBALANCE>
              <CLOSINGBALANCE>1500.00</CLOSINGBALANCE>
            </LEDGER>
          </GROUP>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

      const { ledgers, total } = parseLedgerList(xml);
      expect(total).toBe(1);
      expect(ledgers[0]).toMatchObject({
        name: 'Test Customer',
        parent: 'Sundry Debtors',
        openingBalance: 1000,
        closingBalance: 1500
      });
    });
  });

  describe('parseVoucherList', () => {
    test('should parse basic voucher XML', () => {
      const xml = `<?xml version="1.0"?>
<ENVELOPE>
  <BODY>
    <EXPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE>
          <VOUCHER VCHTYPE="Sales">
            <DATE>20240401</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>SAL-001</VOUCHERNUMBER>
            <AMOUNT>5000.00</AMOUNT>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

      const { vouchers, total } = parseVoucherList(xml);
      expect(total).toBe(1);
      expect(vouchers[0]).toMatchObject({
        voucherNumber: 'SAL-001',
        date: '2024-04-01',
        voucherType: 'Sales'
      });
    });
  });
});
