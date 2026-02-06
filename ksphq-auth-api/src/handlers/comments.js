/**
 * Project Control - API Handlers for Task Comments
 * Request handlers for comment CRUD operations
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { AppError } from '../utils/errors.js';
import {
  listComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
} from '../db/commentQueries.js';

/**
 * List comments for a task
 * GET /api/tasks/:taskId/comments
 */
export async function handleListComments(request, env, ctx, currentUser, taskId) {
  try {
    const comments = await listComments(env.DB, taskId);
    return successResponse({ comments });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('List comments error:', error);
    return errorResponse('Failed to list comments', 500, null, env);
  }
}

/**
 * Create a new comment
 * POST /api/tasks/:taskId/comments
 */
export async function handleCreateComment(request, env, ctx, currentUser, taskId) {
  try {
    const body = await request.json();

    if (!body.comment) {
      return errorResponse('Missing required field: comment', 400, null, env);
    }

    const comment = await createComment(env.DB, taskId, body, currentUser.id);

    return successResponse(
      {
        comment,
        message: 'Comment added successfully',
      },
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Create comment error:', error);
    return errorResponse('Failed to create comment', 500, null, env);
  }
}

/**
 * Update a comment
 * PATCH /api/comments/:commentId
 */
export async function handleUpdateComment(request, env, ctx, currentUser, commentId) {
  try {
    const body = await request.json();

    if (!body.comment) {
      return errorResponse('Missing required field: comment', 400, null, env);
    }

    const updated = await updateComment(env.DB, commentId, body, currentUser.id);

    return successResponse({
      comment: updated,
      message: 'Comment updated successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Update comment error:', error);
    return errorResponse('Failed to update comment', 500, null, env);
  }
}

/**
 * Delete a comment
 * DELETE /api/comments/:commentId
 */
export async function handleDeleteComment(request, env, ctx, currentUser, commentId) {
  try {
    await deleteComment(env.DB, commentId, currentUser.id);

    return successResponse({
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.details, env);
    }
    console.error('Delete comment error:', error);
    return errorResponse('Failed to delete comment', 500, null, env);
  }
}
