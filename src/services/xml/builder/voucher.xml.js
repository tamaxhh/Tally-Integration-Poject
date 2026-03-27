/**
 * src/services/xml/builder/voucher.xml.js
 *
 * Builds Tally XML requests for voucher operations
 */

'use strict';

/**
 * Build XML request to get list of vouchers
 */
function buildVoucherListXml({ company = '', fromDate = '', toDate = '', voucherType = '' } = {}) {
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>AllVouchers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
        ${fromDate ? `<SVFROMDATE>${fromDate}</SVFROMDATE>` : ''}
        ${toDate ? `<SVTODATE>${toDate}</SVTODATE>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="AllVouchers">
            <TYPE>Voucher</TYPE>
            <FETCH>DATE,VOUCHERTYPENAME,NARRATION,PARTYNAME,AMOUNT,ALLLEDGERENTRIES.LIST:*</FETCH>
            ${voucherType ? `<FILTER>VOUCHERTYPENAME = "${voucherType}"</FILTER>` : ''}
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

/**
 * Build XML request to get detailed information for all vouchers
 * Fetches complete voucher data including all ledger entries and amounts
 */
function buildDetailedVoucherXml({ company = '', fromDate = '', toDate = '', voucherType = '' } = {}) {
  // Ignore voucherType parameter until we fix TDL filter syntax
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>AllVouchers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
        ${fromDate ? `<SVFROMDATE>${fromDate}</SVFROMDATE>` : ''}
        ${toDate ? `<SVTODATE>${toDate}</SVTODATE>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="AllVouchers">
            <TYPE>Voucher</TYPE>
            <FETCH>DATE,VOUCHERTYPENAME,NARRATION,PARTYNAME,AMOUNT,ALLLEDGERENTRIES.LIST:*</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

/**
 * Build XML request to get single voucher details
 */
function buildSingleVoucherXml({ voucherGuid, company = '' } = {}) {
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>Voucher Details</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Voucher Details" ISMODIFY="No">
            <TYPE>Voucher</TYPE>
            <FETCH>GUID,DATE,VOUCHERTYPENAME,VOUCHERNUMBER,NARRATION,PARTYNAME,AMOUNT,ALLLEDGERENTRIES.LIST:*</FETCH>
            <FILTER>GUID = "${voucherGuid}"</FILTER>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

module.exports = {
  buildVoucherListXml,
  buildSingleVoucherXml,
  buildDetailedVoucherXml,
};
