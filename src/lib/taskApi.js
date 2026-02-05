/**
 * Task Management API Client
 * Provides functions for task CRUD operations, dependencies, checklists, and comments
 */

import { get, post, patch, del } from './api.js';

/**
 * Task API functions
 */
export const taskApi = {
  /**
   * List tasks with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {string} params.project_id - Filter by project ID
   * @param {string} params.assigned_to - Filter by assigned user ID
   * @param {string} params.status - Filter by status
   * @param {string} params.priority - Filter by priority
   * @param {string} params.search - Search term
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise<{tasks: Array, pagination: Object}>}
   */
  list: async (params = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const response = await get(`/api/tasks?${query}`);
    return response.data;
  },

  /**
   * Get task by ID
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Task object with dependencies and checklists
   */
  get: async (taskId) => {
    const response = await get(`/api/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @param {string} taskData.project_id - Project ID
   * @param {string} taskData.title - Task title
   * @param {string} taskData.description - Task description
   * @param {string} taskData.assigned_to - Assigned user ID
   * @param {string} taskData.status - Task status
   * @param {string} taskData.priority - Task priority
   * @param {string} taskData.due_date - Due date (ISO format)
   * @returns {Promise<Object>} Created task
   */
  create: async (taskData) => {
    const response = await post('/api/tasks', taskData);
    return response.data;
  },

  /**
   * Update task
   * @param {string} taskId - Task ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated task
   */
  update: async (taskId, updates) => {
    const response = await patch(`/api/tasks/${taskId}`, updates);
    return response.data;
  },

  /**
   * Delete task
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (taskId) => {
    const response = await del(`/api/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Add task dependency
   * @param {string} taskId - Task ID
   * @param {string} dependsOnTaskId - Task ID that this task depends on
   * @returns {Promise<Object>} Success message
   */
  addDependency: async (taskId, dependsOnTaskId) => {
    const response = await post(`/api/tasks/${taskId}/dependencies`, {
      depends_on_task_id: dependsOnTaskId,
    });
    return response.data;
  },

  /**
   * Remove task dependency
   * @param {string} taskId - Task ID
   * @param {string} dependsOnTaskId - Task ID to remove dependency from
   * @returns {Promise<Object>} Success message
   */
  removeDependency: async (taskId, dependsOnTaskId) => {
    const response = await del(`/api/tasks/${taskId}/dependencies/${dependsOnTaskId}`);
    return response.data;
  },

  // Checklist methods
  checklist: {
    /**
     * Create checklist item
     * @param {string} taskId - Task ID
     * @param {Object} itemData - Checklist item data
     * @param {string} itemData.title - Item title
     * @param {number} itemData.order_index - Display order
     * @returns {Promise<Object>} Created checklist item
     */
    create: async (taskId, itemData) => {
      const response = await post(`/api/tasks/${taskId}/checklist`, itemData);
      return response.data;
    },

    /**
     * Update checklist item
     * @param {string} taskId - Task ID
     * @param {string} itemId - Checklist item ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated checklist item
     */
    update: async (taskId, itemId, updates) => {
      const response = await patch(`/api/tasks/${taskId}/checklist/${itemId}`, updates);
      return response.data;
    },

    /**
     * Delete checklist item
     * @param {string} taskId - Task ID
     * @param {string} itemId - Checklist item ID
     * @returns {Promise<Object>} Success message
     */
    delete: async (taskId, itemId) => {
      const response = await del(`/api/tasks/${taskId}/checklist/${itemId}`);
      return response.data;
    },

    /**
     * Toggle checklist item completion
     * @param {string} taskId - Task ID
     * @param {string} itemId - Checklist item ID
     * @param {boolean} completed - Completion state
     * @returns {Promise<Object>} Updated checklist item
     */
    toggle: async (taskId, itemId, completed) => {
      const response = await patch(`/api/tasks/${taskId}/checklist/${itemId}`, {
        completed,
      });
      return response.data;
    },
  },

  // Comment methods
  comments: {
    /**
     * List comments for a task
     * @param {string} taskId - Task ID
     * @returns {Promise<Array>} List of comments
     */
    list: async (taskId) => {
      const response = await get(`/api/tasks/${taskId}/comments`);
      return response.data;
    },

    /**
     * Create comment
     * @param {string} taskId - Task ID
     * @param {Object} commentData - Comment data
     * @param {string} commentData.content - Comment content
     * @returns {Promise<Object>} Created comment
     */
    create: async (taskId, commentData) => {
      const response = await post(`/api/tasks/${taskId}/comments`, commentData);
      return response.data;
    },

    /**
     * Update comment
     * @param {string} taskId - Task ID
     * @param {string} commentId - Comment ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated comment
     */
    update: async (taskId, commentId, updates) => {
      const response = await patch(`/api/tasks/${taskId}/comments/${commentId}`, updates);
      return response.data;
    },

    /**
     * Delete comment
     * @param {string} taskId - Task ID
     * @param {string} commentId - Comment ID
     * @returns {Promise<Object>} Success message
     */
    delete: async (taskId, commentId) => {
      const response = await del(`/api/tasks/${taskId}/comments/${commentId}`);
      return response.data;
    },
  },
};
