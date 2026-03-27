'use strict';

const { sendToTally } = require('./connectors/tally.client.js');
const { buildGroupsListXml, buildSingleGroupXml } = require('./xml/builder/groups.xml');
const { parseGroupsResponse } = require('./xml/parser/groups.parser');
const cacheManager = require('../cache/simple-cache');
const logger = require('../config/logger');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');

// Cache key namespacing
const CACHE_PREFIX = 'tally:groups';

/**
 * Generate comprehensive groups summary
 */
function generateGroupsSummary(groups) {
  const summary = {
    totalGroups: groups.length,
    primaryGroups: 0,
    secondaryGroups: 0,
    rootGroups: 0,
    byParent: {},
    byBehaviour: {},
    deemedPositive: 0,
    notDeemedPositive: 0,
    hierarchy: {
      maxDepth: 0,
      averageDepth: 0,
      topLevelGroups: []
    },
    behaviours: {
      income: 0,
      expense: 0,
      asset: 0,
      liability: 0,
      equity: 0,
      other: 0
    }
  };
  
  const depthMap = new Map();
  
  groups.forEach(group => {
    // Count primary vs secondary
    if (group.isPrimary) {
      summary.primaryGroups++;
    } else {
      summary.secondaryGroups++;
    }
    
    // Count root groups (no parent)
    if (!group.parent || group.parent === '') {
      summary.rootGroups++;
      summary.hierarchy.topLevelGroups.push(group.name);
    }
    
    // Count by parent
    const parent = group.parent || 'Root';
    summary.byParent[parent] = (summary.byParent[parent] || 0) + 1;
    
    // Count by behaviour
    const behaviour = group.behaviour || 'None';
    summary.byBehaviour[behaviour] = (summary.byBehaviour[behaviour] || 0) + 1;
    
    // Categorize behaviours
    const behaviourCategory = categorizeBehaviour(behaviour);
    if (summary.behaviours[behaviourCategory] !== undefined) {
      summary.behaviours[behaviourCategory]++;
    } else {
      summary.behaviours.other++;
    }
    
    // Count deemed positive
    if (group.isDeemedPositive) {
      summary.deemedPositive++;
    } else {
      summary.notDeemedPositive++;
    }
    
    // Calculate hierarchy depth
    const depth = calculateGroupDepth(group, groups);
    depthMap.set(group.name, depth);
    summary.hierarchy.maxDepth = Math.max(summary.hierarchy.maxDepth, depth);
  });
  
  // Calculate average depth
  if (depthMap.size > 0) {
    summary.hierarchy.averageDepth = 
      Array.from(depthMap.values()).reduce((a, b) => a + b, 0) / depthMap.size;
  }
  
  return summary;
}

/**
 * Categorize group behaviour
 */
function categorizeBehaviour(behaviour) {
  if (!behaviour) return 'other';
  
  const behaviourLower = behaviour.toLowerCase();
  
  if (behaviourLower.includes('income') || behaviourLower.includes('revenue')) {
    return 'income';
  } else if (behaviourLower.includes('expense') || behaviourLower.includes('cost')) {
    return 'expense';
  } else if (behaviourLower.includes('asset') || behaviourLower.includes('bank') || 
             behaviourLower.includes('cash') || behaviourLower.includes('debtors')) {
    return 'asset';
  } else if (behaviourLower.includes('liability') || behaviourLower.includes('creditor') || 
             behaviourLower.includes('capital')) {
    return 'liability';
  } else if (behaviourLower.includes('equity') || behaviourLower.includes('capital')) {
    return 'equity';
  }
  
  return 'other';
}

/**
 * Calculate the depth of a group in the hierarchy
 */
function calculateGroupDepth(group, allGroups) {
  if (!group.parent || group.parent === '') {
    return 0; // Root level
  }
  
  const parent = allGroups.find(g => g.name === group.parent);
  if (!parent) {
    return 1; // Parent not found, assume one level deep
  }
  
  return 1 + calculateGroupDepth(parent, allGroups);
}

/**
 * Parse groups data from XML response
 */
function parseGroupsData(xmlResponse) {
  try {
    const result = parseGroupsResponse(xmlResponse);
    return result;
  } catch (error) {
    logger.error('Error parsing groups data:', error);
    return [];
  }
}

/**
 * MAIN FUNCTION - Get all groups with complete data
 * 
 * @param {object} [options]
 * @param {string} [options.company] - Tally company name
 * @param {boolean} [options.bypassCache] - Force fresh fetch
 * @returns {Promise<object>} Groups data in complete format
 */
async function getGroups({ company = '', bypassCache = false } = {}) {
  logger.info({ company, bypassCache }, 'SERVICE CALLED - getGroups');
  const cacheKey = `${CACHE_PREFIX}:${company || 'default'}`;

  try {
    // Step 1: Try cache (unless explicitly bypassed)
    if (!bypassCache) {
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        logger.info({ cacheKey }, '✅ CACHE HIT');
        return { ...cached, fromCache: true };
      }
    }

    // Step 2: Build XML request
    logger.info('📦 BUILDING XML...');
    const xmlRequest = buildGroupsListXml({ company });
    logger.info({ xmlLength: xmlRequest.length }, 'XML built');

    // Step 3: Send to Tally
    logger.info('🚀 CALLING TALLY...');
    const xmlResponse = await sendToTally(xmlRequest);
    logger.info({ responseLength: xmlResponse.length }, '✅ TALLY RESPONSE RECEIVED');

    // Step 4: Parse the XML response
    logger.info('📊 PARSING RESPONSE...');
    const groups = parseGroupsData(xmlResponse);
    logger.info({ total: groups.length }, '✅ PARSED SUCCESSFULLY');

    // Step 5: Generate comprehensive summary
    const summary = generateGroupsSummary(groups);

    // Step 6: Create final result structure
    const result = {
      metadata: {
        fetchTimestamp: new Date().toISOString(),
        totalGroups: groups.length,
        company: company || 'Default',
        note: 'Groups data fetched using Tally XML API'
      },
      groups: groups,
      summary: summary
    };

    // Step 7: Store in cache
    await cacheManager.set(cacheKey, result, config.redis.ttlSeconds);
    logger.info({ cacheKey }, '💾 CACHED RESULT');

    return { ...result, fromCache: false };
  } catch (error) {
    logger.error({ error, company, cacheKey }, 'Failed to get groups');
    throw error;
  }
}

