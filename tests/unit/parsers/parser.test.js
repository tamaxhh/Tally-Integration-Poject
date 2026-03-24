/**
 * tests/unit/xml/parser.test.js
 *
 * UNIT TESTS FOR THE XML PARSER
 * ================================
 * These tests are PURE — no HTTP, no Tally, no Redis.
 * They test the XML → JSON transformation in complete isolation.
 *
 * WHY TEST THE PARSER SEPARATELY:
 * ---------------------------------
 * The parser is where most bugs live in Tally integrations.
 * Tally's XML is unpredictable: sometimes a single ledger, sometimes an array,
 * sometimes empty fields, sometimes missing fields entirely.
 *
 * Having dedicated parser tests means you can:
 * 1. Add a new test when you encounter a new Tally XML edge case
 * 2. Verify your parser handles Tally version differences
 * 3. Run tests in milliseconds (no network)
 */

'use strict';

const { parseAmount, parseTallyDate, parseXml, safeGet, ensureArray } = require('../../../src/xml/parser/index');
const { parseLedgerList } = require('../../../src/xml/parser/ledger.parser');
const { parseVoucherList } = require('../../../src/xml/parser/voucher.parser');

// ============================================================
// parseAmount tests
// ============================================================

describe('parseAmount', () => {
  test('parses positive decimal amounts', () => {
    expect(parseAmount('1234.56')).toBe(1234.56);
  });

  test('parses amounts with thousands separators', () => {
    expect(parseAmount('1,234.56')).toBe(1234.56);
    expect(parseAmount('10,00,000.00')).toBe(1000000); // Indian numbering system
  });

  test('parses Tally negative amounts (parentheses notation)', () => {
    expect(parseAmount('(1234.56)')).toBe(-1234.56);
    expect(parseAmount('(500.00)')).toBe(-500);
  });

  test('handles zero and empty values', () => {
    expect(parseAmount('0.00')).toBe(0);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount(null)).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
  });

  test('handles integer string amounts', () => {
    expect(parseAmount('50000')).toBe(50000);
  });

  test('returns null for non-numeric strings', () => {
    expect(parseAmount('N/A')).toBeNull();
    expect(parseAmount('--')).toBeNull();
  });
});

// ============================================================
// parseTallyDate tests
// ============================================================

describe('parseTallyDate', () => {
  test('parses Tally "D-Mon-YYYY" format', () => {
    expect(parseTallyDate('1-Apr-2023')).toBe('2023-04-01');
    expect(parseTallyDate('15-Jan-2024')).toBe('2024-01-15');
    expect(parseTallyDate('31-Mar-2024')).toBe('2024-03-31');
  });

  test('parses YYYYMMDD compact format', () => {
    expect(parseTallyDate('20230401')).toBe('2023-04-01');
    expect(parseTallyDate('20240131')).toBe('2024-01-31');
  });

  test('handles null and empty', () => {
    expect(parseTallyDate(null)).toBeNull();
    expect(parseTallyDate('')).toBeNull();
    expect(parseTallyDate(undefined)).toBeNull();
  });
});

// ============================================================
// safeGet tests
// ============================================================

describe('safeGet', () => {
  const obj = { A: { B: { C: 'value' } } };

  test('navigates nested paths', () => {
    expect(safeGet(obj, 'A.B.C')).toBe('value');
  });

  test('returns null for missing paths', () => {
    expect(safeGet(obj, 'A.B.D')).toBeNull();
    expect(safeGet(obj, 'X.Y.Z')).toBeNull();
  });

  test('returns custom default for missing paths', () => {
    expect(safeGet(obj, 'X.Y', 'default')).toBe('default');
  });

  test('handles null/undefined input', () => {
    expect(safeGet(null, 'A.B')).toBeNull();
    expect(safeGet(undefined, 'A')).toBeNull();
  });
});

// ============================================================
// parseLedgerList tests
// ============================================================

