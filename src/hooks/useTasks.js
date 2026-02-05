/**
 * React Query hooks for task management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '../lib/taskApi';
import { toast } from 'sonner';

export function useTasks(projectId, filters = {}) {
  const queryParams = projectId ? { ...filters, project_id: projectId } : filters;

  return useQuery({
    queryKey: ['tasks', queryParams],
    queryFn: () => taskApi.list(queryParams),
    staleTime: 30000,
    retry: 1,
  });
}

export function useTask(taskId) {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => taskApi.get(taskId),
    enabled: !!taskId,
    staleTime: 30000,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(data.message || 'Task created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create task');
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, updates }) => taskApi.update(taskId, updates),
    onSuccess: (data, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      toast.success(data.message || 'Task updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update task');
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(data.message || 'Task deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete task');
    },
  });
}

export function useAddDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, dependsOnTaskId }) => taskApi.addDependency(taskId, dependsOnTaskId),
    onSuccess: (data, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      toast.success(data.message || 'Dependency added successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add dependency');
    },
  });
}

export function useRemoveDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, dependsOnTaskId }) => taskApi.removeDependency(taskId, dependsOnTaskId),
    onSuccess: (data, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      toast.success(data.message || 'Dependency removed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove dependency');
    },
  });
}
