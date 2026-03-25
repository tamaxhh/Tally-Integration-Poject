/**
 * src/services/xml/builder/voucher.xml.js
 *
 * Builds Tally XML requests for voucher operations
 */

'use strict';

/**
 * Build XML request to get list of vouchers
 */
function buildVoucherListXml({ company = '', from = '', to = '', voucherType = '' } = {}) {
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>Voucher Register</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
        ${from ? `<SVFROMDATE>${from}</SVFROMDATE>` : ''}
        ${to ? `<SVTODATE>${to}</SVTODATE>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Voucher Register" ISMODIFY="No">
            <TYPE>Voucher</TYPE>
            <FETCH>*</FETCH>
            ${voucherType ? `<FILTER>VOUCHERTYPENAME = "${voucherType}"</FILTER>` : ''}
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
function buildSingleVoucherXml({ voucherId, company = '' } = {}) {
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>Voucher Details</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Voucher Details" ISMODIFY="No">
            <TYPE>Voucher</TYPE>
            <FETCH>*</FETCH>
            <FILTER>GUID = "${voucherId}"</FILTER>
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
};
