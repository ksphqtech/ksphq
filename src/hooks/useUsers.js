/**
 * React Query hooks for user management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../lib/userApi';
import { toast } from 'sonner';

export function useUsers(filters = {}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => userApi.list(filters),
    staleTime: 30000,
    retry: 1,
  });
}

export function useUser(userId) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => userApi.get(userId),
    enabled: !!userId,
    staleTime: 30000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(data.message || 'User created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create user');
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }) => userApi.update(userId, updates),
    onSuccess: (data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', userId] });
      toast.success(data.message || 'User updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update user');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(data.message || 'User deactivated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to deactivate user');
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.reactivate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'deleted'] });
      toast.success(data.message || 'User reactivated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reactivate user');
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ userId, options }) => userApi.resetPassword(userId, options),
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reset password');
    },
  });
}

export function useDeletedUsers() {
  return useQuery({
    queryKey: ['users', 'deleted'],
    queryFn: userApi.getDeleted,
    staleTime: 60000,
  });
}

export function useBulkDeactivate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.bulkDeactivate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(data.message || 'Users deactivated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to deactivate users');
    },
  });
}
