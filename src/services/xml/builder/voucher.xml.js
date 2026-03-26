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
  const formatDate = (date) => date ? date.toISOString().slice(0, 10).replace(/-/g, '') : '';
  
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
        ${fromDate ? `<SVFROMDATE>${formatDate(fromDate)}</SVFROMDATE>` : ''}
        ${toDate ? `<SVTODATE>${formatDate(toDate)}</SVTODATE>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="AllVouchers">
            <TYPE>Voucher</TYPE>
            <FETCH>DATE,VOUCHERTYPENAME,NARRATION,ALLLEDGERENTRIES.LIST:*</FETCH>
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
  const formatDate = (date) => date ? date.toISOString().slice(0, 10).replace(/-/g, '') : '';
  
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>AllVouchersDetailed</ID>
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
          <COLLECTION NAME="AllVouchersDetailed">
            <TYPE>Voucher</TYPE>
            <FETCH>DATE,VOUCHERTYPENAME,VOUCHERNUMBER,NARRATION,REFERENCE,ALTERID,EXCISEOPENING,EXCISECLOSING,STATENAME,CSTFORMNUMBER,CSTFORMDATE,VATCSTCLASSIFICATION,DIFFACTUALQTY,DIFFACTUALS,DIFFQTY,DIFFAMOUNT,ISDELETED,ISCANCELLED,HASDISCOUNT,ISPOSTDATED,ISEXCISEOPENING,ISINVOICE,ISCANCELLED,ISCOSTCENTRE,ISINVOICE,ISDEEMEDPOSITIVE,ISOPTIONAL,ISPOSTDATED,HASDISCOUNT,ISADVANCEMODE,ISCONSIDEREDFORGSTRATE,ISGSTAPPLICABLE,ISGSTNONGSTSUPPLIES,ISGSTEXEMPTED,ISGSTNILRATED,ISGSTZERO,RATE,AMOUNT</FETCH>
            <FETCH>ALLLEDGERENTRIES.LIST:*</FETCH>
            <FETCH>ALLINVENTORYENTRIES.LIST:*</FETCH>
            <FETCH>ALLSTATUTORYDETAILS.LIST:*</FETCH>
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
  buildDetailedVoucherXml,
};