describe('parseLedgerList', () => {
  const MOCK_LEDGER_XML = `<?xml version="1.0"?>
<ENVELOPE>
  <BODY>
    <EXPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <GROUP NAME="Sundry Debtors">
            <LEDGER NAME="Customer ABC">
              <PARENT>Sundry Debtors</PARENT>
              <OPENINGBALANCE>10000.00</OPENINGBALANCE>
              <CLOSINGBALANCE>15000.00</CLOSINGBALANCE>
              <ISBILLWISEON>Yes</ISBILLWISEON>
              <PARTYGSTIN>27AABCU9603R1ZX</PARTYGSTIN>
            </LEDGER>
          </GROUP>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

  test('parses ledger list with correct field types', () => {
    const { ledgers, total } = parseLedgerList(MOCK_LEDGER_XML);
    expect(total).toBe(1);
    expect(ledgers[0]).toMatchObject({
      name: 'Customer ABC',
      parent: 'Sundry Debtors',
      openingBalance: 10000,
      closingBalance: 15000,
      isBillWise: true,
      gstin: '27AABCU9603R1ZX',
    });
  });

  test('returns numeric amounts (not strings)', () => {
    const { ledgers } = parseLedgerList(MOCK_LEDGER_XML);
    expect(typeof ledgers[0].openingBalance).toBe('number');
    expect(typeof ledgers[0].closingBalance).toBe('number');
  });

  test('returns empty array for response with no ledgers', () => {
    const emptyXml = `<?xml version="1.0"?>
<ENVELOPE><BODY><EXPORTDATA><REQUESTDATA>
  <TALLYMESSAGE></TALLYMESSAGE>
</REQUESTDATA></EXPORTDATA></BODY></ENVELOPE>`;
    const { ledgers, total } = parseLedgerList(emptyXml);
    expect(total).toBe(0);
    expect(ledgers).toHaveLength(0);
  });

  test('throws XmlParseError on LINEERROR response', () => {
    const errorXml = `<ENVELOPE><LINEERROR>Company not found</LINEERROR></ENVELOPE>`;
    expect(() => parseLedgerList(errorXml)).toThrow('LINEERROR');
  });

  test('throws XmlParseError on malformed XML', () => {
    expect(() => parseLedgerList('<unclosed>')).toThrow();
  });
});

// ============================================================
// parseVoucherList tests
// ============================================================

describe('parseVoucherList', () => {
  const MOCK_VOUCHER_XML = `<?xml version="1.0"?>
<ENVELOPE>
  <BODY>
    <EXPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE>
          <VOUCHER VCHTYPE="Sales" GUID="test-guid-001">
            <DATE>20240401</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>Sal-001</VOUCHERNUMBER>
            <PARTYLEDGERNAME>Customer ABC</PARTYLEDGERNAME>
            <NARRATION>Test invoice</NARRATION>
            <AMOUNT>10000.00</AMOUNT>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Customer ABC</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-10000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Sales Account</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>10000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

  test('parses voucher with correct field types', () => {
    const { vouchers, total } = parseVoucherList(MOCK_VOUCHER_XML);
    expect(total).toBe(1);
    expect(vouchers[0]).toMatchObject({
      voucherNumber: 'Sal-001',
      date: '2024-04-01',
      voucherType: 'Sales',
      partyLedger: 'Customer ABC',
      narration: 'Test invoice',
    });
  });

  test('computes debit/credit amounts correctly', () => {
    const { vouchers } = parseVoucherList(MOCK_VOUCHER_XML);
    const v = vouchers[0];
    expect(v.totalDebit).toBe(10000);
    expect(v.totalCredit).toBe(10000);
    expect(v.isBalanced).toBe(true);
  });

  test('ledger entries have explicit debit/credit fields', () => {
    const { vouchers } = parseVoucherList(MOCK_VOUCHER_XML);
    const entries = vouchers[0].ledgerEntries;
    expect(entries).toHaveLength(2);
    // Customer ABC is debit (ISDEEMEDPOSITIVE = Yes)
    expect(entries[0].debitAmount).toBe(10000);
    expect(entries[0].creditAmount).toBe(0);
    // Sales Account is credit
    expect(entries[1].creditAmount).toBe(10000);
    expect(entries[1].debitAmount).toBe(0);
  });
});
