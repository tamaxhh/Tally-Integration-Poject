/**
 * src/services/xml/builder/groups.xml.js
 *
 * Builds Tally XML requests for groups operations
 */

'use strict';

/**
 * Build XML request to get list of all groups - Updated with working logic
 */
function buildGroupsListXml({ fromDate, toDate, company = '' } = {}) {
  const formatDate = (date) => date ? date.toISOString().slice(0, 10).replace(/-/g, '') : '';
  
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>AllGroups</ID>
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
          <COLLECTION NAME="AllGroups">
            <TYPE>Group</TYPE>
            <FETCH>NAME,GUID,PARENT,ISGROUP,ISDEEMEDPOSITIVE,BEHAVIOUR,ISPRIMARYGROUP,SORTALLOCATION,ISCOSTCENTREON,ISCOSTCENTRECREATEDON</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

/**
 * Build XML request to get detailed information for all groups - Updated with working logic
 * Fetches complete group data including hierarchy and behaviour
 */
function buildDetailedGroupsXml({ fromDate, toDate, company = '' } = {}) {
  const formatDate = (date) => date ? date.toISOString().slice(0, 10).replace(/-/g, '') : '';
  
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>Collection</ID>
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
          <COLLECTION NAME="MyDetailedGroups">
            <TYPE>Group</TYPE>
            <FETCH>GUID,NAME,PARENT,ISGROUP,ISDEEMEDPOSITIVE,BEHAVIOUR,ISPRIMARYGROUP,SORTALLOCATION,ISCOSTCENTREON,ISCOSTCENTRECREATEDON,ISBILLWISEON,ISADDITIONALCALCULATION,ISCONDENSED,ISGODOWN,ISSUBLEDGER,ISREVENUE,ISABSTRACTCOSTCENTRE,ISAUTOGROUP,ISAUTOCOSTCENTRE,ISPRIMARYCOSTCENTRE</FETCH>
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
    <TYPE>Collection</TYPE>
    <ID>Group Details</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Group Details" ISMODIFY="No">
            <TYPE>Group</TYPE>
            <FETCH>NAME,GUID,PARENT,ISGROUP,ISDEEMEDPOSITIVE,BEHAVIOUR,ISPRIMARYGROUP,SORTALLOCATION,ISCOSTCENTREON,ISCOSTCENTRECREATEDON,ISBILLWISEON,ISADDITIONALCALCULATION,ISCONDENSED,ISGODOWN,ISSUBLEDGER,ISREVENUE,ISABSTRACTCOSTCENTRE,ISAUTOGROUP,ISAUTOCOSTCENTRE,ISPRIMARYCOSTCENTRE</FETCH>
            <FILTER>NAME = "${groupName}"</FILTER>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

/**
 * Build XML request to get groups by parent
 */
function buildGroupsByParentXml({ parentName, company = '' } = {}) {
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>GroupsByParent</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="GroupsByParent" ISMODIFY="No">
            <TYPE>Group</TYPE>
            <FETCH>NAME,GUID,PARENT,ISGROUP,ISDEEMEDPOSITIVE,BEHAVIOUR,ISPRIMARYGROUP,SORTALLOCATION,ISCOSTCENTREON,ISCOSTCENTRECREATEDON</FETCH>
            <FILTER>PARENT = "${parentName}"</FILTER>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

module.exports = {
  buildGroupsListXml,
  buildDetailedGroupsXml,
  buildSingleGroupXml,
  buildGroupsByParentXml,
};
