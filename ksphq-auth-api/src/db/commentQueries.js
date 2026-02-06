/**
 * Project Control - Database Query Functions for Task Comments
 * CRUD operations for comments and replies
 */

import { AppError, NotFoundError } from '../utils/errors.js';
import { createAuditLog } from './auditLogs.js';

/**
 * List comments for a task
 * @param {object} db - Database connection
 * @param {string} taskId - Task ID
 * @returns {Array} List of comments
 */
export async function listComments(db, taskId) {
  const query = `
    SELECT
      tc.id,
      tc.comment,
      tc.parent_comment_id,
      tc.created_at,
      tc.updated_at,
      u.first_name || ' ' || u.last_name as user_name,
      u.email as user_email
    FROM task_comments tc
    LEFT JOIN users u ON tc.created_by = u.id
    WHERE tc.task_id = ? AND tc.is_deleted = 0
    ORDER BY tc.created_at ASC
  `;

  const result = await db.prepare(query).bind(taskId).all();
  return result.results || [];
}

/**
 * Get comment by ID
 * @param {object} db - Database connection
 * @param {string} commentId - Comment ID
 * @returns {object} Comment object
 */
export async function getCommentById(db, commentId) {
  const query = `
    SELECT
      tc.*,
      u.first_name || ' ' || u.last_name as user_name,
      u.email as user_email
    FROM task_comments tc
    LEFT JOIN users u ON tc.created_by = u.id
    WHERE tc.id = ? AND tc.is_deleted = 0
  `;

  const comment = await db.prepare(query).bind(commentId).first();

  if (!comment) {
    throw new NotFoundError('Comment');
  }

  return comment;
}

/**
 * Create a new comment
 * @param {object} db - Database connection
 * @param {string} taskId - Task ID
 * @param {object} data - Comment data
 * @param {string} userId - User ID creating the comment
 * @returns {object} Created comment
 */
export async function createComment(db, taskId, data, userId) {
  const { comment, parent_comment_id = null } = data;

  if (!comment || !comment.trim()) {
    throw new AppError('Comment text is required', 400);
  }

  // Validate task exists
  const task = await db
    .prepare('SELECT id, title FROM project_tasks WHERE id = ? AND is_active = 1')
    .bind(taskId)
    .first();

  if (!task) {
    throw new NotFoundError('Task');
  }

  // If replying to a comment, validate parent exists
  if (parent_comment_id) {
    const parentComment = await db
      .prepare('SELECT id FROM task_comments WHERE id = ? AND task_id = ? AND is_deleted = 0')
      .bind(parent_comment_id, taskId)
      .first();

    if (!parentComment) {
      throw new NotFoundError('Parent comment');
    }
  }

  // Create comment
  const result = await db
    .prepare(
      `INSERT INTO task_comments (task_id, comment, parent_comment_id, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, comment, parent_comment_id, created_at`
    )
    .bind(taskId, comment.trim(), parent_comment_id, userId, userId)
    .first();

  // Create audit log
  await createAuditLog(db, {
    userId,
    action: 'comment_created',
    details: `Added comment to task ${task.title}`,
    category: 'project_management',
    severity: 'info',
  });

  return result;
}

/**
 * Update a comment
 * @param {object} db - Database connection
 * @param {string} commentId - Comment ID
 * @param {object} updates - Fields to update
 * @param {string} userId - User ID making the update
 * @returns {object} Updated comment
 */
export async function updateComment(db, commentId, updates, userId) {
  // Get existing comment
  const existing = await getCommentById(db, commentId);

  // Only the creator can edit their comment
  if (existing.created_by !== userId) {
    throw new AppError('You can only edit your own comments', 403);
  }

  const { comment } = updates;

  if (!comment || !comment.trim()) {
    throw new AppError('Comment text is required', 400);
  }

  // Update comment
  await db
    .prepare(
      `UPDATE task_comments
       SET comment = ?, updated_at = datetime('now'), updated_by = ?
       WHERE id = ? AND is_deleted = 0`
    )
    .bind(comment.trim(), userId, commentId)
    .run();

  // Create audit log
  await createAuditLog(db, {
    userId,
    action: 'comment_updated',
    details: `Updated comment`,
    category: 'project_management',
    severity: 'info',
  });

  return getCommentById(db, commentId);
}

/**
 * Soft delete a comment
 * @param {object} db - Database connection
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID performing deletion
 */
export async function deleteComment(db, commentId, userId) {
  // Get existing comment
  const existing = await getCommentById(db, commentId);

  // Only the creator can delete their comment
  if (existing.created_by !== userId) {
    throw new AppError('You can only delete your own comments', 403);
  }

  // Soft delete
  await db
    .prepare(
      `UPDATE task_comments
       SET is_deleted = 1, updated_at = datetime('now'), updated_by = ?
       WHERE id = ?`
    )
    .bind(userId, commentId)
    .run();

  // Create audit log
  await createAuditLog(db, {
    userId,
    action: 'comment_deleted',
    details: `Deleted comment`,
    category: 'project_management',
    severity: 'info',
  });
}
