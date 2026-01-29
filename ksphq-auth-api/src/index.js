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
