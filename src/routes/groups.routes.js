/**
 * src/routes/groups.routes.js
 * 
 * Fastify plugin for groups routes
 */

'use strict';

const groupsService = require('../services/groups.service');
const { companySchema, commonQuerySchema } = require('../validators');

/**
 * Groups routes plugin for Fastify
 * @param {FastifyInstance} server 
 * @param {object} options 
 */
async function groupsRoutes(server, options) {
  
  // GET /api/v1/groups - Get all groups with search/filter options
  server.get('/groups', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          company: companySchema,
          parent: {
            type: 'string',
            maxLength: 255
          },
          search: {
            type: 'string',
            minLength: 1,
            maxLength: 255
          },
          bypassCache: { type: 'boolean', default: false }
        },
        additionalProperties: false
      }
    }
  }, async (request, reply) => {
    try {
      const { company, parent, search, bypassCache } = request.query;
      
      console.log('🔍 DEBUG - Enhanced groups route called with params:', { company, parent, search, bypassCache });
      
      let result;
      
      if (search) {
        // Search functionality
        result = await groupsService.searchGroups(search, { company, bypassCache });
        console.log(`🔍 Found ${result.total} groups matching "${search}"`);
      } else if (parent) {
        // Get groups by parent
        result = await groupsService.getGroupsByParent(parent, { company, bypassCache });
        console.log(`🔍 Found ${result.total} groups under parent "${parent}"`);
      } else {
        // Get all groups
        result = await groupsService.getGroups({ company, bypassCache });
        console.log(`🔍 Found ${result.metadata.totalGroups} total groups`);
      }

      return {
        success: true,
        data: result.groups || result.group || [],
        meta: {
          ...result.metadata,
          total: result.total || result.metadata?.totalGroups || 0,
          fromCache: result.fromCache || false,
          fetchedAt: new Date().toISOString(),
          endpoint: '/api/v1/groups'
        }
      };
      
    } catch (error) {
      console.error('❌ Error in enhanced groups route:', error.message);
      
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch groups',
        message: error.message,
        meta: {
          fetchedAt: new Date().toISOString(),
          endpoint: '/api/v1/groups'
        }
      });
    }
  });

  // GET /api/v1/groups/hierarchy - Get groups hierarchy
  server.get('/groups/hierarchy', {
    schema: {
      querystring: commonQuerySchema
    }
  }, async (request, reply) => {
    try {
      const { company, bypassCache } = request.query;
      
      console.log('🔍 DEBUG - Groups hierarchy route called with params:', { company, bypassCache });
      
      const result = await groupsService.getGroupsHierarchy({ company, bypassCache });
      
      return {
        success: true,
        data: result.hierarchy,
        meta: {
          totalGroups: result.totalGroups,
          maxDepth: result.maxDepth,
          topLevelGroups: result.topLevelGroups,
          fromCache: result.fromCache,
          fetchedAt: new Date().toISOString(),
          endpoint: '/api/v1/groups/hierarchy'
        }
      };
      
    } catch (error) {
      console.error('❌ Error in groups hierarchy route:', error.message);
      
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch groups hierarchy',
        message: error.message,
        meta: {
          fetchedAt: new Date().toISOString(),
          endpoint: '/api/v1/groups/hierarchy'
        }
      });
    }
  });

  // GET /api/v1/groups/:groupName - Get single group
  server.get('/groups/:groupName', {
    schema: {
      params: {
        type: 'object',
        properties: {
          groupName: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            pattern: '^[\\w\\s\\-&()]+$'
          }
        },
        required: ['groupName']
      },
      querystring: commonQuerySchema
    }
  }, async (request, reply) => {
    try {
      const { groupName } = request.params;
      const { company, bypassCache } = request.query;
      
      console.log('🔍 DEBUG - Single group route called with params:', { groupName, company, bypassCache });
      
      const result = await groupsService.getGroupByName(groupName, { company, bypassCache });
      
      if (!result.found) {
        reply.code(404).send({
          success: false,
          error: 'Group not found',
          message: `Group "${groupName}" not found`,
          meta: {
            fetchedAt: new Date().toISOString(),
            endpoint: `/api/v1/groups/${groupName}`
          }
        });
        return;
      }
      
      return {
        success: true,
        data: result.group,
        meta: {
          fromCache: result.fromCache,
          fetchedAt: new Date().toISOString(),
          endpoint: `/api/v1/groups/${groupName}`
        }
      };
      
    } catch (error) {
      console.error('❌ Error in single group route:', error.message);
      
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch group',
        message: error.message,
        meta: {
          fetchedAt: new Date().toISOString(),
          endpoint: `/api/v1/groups/${request.params.groupName}`
        }
      });
    }
  });

  // POST /api/v1/groups/export - Export groups data
  server.post('/groups/export', async (request, reply) => {
    try {
      const { company, outputDir, bypassCache } = request.body;
      
      console.log('🔍 DEBUG - Export groups route called with params:', { company, outputDir, bypassCache });
      
      const result = await groupsService.exportGroupsData({ company, outputDir, bypassCache });
      
      return {
        success: true,
        data: {
          filepath: result.filepath,
          filename: result.filename,
          total: result.total,
          company: result.company
        },
        meta: {
          fetchedAt: new Date().toISOString(),
          endpoint: '/api/v1/groups/export'
        }
      };
      
    } catch (error) {
      console.error('❌ Error in export groups route:', error.message);
      
      reply.code(500).send({
        success: false,
        error: 'Failed to export groups',
        message: error.message,
        meta: {
          fetchedAt: new Date().toISOString(),
          endpoint: '/api/v1/groups/export'
        }
      });
    }
  });

  // DELETE /api/v1/groups/cache - Clear groups cache
  server.delete('/groups/cache', async (request, reply) => {
    try {
      const { company } = request.query;
      
      console.log('🔍 DEBUG - Clear groups cache route called with params:', { company });
      
      await groupsService.invalidateGroupsCache(company);
      
      return {
        success: true,
        message: 'Groups cache cleared successfully',
        meta: {
          company: company || 'all',
          fetchedAt: new Date().toISOString(),
          endpoint: '/api/v1/groups/cache'
        }
      };
      
    } catch (error) {
      console.error('❌ Error in clear groups cache route:', error.message);
      
      reply.code(500).send({
        success: false,
        error: 'Failed to clear groups cache',
        message: error.message,
        meta: {
          fetchedAt: new Date().toISOString(),
          endpoint: '/api/v1/groups/cache'
        }
      });
    }
  });
}

module.exports = groupsRoutes;
