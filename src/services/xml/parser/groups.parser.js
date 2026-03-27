/**
 * src/services/xml/parser/groups.parser.js
 * 
 * Parses Tally XML responses for groups data
 */

'use strict';

/**
 * Parse XML response and extract groups data
 */
function parseGroupsResponse(xmlResponse) {
  try {
    const groups = [];
    
    // Extract GROUP data using regex patterns
    const groupMatches = xmlResponse.match(/<GROUP[^>]*>[\s\S]*?<\/GROUP>/g) || [];
    
    groupMatches.forEach(groupXml => {
      const group = {};
      
      // Extract each field using regex patterns
      const nameMatch = groupXml.match(/<NAME>(.*?)<\/NAME>/i);
      const guidMatch = groupXml.match(/<GUID>(.*?)<\/GUID>/i);
      const parentMatch = groupXml.match(/<PARENT>(.*?)<\/PARENT>/i);
      const isGroupMatch = groupXml.match(/<ISGROUP>(.*?)<\/ISGROUP>/i);
      const isDeemedPositiveMatch = groupXml.match(/<ISDEEMEDPOSITIVE>(.*?)<\/ISDEEMEDPOSITIVE>/i);
      const behaviourMatch = groupXml.match(/<BEHAVIOUR>(.*?)<\/BEHAVIOUR>/i);
      const isPrimaryMatch = groupXml.match(/<ISPRIMARYGROUP>(.*?)<\/ISPRIMARYGROUP>/i);
      const sortAllocationMatch = groupXml.match(/<SORTALLOCATION>(.*?)<\/SORTALLOCATION>/i);
      const isCostCentreOnMatch = groupXml.match(/<ISCOSTCENTREON>(.*?)<\/ISCOSTCENTREON>/i);
      const isCostCentreCreatedOnMatch = groupXml.match(/<ISCOSTCENTRECREATEDON>(.*?)<\/ISCOSTCENTRECREATEDON>/i);
      
      if (nameMatch) {
        group.name = nameMatch[1].trim();
        group.guid = guidMatch ? guidMatch[1].trim() : '';
        group.parent = parentMatch ? parentMatch[1].trim() : '';
        group.isGroup = isGroupMatch ? isGroupMatch[1].trim() === 'Yes' : false;
        group.isDeemedPositive = isDeemedPositiveMatch ? isDeemedPositiveMatch[1].trim() === 'Yes' : false;
        group.behaviour = behaviourMatch ? behaviourMatch[1].trim() : '';
        group.isPrimary = isPrimaryMatch ? isPrimaryMatch[1].trim() === 'Yes' : false;
        group.sortAllocation = sortAllocationMatch ? sortAllocationMatch[1].trim() : '';
        group.isCostCentreOn = isCostCentreOnMatch ? isCostCentreOnMatch[1].trim() === 'Yes' : false;
        group.isCostCentreCreatedOn = isCostCentreCreatedOnMatch ? isCostCentreCreatedOnMatch[1].trim() === 'Yes' : false;
        
        groups.push(group);
      }
    });
    
    return groups;
  } catch (error) {
    console.error('Error parsing groups response:', error);
    return [];
  }
}

/**
 * Parse single group response
 */
function parseSingleGroupResponse(xmlResponse) {
  const groups = parseGroupsResponse(xmlResponse);
  return groups.length > 0 ? groups[0] : null;
}

/**
 * Validate group data
 */
function validateGroupData(group) {
  const errors = [];
  
  if (!group.name || group.name.trim() === '') {
    errors.push('Group name is required');
  }
  
  if (!group.guid || group.guid.trim() === '') {
    errors.push('Group GUID is missing');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Clean and normalize group data
 */
function normalizeGroupData(group) {
  const normalized = { ...group };
  
  // Trim string fields
  Object.keys(normalized).forEach(key => {
    if (typeof normalized[key] === 'string') {
      normalized[key] = normalized[key].trim();
    }
  });
  
  // Ensure boolean fields are properly typed
  const booleanFields = ['isGroup', 'isDeemedPositive', 'isPrimary', 'isCostCentreOn', 'isCostCentreCreatedOn'];
  booleanFields.forEach(field => {
    if (normalized[field] !== undefined) {
      normalized[field] = Boolean(normalized[field]);
    }
  });
  
  return normalized;
}

/**
 * Extract error information from XML response
 */
function parseErrorResponse(xmlResponse) {
  try {
    const errorMatch = xmlResponse.match(/<ERROR>(.*?)<\/ERROR>/i);
    const lineMatch = xmlResponse.match(/<LINE>(.*?)<\/LINE>/i);
    
    return {
      hasError: !!errorMatch,
      error: errorMatch ? errorMatch[1].trim() : 'Unknown error',
      line: lineMatch ? lineMatch[1].trim() : null
    };
  } catch (error) {
    return {
      hasError: true,
      error: 'Failed to parse error response',
      line: null
    };
  }
}

module.exports = {
  parseGroupsResponse,
  parseSingleGroupResponse,
  validateGroupData,
  normalizeGroupData,
  parseErrorResponse
};
