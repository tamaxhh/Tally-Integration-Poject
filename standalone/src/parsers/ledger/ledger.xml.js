/**
 * src/xml/builder/ledger.xml.js
 *
 * HOW TALLY'S XML API WORKS — THE FULL PICTURE:
 * -----------------------------------------------
 * Tally's HTTP server listens on port 9000 and accepts XML in a specific envelope format.
 * All requests are POST requests to "/" with an XML body.
 *
 * THE TALLY XML ENVELOPE STRUCTURE:
 * ----------------------------------
 * Every Tally request is wrapped in this structure:
 *
 * <ENVELOPE>
 *   <HEADER>
 *     <TALLYREQUEST>Export Data</TALLYREQUEST>  ← or "Import Data" for writes
 *   </HEADER>
 *   <BODY>
 *     <EXPORTDATA>
 *       <REQUESTDESC>
 *         <REPORTNAME>...</REPORTNAME>          ← What you want (Ledger, Voucher, etc.)
 *         <STATICVARIABLES>
 *           <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>  ← Always XML
 *           <!-- Optional filters and date ranges go here -->
 *         </STATICVARIABLES>
 *       </REQUESTDESC>
 *     </EXPORTDATA>
 *   </BODY>
 * </ENVELOPE>
 *
 * TALLY FIELD NAMES — IMPORTANT GOTCHAS:
 * ----------------------------------------
 * Tally field names are ALL CAPS and often cryptic. Key ones:
 * - SVFROMDATE / SVTODATE: Date range filters (format: YYYYMMDD or "1-Apr-2023")
 * - SVCURRENTCOMPANY: Which company's data to fetch
 * - SVEXPORTFORMAT: Always set to $$SysName:XML
 * - LEDGERNAME: For single-ledger queries
 *
 * WHY WE BUILD XML AS STRINGS (not DOM/XML library):
 * ----------------------------------------------------
 * Tally's XML is simple and predictable. Using a full XML library (like xmlbuilder2)
 * adds complexity with no benefit here. Template literals are readable, fast,
 * and easy to test. The tradeoff: you must manually escape special characters
 * in user-provided values (we do this in the sanitize() helper below).
 */

'use strict';

const config = require('../../config');

/**
 * Sanitize a value for safe XML embedding.
 * Without this, a ledger named "A&B Ltd" would produce invalid XML.
 *
 * These are the 5 predefined XML entities. You MUST escape these
 * before embedding any user-provided string in XML.
 *
 * @param {string} value
 * @returns {string} XML-safe string
 */
function xmlEscape(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')   // Must be first — or you'd double-escape the others
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format a JS Date object into Tally's expected date format: "1-Apr-2023"
 * Tally is picky about this format — YYYYMMDD works in some versions but not all.
 *
 * @param {Date} date
 * @returns {string} e.g. "1-Apr-2023"
 */
function formatTallyDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const day = d.getDate(); // No leading zero — Tally doesn't want it
  const month = d.toLocaleString('en-US', { month: 'short' }); // "Apr"
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Build the common wrapper for all Tally export requests.
 * Most config belongs here — specific report requests extend this.
 */
function buildExportEnvelope({ reportName, company, fromDate, toDate, extraVars = '' }) {
  const companyName = xmlEscape(company || config.tally.companyName);
  const companyVar = companyName
    ? `<SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>`
    : ''; // If empty, Tally uses the active company

  const dateVars = fromDate && toDate
    ? `<SVFROMDATE>${formatTallyDate(fromDate)}</SVFROMDATE>
       <SVTODATE>${formatTallyDate(toDate)}</SVTODATE>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>${xmlEscape(reportName)}</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          ${companyVar}
          ${dateVars}
          ${extraVars}
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`.trim();
}

// ============================================================
// Public XML builders — one function per report type
// ============================================================

/**
 * Build XML to fetch ALL ledgers from Tally.
 * Tally's "List of Accounts" report returns all chart-of-accounts entries.
 *
 * SAMPLE OUTPUT:
 * <ENVELOPE>
 *   <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
 *   <BODY><EXPORTDATA><REQUESTDESC>
 *     <REPORTNAME>List of Accounts</REPORTNAME>
 *     <STATICVARIABLES>
 *       <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
 *     </STATICVARIABLES>
 *   </REQUESTDESC></EXPORTDATA></BODY>
 * </ENVELOPE>
 *
 * @param {object} [options]
 * @param {string} [options.company] - Tally company name (uses active if omitted)
 * @returns {string} XML request string
 */
function buildLedgerListXml({ company } = {}) {
  return buildExportEnvelope({
    reportName: 'List of Accounts',
    company,
  });
}

/**
 * Build XML to fetch a SINGLE ledger's details by name.
 * Used for the GET /ledgers/:name endpoint.
 *
 * @param {object} options
 * @param {string} options.ledgerName - Exact ledger name in Tally
 * @param {string} [options.company]
 * @returns {string} XML request string
 */
function buildSingleLedgerXml({ ledgerName, company } = {}) {
  if (!ledgerName) throw new Error('ledgerName is required for single ledger query');

  return buildExportEnvelope({
    reportName: 'Ledger',
    company,
    // LEDGERNAME is Tally's filter variable for a specific ledger
    extraVars: `<LEDGERNAME>${xmlEscape(ledgerName)}</LEDGERNAME>`,
  });
}

/**
 * Build XML to fetch ledger balances (closing balance for each account).
 * Useful for balance sheet and account summary endpoints.
 *
 * @param {object} [options]
 * @param {string} [options.company]
 * @param {Date} [options.asOfDate] - Balance as of this date
 * @returns {string} XML request string
 */
function buildLedgerBalancesXml({ company, asOfDate } = {}) {
  const toDate = asOfDate || new Date();
  // For balances, we go from the beginning of time (Tally's fiscal start)
  // to the requested date. Tally handles the fiscal year logic internally.
  return buildExportEnvelope({
    reportName: 'Trial Balance',
    company,
    toDate,
    fromDate: new Date('2000-01-01'), // Far enough back to cover any data
  });
}

module.exports = {
  buildLedgerListXml,
  buildSingleLedgerXml,
  buildLedgerBalancesXml,
  formatTallyDate,
  xmlEscape,
};
