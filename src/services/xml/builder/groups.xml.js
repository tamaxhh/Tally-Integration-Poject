/**
 * src/services/xml/builder/groups.xml.js
 *
 * Builds Tally XML requests for group operations
 */

'use strict';

/**
 * Build XML request to get list of all groups (chart of accounts)
 */
function buildGroupsListXml({ fromDate, toDate } = {}) {
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
        ${fromDate ? `<SVFROMDATE>${formatDate(fromDate)}</SVFROMDATE>` : ''}
        ${toDate ? `<SVTODATE>${formatDate(toDate)}</SVTODATE>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="AllLedgers">
            <TYPE>Group</TYPE>
            <FETCH>NAME</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

/**
 * Build XML request to get detailed information for a single group
 */
function buildSingleGroupXml({ groupName, company = '' } = {}) {
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>GroupDetails</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="GroupDetails">
            <TYPE>Group</TYPE>
            <FETCH>NAME,GUID,PARENT,ISGROUP,ISDEEMEDPOSITIVE,ISCOSTCENTREON,ISCOSTCENTRECREATEDON,SORTALLOCATION,BEHAVIOUR,ISBILLWISEON,ISADDITIONALCALCULATION,ISCONDENSED,ISGODOWN,ISSUBLEDGER,ISREVENUE,ISABSTRACTCOSTCENTRE,ISAUTOGROUP,ISAUTOCOSTCENTRE,ISPRIMARYGROUP,ISPRIMARYCOSTCENTRE</FETCH>
            <FILTER>NAME = "${groupName}"</FILTER>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

module.exports = {
  buildGroupsListXml,
  buildSingleGroupXml,
};
