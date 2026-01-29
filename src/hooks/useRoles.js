/**
 * React Query hooks for role management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '../lib/roleApi';
import { toast } from 'sonner';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: roleApi.list,
    staleTime: 300000,
  });
}

export function useRole(roleId) {
  return useQuery({
    queryKey: ['roles', roleId],
    queryFn: () => roleApi.get(roleId),
    enabled: !!roleId,
    staleTime: 300000,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: roleApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(data.message || 'Role created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create role');
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, updates }) => roleApi.update(roleId, updates),
    onSuccess: (data, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', roleId] });
      toast.success(data.message || 'Role updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: roleApi.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(data.message || 'Role deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete role');
    },
  });
}
