import { successResponse, errorResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get current session for a user
 */
async function getCurrentSession(db, userId) {
  return await db.prepare(`
    SELECT id, active_branch_id
    FROM user_sessions
    WHERE user_id = ? AND expires_at > datetime('now')
    ORDER BY last_activity_at DESC
    LIMIT 1
  `).bind(userId).first();
}

/**
 * GET /api/user/branches
 * Get user's accessible branches
 */
export async function getUserBranches(request, env, ctx) {
  const user = request.user;
  const db = env.DB;

  // Admins see all branches
  if (user.role_level >= 100) {
    const result = await db.prepare(`
      SELECT id, name, code, is_active
      FROM organizational_units
      WHERE type = 'branch' AND is_active = 1
      ORDER BY name ASC
    `).all();

    return successResponse({ branches: result.results });
  }

  // Others see only assigned branches
  const result = await db.prepare(`
    SELECT ou.id, ou.name, ou.code, ou.is_active, ub.is_primary
    FROM organizational_units ou
    JOIN user_branches ub ON ou.id = ub.branch_id
    WHERE ub.user_id = ? AND ou.type = 'branch' AND ou.is_active = 1
    ORDER BY ub.is_primary DESC, ou.name ASC
  `).bind(user.id).all();

  return successResponse({ branches: result.results });
}

/**
 * POST /api/user/branches/select
 * Set active branch for current session
 */
export async function selectBranch(request, env, ctx) {
  const user = request.user;
  const db = env.DB;

  const body = await request.json();
  const { branch_id } = body;

  if (!branch_id) {
    throw new AppError('Branch ID is required', 400);
  }

  // Validate access (admins can access any branch)
  if (user.role_level < 100) {
    const access = await db.prepare(
      'SELECT 1 FROM user_branches WHERE user_id = ? AND branch_id = ?'
    ).bind(user.id, branch_id).first();

    if (!access) {
      throw new AppError('No access to this branch', 403);
    }
  }

  // Update session
  const session = await getCurrentSession(db, user.id);
  if (session) {
    await db.prepare(
      'UPDATE user_sessions SET active_branch_id = ? WHERE id = ?'
    ).bind(branch_id, session.id).run();
  }

  return successResponse({
    success: true,
    active_branch_id: branch_id
  });
}

/**
 * GET /api/user/active-branch
 * Get currently selected branch for active session
 */
export async function getActiveBranch(request, env, ctx) {
  const user = request.user;
  const db = env.DB;

  const session = await getCurrentSession(db, user.id);

  if (!session?.active_branch_id) {
    return successResponse({ branch: null });
  }

  const branch = await db.prepare(
    'SELECT id, name, code FROM organizational_units WHERE id = ?'
  ).bind(session.active_branch_id).first();

  return successResponse({ branch });
}
