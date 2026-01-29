/**
 * React Query hooks for role management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '../lib/roleApi';
import { useToast } from '../components/ui/use-toast';

/**
 * Query hook to list all roles
 * @returns {QueryResult} React Query result
 */
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: roleApi.list,
    staleTime: 300000, // 5 minutes (roles don't change often)
  });
}

/**
 * Query hook to get a single role
 * @param {string} roleId - Role ID
 * @returns {QueryResult} React Query result
 */
export function useRole(roleId) {
  return useQuery({
    queryKey: ['roles', roleId],
    queryFn: () => roleApi.get(roleId),
    enabled: !!roleId,
    staleTime: 300000,
  });
}

/**
 * Mutation hook to create a role
 * @returns {MutationResult} React Query mutation
 */
export function useCreateRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: roleApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });

      toast({
        title: 'Success',
        description: data.message || 'Role created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create role',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mutation hook to update a role
 * @returns {MutationResult} React Query mutation
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ roleId, updates }) => roleApi.update(roleId, updates),
    onSuccess: (data, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', roleId] });

      toast({
        title: 'Success',
        description: data.message || 'Role updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mutation hook to delete a role
 * @returns {MutationResult} React Query mutation
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: roleApi.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });

      toast({
        title: 'Success',
        description: data.message || 'Role deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete role',
        variant: 'destructive',
      });
    },
  });
}
