/**
 * React Query hooks for material management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialApi } from '../lib/materialApi';
import { toast } from 'sonner';

/**
 * Fetch materials with optional filtering
 * @param {string} projectId - Optional project ID to filter materials
 * @param {Object} filters - Additional filters (category, task_id, search, etc.)
 * @returns {Object} React Query result with materials data
 */
export function useMaterials(projectId, filters = {}) {
  const queryParams = projectId ? { ...filters, project_id: projectId } : filters;

  return useQuery({
    queryKey: ['materials', queryParams],
    queryFn: () => materialApi.list(queryParams),
    staleTime: 30000,
    retry: 1,
  });
}

/**
 * Fetch a single material by ID
 * @param {string} materialId - Material ID to fetch
 * @returns {Object} React Query result with material data
 */
export function useMaterial(materialId) {
  return useQuery({
    queryKey: ['materials', materialId],
    queryFn: () => materialApi.get(materialId),
    enabled: !!materialId,
    staleTime: 30000,
  });
}

/**
 * Create a new material
 * Automatically invalidates materials queries and shows success/error toast
 * @returns {Object} React Query mutation object
 */
export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: materialApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success(data.message || 'Material created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create material');
    },
  });
}

/**
 * Update an existing material
 * Automatically invalidates materials queries and shows success/error toast
 * @returns {Object} React Query mutation object
 * @example
 * const updateMaterial = useUpdateMaterial();
 * updateMaterial.mutate({ materialId: '123', updates: { quantity: 100 } });
 */
export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ materialId, updates }) => materialApi.update(materialId, updates),
    onSuccess: (data, { materialId }) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials', materialId] });
      toast.success(data.message || 'Material updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update material');
    },
  });
}

/**
 * Delete a material
 * Automatically invalidates materials queries and shows success/error toast
 * @returns {Object} React Query mutation object
 * @example
 * const deleteMaterial = useDeleteMaterial();
 * deleteMaterial.mutate('material-id-123');
 */
export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: materialApi.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success(data.message || 'Material deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete material');
    },
  });
}