/**
 * Get groups by parent
 */
async function getGroupsByParent(parentName, { company = '', bypassCache = false } = {}) {
  try {
    logger.info({ parentName, company }, 'Fetching groups by parent');
    
    // Get all groups
    const result = await getGroups({ company, bypassCache });
    
    // Filter by parent
    const filteredGroups = result.groups.filter(group => 
      group.parent === parentName
    );
    
    return {
      success: true,
      parent: parentName,
      groups: filteredGroups,
      total: filteredGroups.length,
      fromCache: result.fromCache
    };
    
  } catch (error) {
    logger.error({ error, parentName, company }, 'Failed to get groups by parent');
    throw error;
  }
}

/**
 * Search groups by name
 */
async function searchGroups(query, { company = '', bypassCache = false } = {}) {
  try {
    logger.info({ query, company }, 'Searching groups');
    
    // Get all groups
    const result = await getGroups({ company, bypassCache });
    
    // Filter by search query
    const filteredGroups = result.groups.filter(group => 
      group.name.toLowerCase().includes(query.toLowerCase())
    );
    
    return {
      success: true,
      query: query,
      groups: filteredGroups,
      total: filteredGroups.length,
      fromCache: result.fromCache
    };
    
  } catch (error) {
    logger.error({ error, query, company }, 'Failed to search groups');
    throw error;
  }
}

/**
 * Get single group by name
 */
async function getGroupByName(groupName, { company = '', bypassCache = false } = {}) {
  try {
    logger.info({ groupName, company }, 'Fetching single group');
    
    // Get all groups
    const result = await getGroups({ company, bypassCache });
    
    // Find specific group
    const group = result.groups.find(g => g.name === groupName);
    
    return {
      success: true,
      group: group || null,
      found: !!group,
      fromCache: result.fromCache
    };
    
  } catch (error) {
    logger.error({ error, groupName, company }, 'Failed to get group by name');
    throw error;
  }
}

/**
 * Export groups data to JSON file
 */
async function exportGroupsData({ company = '', outputDir = './exports', bypassCache = false } = {}) {
  try {
    logger.info({ company, outputDir }, 'Starting groups data export');
    
    // Get groups data
    const groupsData = await getGroups({ company, bypassCache });
    
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `groups-data-${timestamp}.json`;
    const filepath = path.join(outputDir, filename);
    
    // Write to file
    await fs.writeFile(filepath, JSON.stringify(groupsData, null, 2));
    
    logger.info({ filepath, total: groupsData.metadata.totalGroups }, 'Groups data exported successfully');
    
    return {
      success: true,
      filepath: filepath,
      filename: filename,
      total: groupsData.metadata.totalGroups,
      company: company || 'Default',
      summary: groupsData.summary
    };
    
  } catch (error) {
    logger.error({ error, company, outputDir }, 'Failed to export groups data');
    throw error;
  }
}

/**
 * Build hierarchy tree from groups
 */
function buildHierarchyTree(groups) {
  const groupMap = new Map();
  const rootGroups = [];
  
  // Create map of all groups
  groups.forEach(group => {
    groupMap.set(group.name, {
      ...group,
      children: []
    });
  });
  
  // Build hierarchy
  groups.forEach(group => {
    const groupNode = groupMap.get(group.name);
    
    if (!group.parent || group.parent === '') {
      rootGroups.push(groupNode);
    } else {
      const parent = groupMap.get(group.parent);
      if (parent) {
        parent.children.push(groupNode);
      } else {
        // Parent not found, treat as root
        rootGroups.push(groupNode);
      }
    }
  });
  
  return rootGroups;
}

/**
 * Get groups hierarchy
 */
async function getGroupsHierarchy({ company = '', bypassCache = false } = {}) {
  try {
    logger.info({ company }, 'Fetching groups hierarchy');
    
    // Get all groups
    const result = await getGroups({ company, bypassCache });
    
    // Build hierarchy tree
    const hierarchy = buildHierarchyTree(result.groups);
    
    return {
      success: true,
      hierarchy: hierarchy,
      totalGroups: result.groups.length,
      maxDepth: result.summary.hierarchy.maxDepth,
      topLevelGroups: result.summary.hierarchy.topLevelGroups,
      fromCache: result.fromCache
    };
    
  } catch (error) {
    logger.error({ error, company }, 'Failed to get groups hierarchy');
    throw error;
  }
}

/**
 * Invalidate groups cache
 */
async function invalidateGroupsCache(company = '') {
  const pattern = `${CACHE_PREFIX}:${company || '*'}*`;
  const deleted = await cacheManager.deletePattern(pattern);
  logger.info({ pattern, deleted }, 'Groups cache invalidated');
}

// Export all functions
module.exports = {
  getGroups,
  getGroupsByParent,
  searchGroups,
  getGroupByName,
  exportGroupsData,
  getGroupsHierarchy,
  invalidateGroupsCache,
  buildHierarchyTree,
  generateGroupsSummary,
  categorizeBehaviour,
  calculateGroupDepth
};
