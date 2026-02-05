import { handleOptions, addCorsHeaders } from './middleware/cors.js';
import { handleError, asyncHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';
import { addSecurityHeaders } from './middleware/security.js';
import { signup, login, logout, refresh, trackActivity } from './handlers/auth.js';
import { getCurrentUser, updateUserProfile, changePassword } from './handlers/user.js';
import {
  handleCreateUser,
  handleListUsers,
  handleGetUser,
  handleUpdateUser,
  handleDeleteUser,
  handleReactivateUser,
  handleResetPassword,
  handleGetDeletedUsers,
  handleBulkDeactivate,
} from './handlers/users.js';
import {
  handleListRoles,
  handleGetRole,
  handleCreateRole,
  handleUpdateRole,
  handleDeleteRole,
} from './handlers/roles.js';
import {
  handleListOrgUnits,
  handleGetOrgUnit,
  handleCreateOrgUnit,
  handleUpdateOrgUnit,
  handleDeleteOrgUnit,
} from './handlers/orgUnits.js';
import {
  getUserBranches,
  selectBranch,
  getActiveBranch,
} from './handlers/branches.js';
import {
  assignUserBranches,
  getBranchUsers,
  getUserBranchAssignments,
} from './handlers/userBranches.js';
import {
  handleListBranchLocations,
  handleGetLocation,
  handleCreateBranchLocation,
  handleUpdateLocation,
  handleDeleteLocation,
  handleSetPrimaryLocation,
} from './handlers/branchLocations.js';
import {
  handleListProjects,
  handleCreateProject,
  handleGetProject,
  handleUpdateProject,
  handleDeleteProject,
  handleListProjectMembers,
  handleAddProjectMember,
  handleRemoveProjectMember,
} from './handlers/projects.js';
import {
  handleListTasks,
  handleCreateTask,
  handleUpdateTask,
  handleDeleteTask,
  handleListDependencies,
  handleAddDependency,
  handleRemoveDependency,
} from './handlers/tasks.js';
import {
  handleListMaterials,
  handleGetMaterial,
  handleCreateMaterial,
  handleUpdateMaterial,
  handleDeleteMaterial,
} from './handlers/materials.js';
import {
  handleGetProjectAnalytics,
} from './handlers/projectAnalytics.js';

/**
 * Extract ID from pathname like /api/users/123abc
 */
function extractId(pathname, prefix) {
  if (pathname.startsWith(prefix)) {
    const remainder = pathname.substring(prefix.length);
    // Remove any suffix like /reactivate or /reset-password
    const parts = remainder.split('/');
    return parts[0] || null;
  }
  return null;
}

/**
 * Main request router for KSPHQ Authentication API
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    try {
      // Handle CORS preflight
      if (method === 'OPTIONS') {
        return handleOptions(env);
      }

      // Route handlers
      let response;

      // Public routes (no auth required)
      if (pathname === '/auth/signup' && method === 'POST') {
        response = await asyncHandler(signup)(request, env);
      } else if (pathname === '/auth/login' && method === 'POST') {
        response = await asyncHandler(login)(request, env);
      } else if (pathname === '/auth/refresh' && method === 'POST') {
        response = await asyncHandler(refresh)(request, env);
      }
      // Protected routes (auth required)
      else if (pathname === '/auth/logout' && method === 'POST') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(logout)(request, env, user);
      } else if (pathname === '/auth/user' && method === 'GET') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(getCurrentUser)(request, env, user);
      } else if (pathname === '/auth/user' && method === 'PATCH') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(updateUserProfile)(request, env, user);
      } else if (pathname === '/auth/user/password' && method === 'PATCH') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(changePassword)(request, env, user);
      } else if (pathname === '/auth/activity' && method === 'POST') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(trackActivity)(request, env, user);
      }
      // User Management Routes
      else if (pathname === '/api/users' && method === 'POST') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(handleCreateUser)(request, env, null, user);
      }
      else if (pathname === '/api/users' && method === 'GET') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(handleListUsers)(request, env, null, user);
      }
      else if (pathname === '/api/users/deleted' && method === 'GET') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(handleGetDeletedUsers)(request, env, null, user);
      }
      else if (pathname === '/api/users/bulk-deactivate' && method === 'POST') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(handleBulkDeactivate)(request, env, null, user);
      }
      else if (pathname.startsWith('/api/users/') && pathname.includes('/reactivate') && method === 'POST') {
        const user = await requireAuth(request, env);
        const userId = pathname.split('/')[3];
        response = await asyncHandler(handleReactivateUser)(request, env, null, user, userId);
      }
      else if (pathname.startsWith('/api/users/') && pathname.includes('/reset-password') && method === 'POST') {
        const user = await requireAuth(request, env);
        const userId = pathname.split('/')[3];
        response = await asyncHandler(handleResetPassword)(request, env, null, user, userId);
      }
      else if (pathname.startsWith('/api/users/') && method === 'GET') {
        const user = await requireAuth(request, env);
        const userId = extractId(pathname, '/api/users/');
        response = await asyncHandler(handleGetUser)(request, env, null, user, userId);
      }
      else if (pathname.startsWith('/api/users/') && method === 'PATCH') {
        const user = await requireAuth(request, env);
        const userId = extractId(pathname, '/api/users/');
        response = await asyncHandler(handleUpdateUser)(request, env, null, user, userId);
      }
      else if (pathname.startsWith('/api/users/') && method === 'DELETE') {
        const user = await requireAuth(request, env);
        const userId = extractId(pathname, '/api/users/');
        response = await asyncHandler(handleDeleteUser)(request, env, null, user, userId);
      }
      // Role Management Routes
      else if (pathname === '/api/roles' && method === 'GET') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(handleListRoles)(request, env, null, user);
      }
      else if (pathname === '/api/roles' && method === 'POST') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(handleCreateRole)(request, env, null, user);
      }
      else if (pathname.startsWith('/api/roles/') && method === 'GET') {
        const user = await requireAuth(request, env);
        const roleId = extractId(pathname, '/api/roles/');
        response = await asyncHandler(handleGetRole)(request, env, null, user, roleId);
      }
      else if (pathname.startsWith('/api/roles/') && method === 'PATCH') {
        const user = await requireAuth(request, env);
        const roleId = extractId(pathname, '/api/roles/');
        response = await asyncHandler(handleUpdateRole)(request, env, null, user, roleId);
      }
      else if (pathname.startsWith('/api/roles/') && method === 'DELETE') {
        const user = await requireAuth(request, env);
        const roleId = extractId(pathname, '/api/roles/');
        response = await asyncHandler(handleDeleteRole)(request, env, null, user, roleId);
      }
      // Organizational Unit Routes
      else if (pathname === '/api/org-units' && method === 'GET') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(handleListOrgUnits)(request, env, null, user);
      }
      else if (pathname === '/api/org-units' && method === 'POST') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(handleCreateOrgUnit)(request, env, null, user);
      }
      else if (pathname.startsWith('/api/org-units/') && method === 'GET') {
        const user = await requireAuth(request, env);
        const unitId = extractId(pathname, '/api/org-units/');
        response = await asyncHandler(handleGetOrgUnit)(request, env, null, user, unitId);
      }
      else if (pathname.startsWith('/api/org-units/') && method === 'PATCH') {
        const user = await requireAuth(request, env);
        const unitId = extractId(pathname, '/api/org-units/');
        response = await asyncHandler(handleUpdateOrgUnit)(request, env, null, user, unitId);
      }
      else if (pathname.startsWith('/api/org-units/') && method === 'DELETE') {
        const user = await requireAuth(request, env);
        const unitId = extractId(pathname, '/api/org-units/');
        response = await asyncHandler(handleDeleteOrgUnit)(request, env, null, user, unitId);
      }
      // Branch Location Routes
      else if (pathname.match(/^\/api\/branches\/[^/]+\/locations$/) && method === 'GET') {
        const user = await requireAuth(request, env);
        const branchId = pathname.split('/')[3];
        response = await asyncHandler(handleListBranchLocations)(request, env, null, user, branchId);
      }
      else if (pathname.match(/^\/api\/branches\/[^/]+\/locations$/) && method === 'POST') {
        const user = await requireAuth(request, env);
        const branchId = pathname.split('/')[3];
        response = await asyncHandler(handleCreateBranchLocation)(request, env, null, user, branchId);
      }
      else if (pathname.match(/^\/api\/locations\/[^/]+\/set-primary$/) && method === 'POST') {
        const user = await requireAuth(request, env);
        const locationId = pathname.split('/')[3];
        response = await asyncHandler(handleSetPrimaryLocation)(request, env, null, user, locationId);
      }
      else if (pathname.startsWith('/api/locations/') && method === 'GET') {
        const user = await requireAuth(request, env);
        const locationId = extractId(pathname, '/api/locations/');
        response = await asyncHandler(handleGetLocation)(request, env, null, user, locationId);
      }
      else if (pathname.startsWith('/api/locations/') && method === 'PATCH') {
        const user = await requireAuth(request, env);
        const locationId = extractId(pathname, '/api/locations/');
        response = await asyncHandler(handleUpdateLocation)(request, env, null, user, locationId);
      }
      else if (pathname.startsWith('/api/locations/') && method === 'DELETE') {
        const user = await requireAuth(request, env);
        const locationId = extractId(pathname, '/api/locations/');
        response = await asyncHandler(handleDeleteLocation)(request, env, null, user, locationId);
      }
      // Branch Management Routes
      else if (pathname === '/api/user/branches' && method === 'GET') {
        const user = await requireAuth(request, env);
        request.user = user;
        response = await asyncHandler(getUserBranches)(request, env, null);
      }
      else if (pathname === '/api/user/branches/select' && method === 'POST') {
        const user = await requireAuth(request, env);
        request.user = user;
        response = await asyncHandler(selectBranch)(request, env, null);
      }
      else if (pathname === '/api/user/active-branch' && method === 'GET') {
        const user = await requireAuth(request, env);
        request.user = user;
        response = await asyncHandler(getActiveBranch)(request, env, null);
      }
      else if (pathname.startsWith('/api/users/') && pathname.includes('/branches') && method === 'POST') {
        const user = await requireAuth(request, env);
        const userId = pathname.split('/')[3];
        request.user = user;
        request.params = { userId };
        response = await asyncHandler(assignUserBranches)(request, env, null);
      }
      else if (pathname.startsWith('/api/users/') && pathname.includes('/branches') && method === 'GET') {
        const user = await requireAuth(request, env);
        const userId = pathname.split('/')[3];
        request.user = user;
        request.params = { userId };
        response = await asyncHandler(getUserBranchAssignments)(request, env, null);
      }
      else if (pathname.startsWith('/api/branches/') && pathname.includes('/users') && method === 'GET') {
        const user = await requireAuth(request, env);
        const branchId = pathname.split('/')[3];
        request.user = user;
        request.params = { branchId };
        response = await asyncHandler(getBranchUsers)(request, env, null);
      }
      // Project Control Routes - Projects
      else if (pathname === '/api/projects' && method === 'GET') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(handleListProjects)(request, env, null, user);
      }
      else if (pathname === '/api/projects' && method === 'POST') {
        const user = await requireAuth(request, env);
        response = await asyncHandler(handleCreateProject)(request, env, null, user);
      }
      else if (pathname.match(/^\/api\/projects\/[^/]+\/tasks$/) && method === 'GET') {
        const user = await requireAuth(request, env);
        const projectId = pathname.split('/')[3];
        response = await asyncHandler(handleListTasks)(request, env, null, user, projectId);
      }
      else if (pathname.match(/^\/api\/projects\/[^/]+\/tasks$/) && method === 'POST') {
        const user = await requireAuth(request, env);
        const projectId = pathname.split('/')[3];
        response = await asyncHandler(handleCreateTask)(request, env, null, user, projectId);
      }
      else if (pathname.match(/^\/api\/projects\/[^/]+\/members$/) && method === 'GET') {
        const user = await requireAuth(request, env);
        const projectId = pathname.split('/')[3];
        response = await asyncHandler(handleListProjectMembers)(request, env, null, user, projectId);
      }
      else if (pathname.match(/^\/api\/projects\/[^/]+\/members$/) && method === 'POST') {
        const user = await requireAuth(request, env);
        const projectId = pathname.split('/')[3];
        response = await asyncHandler(handleAddProjectMember)(request, env, null, user, projectId);
      }
      else if (pathname.match(/^\/api\/projects\/[^/]+\/members\/[^/]+$/) && method === 'DELETE') {
        const user = await requireAuth(request, env);
        const parts = pathname.split('/');
        const projectId = parts[3];
        const userId = parts[5];
        response = await asyncHandler(handleRemoveProjectMember)(request, env, null, user, projectId, userId);
      }
      // Project Analytics Route
      else if (pathname.match(/^\/api\/projects\/[^/]+\/analytics$/) && method === 'GET') {
        const user = await requireAuth(request, env);
        const projectId = pathname.split('/')[3];
        response = await asyncHandler(handleGetProjectAnalytics)(request, env, null, user, projectId);
      }
      // Project Control Routes - Materials
      else if (pathname.match(/^\/api\/projects\/[^/]+\/materials$/) && method === 'GET') {
        const user = await requireAuth(request, env);
        const projectId = pathname.split('/')[3];
        response = await asyncHandler(handleListMaterials)(request, env, null, user, projectId);
      }
      else if (pathname.match(/^\/api\/projects\/[^/]+\/materials$/) && method === 'POST') {
        const user = await requireAuth(request, env);
        const projectId = pathname.split('/')[3];
        response = await asyncHandler(handleCreateMaterial)(request, env, null, user, projectId);
      }
      else if (pathname.startsWith('/api/projects/') && method === 'GET') {
        const user = await requireAuth(request, env);
        const projectId = extractId(pathname, '/api/projects/');
        response = await asyncHandler(handleGetProject)(request, env, null, user, projectId);
      }
      else if (pathname.startsWith('/api/projects/') && method === 'PATCH') {
        const user = await requireAuth(request, env);
        const projectId = extractId(pathname, '/api/projects/');
        response = await asyncHandler(handleUpdateProject)(request, env, null, user, projectId);
      }
      else if (pathname.startsWith('/api/projects/') && method === 'DELETE') {
        const user = await requireAuth(request, env);
        const projectId = extractId(pathname, '/api/projects/');
        response = await asyncHandler(handleDeleteProject)(request, env, null, user, projectId);
      }
      // Project Control Routes - Tasks
      else if (pathname.match(/^\/api\/tasks\/[^/]+\/dependencies$/) && method === 'GET') {
        const user = await requireAuth(request, env);
        const taskId = pathname.split('/')[3];
        response = await asyncHandler(handleListDependencies)(request, env, null, user, taskId);
      }
      else if (pathname.match(/^\/api\/tasks\/[^/]+\/dependencies$/) && method === 'POST') {
        const user = await requireAuth(request, env);
        const taskId = pathname.split('/')[3];
        response = await asyncHandler(handleAddDependency)(request, env, null, user, taskId);
      }
      else if (pathname.match(/^\/api\/tasks\/[^/]+\/dependencies\/[^/]+$/) && method === 'DELETE') {
        const user = await requireAuth(request, env);
        const parts = pathname.split('/');
        const taskId = parts[3];
        const depId = parts[5];
        response = await asyncHandler(handleRemoveDependency)(request, env, null, user, taskId, depId);
      }
      else if (pathname.startsWith('/api/tasks/') && method === 'PATCH') {
        const user = await requireAuth(request, env);
        const taskId = extractId(pathname, '/api/tasks/');
        response = await asyncHandler(handleUpdateTask)(request, env, null, user, taskId);
      }
      else if (pathname.startsWith('/api/tasks/') && method === 'DELETE') {
        const user = await requireAuth(request, env);
        const taskId = extractId(pathname, '/api/tasks/');
        response = await asyncHandler(handleDeleteTask)(request, env, null, user, taskId);
      }
      // Material Routes (individual material operations)
      else if (pathname.startsWith('/api/materials/') && method === 'GET') {
        const user = await requireAuth(request, env);
        const materialId = extractId(pathname, '/api/materials/');
        response = await asyncHandler(handleGetMaterial)(request, env, null, user, materialId);
      }
      else if (pathname.startsWith('/api/materials/') && method === 'PATCH') {
        const user = await requireAuth(request, env);
        const materialId = extractId(pathname, '/api/materials/');
        response = await asyncHandler(handleUpdateMaterial)(request, env, null, user, materialId);
      }
      else if (pathname.startsWith('/api/materials/') && method === 'DELETE') {
        const user = await requireAuth(request, env);
        const materialId = extractId(pathname, '/api/materials/');
        response = await asyncHandler(handleDeleteMaterial)(request, env, null, user, materialId);
      }
      // Health check
      else if (pathname === '/health' && method === 'GET') {
        response = new Response(JSON.stringify({ status: 'ok' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // 404 Not Found
      else {
        response = new Response(
          JSON.stringify({
            success: false,
            error: { message: 'Not Found' },
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Add CORS headers and security headers to all responses
      let finalResponse = addCorsHeaders(response, env);
      finalResponse = addSecurityHeaders(finalResponse, env);
      return finalResponse;
    } catch (error) {
      const errorResponse = handleError(error, env);
      let finalResponse = addCorsHeaders(errorResponse, env);
      finalResponse = addSecurityHeaders(finalResponse, env);
      return finalResponse;
    }
  },

  async scheduled(event, env, ctx) {
    // Daily cleanup of expired tokens and rate limits
    const { cleanupRevokedAccessTokens } = await import('./db/queries.js');

    try {
      await cleanupRevokedAccessTokens(env.DB);

      // Also cleanup expired rate limits
      await env.DB.prepare(
        `DELETE FROM rate_limits WHERE reset_time < datetime('now')`
      ).run();

      console.log('Scheduled cleanup completed');
    } catch (error) {
      console.error('Scheduled cleanup failed:', error);
    }
  }
};
