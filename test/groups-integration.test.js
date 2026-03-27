/**
 * test/groups-integration.test.js
 * 
 * Integration tests for groups functionality
 */

'use strict';

const groupsService = require('../src/services/groups.service');
const { buildGroupsListXml } = require('../src/services/xml/builder/groups.xml');
const { parseGroupsResponse } = require('../src/services/xml/parser/groups.parser');

// Mock XML response for testing
const mockGroupsXmlResponse = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>AllGroups</ID>
  </HEADER>
  <BODY>
    <DATA>
      <COLLECTION>
        <GROUP>
          <NAME>Bank Accounts</NAME>
          <GUID>guid-123</GUID>
          <PARENT>Current Assets</PARENT>
          <ISGROUP>Yes</ISGROUP>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <BEHAVIOUR>BankAccounts</BEHAVIOUR>
          <ISPRIMARYGROUP>No</ISPRIMARYGROUP>
          <SORTALLOCATION>Ascending</SORTALLOCATION>
          <ISCOSTCENTREON>No</ISCOSTCENTREON>
          <ISCOSTCENTRECREATEDON>No</ISCOSTCENTRECREATEDON>
        </GROUP>
        <GROUP>
          <NAME>Current Assets</NAME>
          <GUID>guid-456</GUID>
          <PARENT>Assets</PARENT>
          <ISGROUP>Yes</ISGROUP>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <BEHAVIOUR>CurrentAssets</BEHAVIOUR>
          <ISPRIMARYGROUP>No</ISPRIMARYGROUP>
          <SORTALLOCATION>Ascending</SORTALLOCATION>
          <ISCOSTCENTREON>No</ISCOSTCENTREON>
          <ISCOSTCENTRECREATEDON>No</ISCOSTCENTRECREATEDON>
        </GROUP>
        <GROUP>
          <NAME>Assets</NAME>
          <GUID>guid-789</GUID>
          <PARENT></PARENT>
          <ISGROUP>Yes</ISGROUP>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <BEHAVIOUR>Assets</BEHAVIOUR>
          <ISPRIMARYGROUP>Yes</ISPRIMARYGROUP>
          <SORTALLOCATION>Ascending</SORTALLOCATION>
          <ISCOSTCENTREON>No</ISCOSTCENTREON>
          <ISCOSTCENTRECREATEDON>No</ISCOSTCENTRECREATEDON>
        </GROUP>
        <GROUP>
          <NAME>Sales Accounts</NAME>
          <GUID>guid-012</GUID>
          <PARENT>Income</PARENT>
          <ISGROUP>Yes</ISGROUP>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <BEHAVIOUR>SalesAccounts</BEHAVIOUR>
          <ISPRIMARYGROUP>No</ISPRIMARYGROUP>
          <SORTALLOCATION>Ascending</SORTALLOCATION>
          <ISCOSTCENTREON>No</ISCOSTCENTREON>
          <ISCOSTCENTRECREATEDON>No</ISCOSTCENTRECREATEDON>
        </GROUP>
      </COLLECTION>
    </DATA>
  </BODY>
</ENVELOPE>`;

// Simple test runner - skip Jest tests for now
if (require.main === module) {
  console.log('🧪 Running Groups Integration Tests...\n');
  
  // Simple test runner
  const tests = [
    { name: 'XML Builder Test', test: () => {
      const xml = buildGroupsListXml({ company: 'Test' });
      if (!xml.includes('Test')) throw new Error('Company not included in XML');
      console.log('✅ XML Builder Test passed');
    }},
    
    { name: 'XML Parser Test', test: () => {
      const groups = parseGroupsResponse(mockGroupsXmlResponse);
      if (groups.length !== 4) throw new Error(`Expected 4 groups, got ${groups.length}`);
      console.log('✅ XML Parser Test passed');
    }},
    
    { name: 'Summary Generator Test', test: () => {
      const groups = parseGroupsResponse(mockGroupsXmlResponse);
      const summary = groupsService.generateGroupsSummary(groups);
      if (summary.totalGroups !== 4) throw new Error(`Expected 4 total groups, got ${summary.totalGroups}`);
      console.log('✅ Summary Generator Test passed');
    }},
    
    { name: 'Hierarchy Builder Test', test: () => {
      const groups = parseGroupsResponse(mockGroupsXmlResponse);
      const hierarchy = groupsService.buildHierarchyTree(groups);
      console.log(`🔍 Debug - Hierarchy length: ${hierarchy.length}`);
      hierarchy.forEach((group, index) => {
        console.log(`🔍 Root group ${index}: ${group.name}, parent: "${group.parent}"`);
      });
      if (hierarchy.length < 1) throw new Error(`Expected at least 1 root group, got ${hierarchy.length}`);
      console.log('✅ Hierarchy Builder Test passed');
    }}
  ];
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach(({ name, test }) => {
    try {
      test();
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed.');
  }
}
