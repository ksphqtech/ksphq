import { successResponse, errorResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * POST /api/users/:userId/branches
 * Assign user to multiple branches
 */
export async function assignUserBranches(request, env, ctx) {
  const user = request.user;
  const db = env.DB;
  const userId = request.params.userId;

  // Validate permission (admin or branch manager)
  if (user.role_level < 80) {
    throw new AppError('Insufficient permissions', 403);
  }

  const body = await request.json();
  const { branch_ids, primary_branch_id } = body;

  if (!branch_ids || !Array.isArray(branch_ids) || branch_ids.length === 0) {
    throw new AppError('At least one branch ID is required', 400);
  }

  if (!primary_branch_id || !branch_ids.includes(primary_branch_id)) {
    throw new AppError('Primary branch must be one of the selected branches', 400);
  }

  try {
    // Delete existing assignments
    await db.prepare('DELETE FROM user_branches WHERE user_id = ?')
      .bind(userId)
      .run();

    // Insert new assignments
    const insertStmt = db.prepare(`
      INSERT INTO user_branches (user_id, branch_id, is_primary, created_by)
      VALUES (?, ?, ?, ?)
    `);

    for (const branchId of branch_ids) {
      await insertStmt.bind(
        userId,
        branchId,
        branchId === primary_branch_id ? 1 : 0,
        user.id
      ).run();
    }

    // Also update the user's primary branch_id field for backward compatibility
    await db.prepare('UPDATE users SET branch_id = ? WHERE id = ?')
      .bind(primary_branch_id, userId)
      .run();

    return successResponse({
      success: true,
      message: 'User branches updated successfully'
    });
  } catch (error) {
    console.error('Error assigning user branches:', error);
    throw new AppError('Failed to assign user branches', 500);
  }
}

/**
 * GET /api/branches/:branchId/users
 * Get all users assigned to a specific branch
 */
export async function getBranchUsers(request, env, ctx) {
  const user = request.user;
  const db = env.DB;
  const branchId = request.params.branchId;

  // Validate permission
  if (user.role_level < 80) {
    throw new AppError('Insufficient permissions', 403);
  }

  try {
    const result = await db.prepare(`
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        ub.is_primary,
        r.name as role_name,
        r.level as role_level
      FROM users u
      JOIN user_branches ub ON u.id = ub.user_id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE ub.branch_id = ? AND u.deleted_at IS NULL
      ORDER BY ub.is_primary DESC, u.last_name, u.first_name
    `).bind(branchId).all();

    return successResponse({ users: result.results });
  } catch (error) {
    console.error('Error fetching branch users:', error);
    throw new AppError('Failed to fetch branch users', 500);
  }
}

/**
 * GET /api/users/:userId/branches
 * Get all branches assigned to a specific user
 */
export async function getUserBranchAssignments(request, env, ctx) {
  const user = request.user;
  const db = env.DB;
  const userId = request.params.userId;

  // Users can view their own assignments, admins/managers can view all
  if (user.id !== userId && user.role_level < 80) {
    throw new AppError('Insufficient permissions', 403);
  }

  try {
    const result = await db.prepare(`
      SELECT
        ou.id,
        ou.name,
        ou.code,
        ub.is_primary,
        ub.created_at
      FROM user_branches ub
      JOIN organizational_units ou ON ub.branch_id = ou.id
      WHERE ub.user_id = ? AND ou.is_active = 1
      ORDER BY ub.is_primary DESC, ou.name ASC
    `).bind(userId).all();

    return successResponse({ branches: result.results });
  } catch (error) {
    console.error('Error fetching user branch assignments:', error);
    throw new AppError('Failed to fetch user branch assignments', 500);
  }
}
