/**
 * src/services/xml/builder/ledger.xml.js
 *
 * Builds Tally XML requests for ledger operations
 */

'use strict';

/**
 * Build XML request to get list of all ledgers - Updated with working logic
 */
function buildLedgerListXml({ fromDate, toDate, company = '' } = {}) {
  const formatDate = (date) => date ? date.toISOString().slice(0, 10).replace(/-/g, '') : '';
  
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>AllLedgers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
        ${fromDate ? `<SVFROMDATE>${formatDate(fromDate)}</SVFROMDATE>` : ''}
        ${toDate ? `<SVTODATE>${formatDate(toDate)}</SVTODATE>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="AllLedgers">
            <TYPE>Ledger</TYPE>
            <FETCH>NAME,GUID,PARENT,OPENINGBALANCE,CLOSINGBALANCE</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

/**
 * Build XML request to get detailed information for a single ledger
 */
function buildSingleLedgerXml({ ledgerName, company = '' } = {}) {
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>Ledger Details</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Ledger Details" ISMODIFY="No">
            <TYPE>Ledger</TYPE>
            <FETCH>NAME,GUID,PARENT,OPENINGBALANCE,CLOSINGBALANCE,CURRENTBALANCE,LEDGERFBANKING,PARTYNAME,PARTYMAIL,PARTYADDRESS,PARTYPHONE,PARTYGSTIN,PAN,BILLBYBILL,AFFECTSSTOCK,ISDEEMEDPOSITIVE,ISCOSTCENTREON,ISCOSTCENTRECREATEDON</FETCH>
            <FILTER>NAME = "${ledgerName}"</FILTER>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

/**
 * Build XML request to get ledger balances
 */
function buildLedgerBalanceXml({ ledgerName, company = '' } = {}) {
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>Ledger Balance</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Ledger Balance" ISMODIFY="No">
            <TYPE>Ledger</TYPE>
            <FETCH>NAME,OPENINGBALANCE,CLOSINGBALANCE,CURRENTBALANCE,PARENT,GUID</FETCH>
            <FILTER>NAME = "${ledgerName}"</FILTER>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

/**
 * Build XML request to get ledger transactions
 */
function buildLedgerTransactionsXml({ ledgerName, fromDate, toDate, company = '' } = {}) {
  const formatDate = (date) => date ? date.toISOString().slice(0, 10).replace(/-/g, '') : '';
  
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>Ledger Transactions</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
        ${fromDate ? `<SVFROMDATE>${formatDate(fromDate)}</SVFROMDATE>` : ''}
        ${toDate ? `<SVTODATE>${formatDate(toDate)}</SVTODATE>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Ledger Transactions" ISMODIFY="No">
            <TYPE>Ledger</TYPE>
            <FETCH>NAME,GUID,DATE,VOUCHERTYPENAME,VOUCHERNUMBER,NARRATION,AMOUNT</FETCH>
            <FILTER>NAME = "${ledgerName}"</FILTER>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

/**
 * Build XML request to get detailed information for all ledgers - Updated with working logic
 * Fetches complete ledger data including balances and parent groups
 */
function buildDetailedLedgerXml({ fromDate, toDate, company = '' } = {}) {
  const formatDate = (date) => date ? date.toISOString().slice(0, 10).replace(/-/g, '') : '';
  
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>AllLedgers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
        ${fromDate ? `<SVFROMDATE>${formatDate(fromDate)}</SVFROMDATE>` : ''}
        ${toDate ? `<SVTODATE>${formatDate(toDate)}</SVTODATE>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="AllLedgers">
            <TYPE>Ledger</TYPE>
            <FETCH>GUID,NAME,PARENT,OPENINGBALANCE,CLOSINGBALANCE,GSTIN,BANKACCOUNTNUMBER,BANKNAME,PAN,EMAIL</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

/**
 * Build XML envelope for exporting Tally reports (NOT collections)
 * Used for built-in reports like Trial Balance, P&L, Balance Sheet
 */
function buildExportEnvelope({ reportName, fromDate, toDate, company }) {
  const formatDate = (date) => date ? date.toISOString().slice(0, 10).replace(/-/g, '') : '';
  
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>DATA</TYPE>
    <ID>${reportName}</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
        <SVFROMDATE>${fromDate ? formatDate(fromDate) : ''}</SVFROMDATE>
        <SVTODATE>${toDate ? formatDate(toDate) : ''}</SVTODATE>
        <EXPLODEFLAG>Yes</EXPLODEFLAG>
      </STATICVARIABLES>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

module.exports = {
  buildExportEnvelope,
  buildLedgerListXml,
  buildSingleLedgerXml,
  buildDetailedLedgerXml,
  buildLedgerBalanceXml,
  buildLedgerTransactionsXml,
};
