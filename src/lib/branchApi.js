import { apiClient } from './api';

export const branchApi = {
  /**
   * Get all branches accessible to the current user
   */
  async getUserBranches() {
    const response = await apiClient.get('/api/user/branches');
    return response.branches;
  },

  /**
   * Set the active branch for the current session
   */
  async selectBranch(branchId) {
    await apiClient.post('/api/user/branches/select', { branch_id: branchId });
  },

  /**
   * Get the currently active branch from the session
   */
  async getActiveBranch() {
    const response = await apiClient.get('/api/user/active-branch');
    return response.branch;
  },

  /**
   * Assign a user to multiple branches (admin/manager only)
   */
  async assignUserBranches(userId, branchIds, primaryBranchId) {
    await apiClient.post(`/api/users/${userId}/branches`, {
      branch_ids: branchIds,
      primary_branch_id: primaryBranchId
    });
  },

  /**
   * Get all users assigned to a specific branch (admin/manager only)
   */
  async getBranchUsers(branchId) {
    const response = await apiClient.get(`/api/branches/${branchId}/users`);
    return response.users;
  },

  /**
   * Get all branches assigned to a specific user
   */
  async getUserBranchAssignments(userId) {
    const response = await apiClient.get(`/api/users/${userId}/branches`);
    return response.branches;
  }
};
