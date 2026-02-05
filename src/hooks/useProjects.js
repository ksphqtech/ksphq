/**
 * React Query hooks for project management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../lib/projectApi';
import { toast } from 'sonner';

export function useProjects(filters = {}) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectApi.list(filters),
    staleTime: 30000,
    retry: 1,
  });
}

export function useProject(projectId) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectApi.get(projectId),
    enabled: !!projectId,
    staleTime: 30000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(data.message || 'Project created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create project');
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, updates }) => projectApi.update(projectId, updates),
    onSuccess: (data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      toast.success(data.message || 'Project updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update project');
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectApi.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(data.message || 'Project deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete project');
    },
  });
}
