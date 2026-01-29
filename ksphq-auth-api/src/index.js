import { handleOptions, addCorsHeaders } from './middleware/cors.js';
import { handleError, asyncHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';
import { addSecurityHeaders } from './middleware/security.js';
import { signup, login, logout, refresh, trackActivity } from './handlers/auth.js';
import { getCurrentUser, updateUserProfile, changePassword } from './handlers/user.js';

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
