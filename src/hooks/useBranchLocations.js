/**
 * React Query hooks for branch location management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listBranchLocations,
  getLocation,
  createBranchLocation,
  updateLocation,
  deleteLocation,
  setPrimaryLocation,
} from '@/lib/branchLocationApi';

/**
 * Hook to fetch all locations for a branch
 * @param {string} branchId - Branch ID
 * @param {Object} options - React Query options
 */
export function useBranchLocations(branchId, options = {}) {
  return useQuery({
    queryKey: ['branch-locations', branchId],
    queryFn: () => listBranchLocations(branchId, false),
    enabled: !!branchId,
    ...options,
  });
}

/**
 * Hook to fetch a single location
 * @param {string} locationId - Location ID
 * @param {Object} options - React Query options
 */
export function useLocation(locationId, options = {}) {
  return useQuery({
    queryKey: ['location', locationId],
    queryFn: () => getLocation(locationId),
    enabled: !!locationId,
    ...options,
  });
}

/**
 * Hook to create a new branch location
 */
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ branchId, locationData }) =>
      createBranchLocation(branchId, locationData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch locations for this branch
      queryClient.invalidateQueries({ queryKey: ['branch-locations', variables.branchId] });
      // Invalidate org-units query to update location count
      queryClient.invalidateQueries({ queryKey: ['org-units'] });
      queryClient.invalidateQueries({ queryKey: ['org-unit', variables.branchId] });

      toast.success('Location created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create location');
    },
  });
}

/**
 * Hook to update a location
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ locationId, updates }) => updateLocation(locationId, updates),
    onSuccess: (data) => {
      // Invalidate location-specific query
      queryClient.invalidateQueries({ queryKey: ['location', data.id] });
      // Invalidate all branch locations for this branch
      queryClient.invalidateQueries({ queryKey: ['branch-locations', data.branch_id] });
      // Invalidate org-units in case primary changed
      queryClient.invalidateQueries({ queryKey: ['org-units'] });

      toast.success('Location updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update location');
    },
  });
}

/**
 * Hook to delete a location
 */
export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLocation,
    onSuccess: (_, locationId) => {
      // Invalidate all branch-locations queries
      queryClient.invalidateQueries({ queryKey: ['branch-locations'] });
      // Invalidate org-units query to update location count
      queryClient.invalidateQueries({ queryKey: ['org-units'] });

      toast.success('Location deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete location');
    },
  });
}

/**
 * Hook to set a location as primary
 */
export function useSetPrimaryLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setPrimaryLocation,
    onSuccess: (data) => {
      // Invalidate all locations for this branch
      queryClient.invalidateQueries({ queryKey: ['branch-locations', data.branch_id] });
      // Invalidate org-units in case we need to show primary location
      queryClient.invalidateQueries({ queryKey: ['org-units'] });

      toast.success('Primary location updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to set primary location');
    },
  });
}
