/**
 * tests/integration/tally-mock/server.js
 *
 * MOCK TALLY SERVER — WHY IT EXISTS:
 * ====================================
 * You can't run integration tests against a real Tally installation in CI.
 * This mock server:
 * 1. Listens on port 9001 (not 9000, so it doesn't conflict with real Tally)
 * 2. Accepts the same XML requests your connector sends
 * 3. Returns realistic XML responses
 * 4. Simulates offline behavior when configured to do so
 *
 * This lets you test the ENTIRE stack (route → service → connector → XML parser)
 * without real Tally.
 *
 * HOW TO USE IN TESTS:
 * ---------------------
 * const { startMockTally, stopMockTally, setMockMode } = require('./server');
 * beforeAll(() => startMockTally(9001));
 * afterAll(() => stopMockTally());
 * test('handles Tally offline', () => {
 *   setMockMode('offline');
 *   // ... test that your code handles 503 correctly
 * });
 */

'use strict';

const http = require('http');

let server = null;
let mockMode = 'normal'; // 'normal' | 'offline' | 'slow' | 'error'

// ============================================================
// Sample XML responses that mimic real Tally output
// ============================================================

const LEDGER_RESPONSE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <GROUP NAME="Sundry Debtors">
            <LEDGER NAME="Customer ABC Ltd">
              <NAME>Customer ABC Ltd</NAME>
              <PARENT>Sundry Debtors</PARENT>
              <OPENINGBALANCE>30000.00</OPENINGBALANCE>
              <CLOSINGBALANCE>50000.00</CLOSINGBALANCE>
              <ISBILLWISEON>Yes</ISBILLWISEON>
              <ISREVENUE>No</ISREVENUE>
              <PARTYGSTIN>27AABCU9603R1ZX</PARTYGSTIN>
            </LEDGER>
            <LEDGER NAME="Customer XYZ Pvt Ltd">
              <NAME>Customer XYZ Pvt Ltd</NAME>
              <PARENT>Sundry Debtors</PARENT>
              <OPENINGBALANCE>15000.00</OPENINGBALANCE>
              <CLOSINGBALANCE>22500.00</CLOSINGBALANCE>
              <ISBILLWISEON>Yes</ISBILLWISEON>
              <ISREVENUE>No</ISREVENUE>
            </LEDGER>
          </GROUP>
          <GROUP NAME="Sales Accounts">
            <LEDGER NAME="Sales - Services">
              <NAME>Sales - Services</NAME>
              <PARENT>Sales Accounts</PARENT>
              <OPENINGBALANCE>0.00</OPENINGBALANCE>
              <CLOSINGBALANCE>125000.00</CLOSINGBALANCE>
              <ISBILLWISEON>No</ISBILLWISEON>
              <ISREVENUE>Yes</ISREVENUE>
            </LEDGER>
          </GROUP>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

const VOUCHER_RESPONSE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create" GUID="abc-123-def">
            <DATE>20240401</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>Sal-001</VOUCHERNUMBER>
            <PARTYLEDGERNAME>Customer ABC Ltd</PARTYLEDGERNAME>
            <NARRATION>Service invoice April 2024</NARRATION>
            <AMOUNT>10000.00</AMOUNT>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Customer ABC Ltd</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-10000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Sales - Services</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>10000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
          <VOUCHER VCHTYPE="Payment" ACTION="Create" GUID="xyz-456-ghi">
            <DATE>20240402</DATE>
            <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
            <VOUCHERNUMBER>Pay-001</VOUCHERNUMBER>
            <PARTYLEDGERNAME>Vendor Supplies Ltd</PARTYLEDGERNAME>
            <NARRATION>Office supplies payment</NARRATION>
            <AMOUNT>2500.00</AMOUNT>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Vendor Supplies Ltd</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>2500.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Bank Account</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-2500.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

const COMPANY_LIST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <BODY>
    <EXPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE>
          <COMPANY NAME="Test Company Ltd">
            <NAME>Test Company Ltd</NAME>
          </COMPANY>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

// ============================================================
// Request routing — determine which XML to return
// ============================================================

/**
 * Inspect the incoming XML body and decide which mock response to return.
 * This is a simple substring match — good enough for testing.
 *
 * @param {string} body - Incoming XML request body
 * @returns {string} XML response to send back
 */
function getResponseForRequest(body) {
  if (body.includes('List of Companies')) return COMPANY_LIST_XML;
  if (body.includes('List of Accounts') || body.includes('LEDGER')) return LEDGER_RESPONSE_XML;
  if (body.includes('Day Book') || body.includes('Voucher')) return VOUCHER_RESPONSE_XML;
  // Default: return company list for unknown requests
  return COMPANY_LIST_XML;
}

// ============================================================
// Mock server lifecycle
// ============================================================

/**
 * Start the mock Tally server.
 * @param {number} [port=9001]
 * @returns {Promise<void>}
 */
function startMockTally(port = 9001) {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      // Simulate offline mode
      if (mockMode === 'offline') {
        req.socket.destroy(); // Abruptly close connection — simulates ECONNRESET
        return;
      }

      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', async () => {
        // Simulate slow response
        if (mockMode === 'slow') {
          await new Promise(r => setTimeout(r, 6000)); // Longer than our 5s timeout
        }

        // Simulate Tally error response
        if (mockMode === 'error') {
          const errorXml = `<ENVELOPE><LINEERROR>Company not found</LINEERROR></ENVELOPE>`;
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(errorXml);
          return;
        }

        const responseXml = getResponseForRequest(body);
        res.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
        res.end(responseXml);
      });
    });

    server.listen(port, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });
}

/**
 * Stop the mock server.
 * @returns {Promise<void>}
 */
function stopMockTally() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        server = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Change the mock server behavior.
 * @param {'normal'|'offline'|'slow'|'error'} mode
 */
function setMockMode(mode) {
  mockMode = mode;
}

module.exports = { startMockTally, stopMockTally, setMockMode };
