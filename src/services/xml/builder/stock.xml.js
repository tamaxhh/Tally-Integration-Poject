/**
 * src/services/xml/builder/stock.xml.js
 *
 * Builds Tally XML requests for stock/inventory operations
 */

'use strict';

/**
 * Build XML request to get list of all stock items
 */
function buildStockItemsListXml({ company = '' } = {}) {
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>AllStockItems</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="AllStockItems">
            <TYPE>StockItem</TYPE>
            <FETCH>NAME,GUID,PARENT,BASEUNITS,ADDITIONALUNITS,ISDEEMEDPOSITIVE,ISREVENUEITEM,ISTAXABLE,ISDUTYPAID,ISEXCISABLE,ISSUPPLEMENTRYDUTYPAID,ISNONGSTABLE,ISNONMFG,ISNONMOVING,ISREJECTED,ISSCRAP,ISSALESRETURN,ISPURCHASERETURN,ISCAPITALGOODS,ISIMPORTED,ISEXPORTED,ISZEROPEFFECTED,ISFORJOBWORK,ISFOROWNUSE,ISFORRESALE,ISFORMANUFACTURE,ISASSET,ISCONSUMABLE,ISFIXEDASSET,ISINVENTORYPARTS,ISSERVICEITEM,ISLABOUR,ISOTHEREXPENSE,ISOTHERINCOME,ISPACKING,ISSAMPLE,ISSPARE,ISTOOLS,ISWORKINPROGRESS</FETCH>
            <FETCH>OPENINGBALANCE</FETCH>
            <FETCH>CLOSINGBALANCE</FETCH>
            <FETCH>RATE</FETCH>
            <FETCH>AMOUNT</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

/**
 * Build XML request to get detailed information for a single stock item
 */
function buildSingleStockItemXml({ stockItemName, company = '' } = {}) {
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>StockItemDetails</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="StockItemDetails">
            <TYPE>StockItem</TYPE>
            <FETCH>NAME,GUID,PARENT,BASEUNITS,ADDITIONALUNITS,ISDEEMEDPOSITIVE,ISREVENUEITEM,ISTAXABLE,ISDUTYPAID,ISEXCISABLE,ISSUPPLEMENTRYDUTYPAID,ISNONGSTABLE,ISNONMFG,ISNONMOVING,ISREJECTED,ISSCRAP,ISSALESRETURN,ISPURCHASERETURN,ISCAPITALGOODS,ISIMPORTED,ISEXPORTED,ISZEROPEFFECTED,ISFORJOBWORK,ISFOROWNUSE,ISFORRESALE,ISFORMANUFACTURE,ISASSET,ISCONSUMABLE,ISFIXEDASSET,ISINVENTORYPARTS,ISSERVICEITEM,ISLABOUR,ISOTHEREXPENSE,ISOTHERINCOME,ISPACKING,ISSAMPLE,ISSPARE,ISTOOLS,ISWORKINPROGRESS</FETCH>
            <FETCH>OPENINGBALANCE</FETCH>
            <FETCH>CLOSINGBALANCE</FETCH>
            <FETCH>RATE</FETCH>
            <FETCH>AMOUNT</FETCH>
            <FILTER>NAME = "${stockItemName}"</FILTER>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

/**
 * Build XML request to get stock summary
 */
function buildStockSummaryXml({ fromDate, toDate, company = '' } = {}) {
  const formatDate = (date) => date ? date.toISOString().slice(0, 10).replace(/-/g, '') : '';
  
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>DATA</TYPE>
    <ID>Stock Summary</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
        ${fromDate ? `<SVFROMDATE>${formatDate(fromDate)}</SVFROMDATE>` : ''}
        ${toDate ? `<SVTODATE>${formatDate(toDate)}</SVTODATE>` : ''}
      </STATICVARIABLES>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

module.exports = {
  buildStockItemsListXml,
  buildSingleStockItemXml,
  buildStockSummaryXml,
};
