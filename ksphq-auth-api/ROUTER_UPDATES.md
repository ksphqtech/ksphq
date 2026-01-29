# Router Updates for Enterprise User Management

## Required Changes to `src/index.js`

### 1. Add Imports (after existing imports)

```javascript
// Add these imports after line 6
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
```

### 2. Add Helper Function for Path Matching

Add this function before the `export default`:

```javascript
/**
 * Extract ID from pathname like /api/users/123abc
 */
function extractId(pathname, prefix) {
  if (pathname.startsWith(prefix)) {
    const parts = pathname.substring(prefix.length).split('/');
    return parts[0] || null;
  }
  return null;
}
```

### 3. Add New Routes (inside try block, before "Health check" section at line 51)

Replace the section from line 50 to the health check with:

```javascript
      }
      // ============================================================================
      // USER MANAGEMENT ROUTES
      // ============================================================================
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
      else if (pathname.startsWith('/api/users/') && pathname.endsWith('/reactivate') && method === 'POST') {
        const user = await requireAuth(request, env);
        const userId = extractId(pathname, '/api/users/').replace('/reactivate', '');
        response = await asyncHandler(handleReactivateUser)(request, env, null, user, userId);
      }
      else if (pathname.startsWith('/api/users/') && pathname.endsWith('/reset-password') && method === 'POST') {
        const user = await requireAuth(request, env);
        const userId = extractId(pathname, '/api/users/').replace('/reset-password', '');
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

      // ============================================================================
      // ROLE MANAGEMENT ROUTES
      // ============================================================================
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

      // ============================================================================
      // ORGANIZATIONAL UNIT ROUTES
      // ============================================================================
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
```

## Complete Updated File Structure

Here's what the route section should look like:

```
Lines 1-25: Imports and setup (existing + new imports)
Lines 26-33: Public routes (signup, login, refresh)
Lines 34-50: Auth routes (logout, user profile, password, activity)
Lines 51-XXX: NEW - User management routes
Lines XXX+1-XXX+20: NEW - Role management routes
Lines XXX+21-XXX+35: NEW - Org unit routes
Lines XXX+36: Health check
Lines XXX+37: 404 handler
```

## Enhanced requireAuth with Role Data

The `requireAuth` middleware needs to be enhanced to include role data. Update `src/middleware/auth.js`:

```javascript
// In the requireAuth function, after getting the user, add this:

// Fetch user with role data
const userWithRole = await env.DB.prepare(`
  SELECT
    u.*,
    r.level as role_level,
    r.permissions as role_permissions
  FROM users u
  LEFT JOIN roles r ON u.role_id = r.id
  WHERE u.id = ?
`).bind(user.sub).first();

if (!userWithRole) {
  throw new AppError('User not found', 401);
}

// Parse permissions if JSON string
if (userWithRole.role_permissions && typeof userWithRole.role_permissions === 'string') {
  userWithRole.role_permissions = JSON.parse(userWithRole.role_permissions);
}

return userWithRole; // Instead of just user.sub or basic user data
```

## Testing the Routes

After updating the router, test with curl:

```bash
# Test role listing
curl http://localhost:8787/api/roles \
  -H "Cookie: access_token=YOUR_TOKEN"

# Test user creation
curl -X POST http://localhost:8787/api/users \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "role_id": "ROLE_ID",
    "password_option": "auto"
  }'

# Test user listing
curl http://localhost:8787/api/users \
  -H "Cookie: access_token=YOUR_TOKEN"

# Test org units
curl http://localhost:8787/api/org-units?type=branch \
  -H "Cookie: access_token=YOUR_TOKEN"
```

## Route Priority

Important: Route order matters! More specific routes must come before generic ones:

1. ✅ `/api/users/deleted` (specific)
2. ✅ `/api/users/bulk-deactivate` (specific)
3. ✅ `/api/users/:id/reactivate` (specific with suffix)
4. ✅ `/api/users/:id/reset-password` (specific with suffix)
5. ✅ `/api/users/:id` (generic with ID)

This ordering ensures that `/api/users/deleted` doesn't get matched as a user ID.

## Debugging Tips

If routes aren't working:

1. Check the console for errors
2. Verify imports are correct
3. Test with the health endpoint first: `curl http://localhost:8787/health`
4. Check that auth middleware is working: `curl http://localhost:8787/auth/user -H "Cookie: access_token=..."`
5. Use console.log to debug route matching:

```javascript
console.log('Route:', method, pathname);
```

## Expected Response Formats

All endpoints return JSON in this format:

**Success:**
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "details": {} // Optional, only in development
  }
}
```
