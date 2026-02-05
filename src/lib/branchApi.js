import { get, post } from './api.js';

export const branchApi = {
  /**
   * Get all branches accessible to the current user
   */
  async getUserBranches() {
    const response = await get('/api/user/branches');
    return response.data?.branches || [];
  },

  /**
   * Set the active branch for the current session
   */
  async selectBranch(branchId) {
    await post('/api/user/branches/select', { branch_id: branchId });
  },

  /**
   * Get the currently active branch from the session
   */
  async getActiveBranch() {
    const response = await get('/api/user/active-branch');
    return response.data?.branch;
  },

  /**
   * Assign a user to multiple branches (admin/manager only)
   */
  async assignUserBranches(userId, branchIds, primaryBranchId) {
    await post(`/api/users/${userId}/branches`, {
      branch_ids: branchIds,
      primary_branch_id: primaryBranchId
    });
  },

  /**
   * Get all users assigned to a specific branch (admin/manager only)
   */
  async getBranchUsers(branchId) {
    const response = await get(`/api/branches/${branchId}/users`);
    return response.data?.users || [];
  },

  /**
   * Get all branches assigned to a specific user
   */
  async getUserBranchAssignments(userId) {
    const response = await get(`/api/users/${userId}/branches`);
    return response.data?.branches || [];
  }
};
