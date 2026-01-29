/**
 * React Query hooks for user management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../lib/userApi';
import { useToast } from '../components/ui/use-toast';

/**
 * Query hook to list users with filters
 * @param {Object} filters - Filter parameters
 * @returns {QueryResult} React Query result
 */
export function useUsers(filters = {}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => userApi.list(filters),
    staleTime: 30000, // 30 seconds
    retry: 1,
  });
}

/**
 * Query hook to get a single user
 * @param {string} userId - User ID
 * @returns {QueryResult} React Query result
 */
export function useUser(userId) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => userApi.get(userId),
    enabled: !!userId,
    staleTime: 30000,
  });
}

/**
 * Mutation hook to create a user
 * @returns {MutationResult} React Query mutation
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: userApi.create,
    onSuccess: (data) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // Show success toast
      toast({
        title: 'Success',
        description: data.message || 'User created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mutation hook to update a user
 * @returns {MutationResult} React Query mutation
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, updates }) => userApi.update(userId, updates),
    onMutate: async ({ userId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users', userId] });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(['users', userId]);

      // Optimistically update
      queryClient.setQueryData(['users', userId], (old) => ({
        ...old,
        user: { ...old.user, ...updates },
      }));

      return { previousUser };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(['users', variables.userId], context.previousUser);
      }

      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    },
    onSuccess: (data, { userId }) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', userId] });

      toast({
        title: 'Success',
        description: data.message || 'User updated successfully',
      });
    },
  });
}

/**
 * Mutation hook to delete (deactivate) a user
 * @returns {MutationResult} React Query mutation
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: userApi.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });

      toast({
        title: 'Success',
        description: data.message || 'User deactivated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deactivate user',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mutation hook to reactivate a soft-deleted user
 * @returns {MutationResult} React Query mutation
 */
export function useReactivateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: userApi.reactivate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'deleted'] });

      toast({
        title: 'Success',
        description: data.message || 'User reactivated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reactivate user',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mutation hook to reset user password
 * @returns {MutationResult} React Query mutation
 */
export function useResetPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, options }) => userApi.resetPassword(userId, options),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message || 'Password reset successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Query hook to get deleted users
 * @returns {QueryResult} React Query result
 */
export function useDeletedUsers() {
  return useQuery({
    queryKey: ['users', 'deleted'],
    queryFn: userApi.getDeleted,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Mutation hook to bulk deactivate users
 * @returns {MutationResult} React Query mutation
 */
export function useBulkDeactivate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: userApi.bulkDeactivate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });

      toast({
        title: 'Success',
        description: data.message || 'Users deactivated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deactivate users',
        variant: 'destructive',
      });
    },
  });
}
