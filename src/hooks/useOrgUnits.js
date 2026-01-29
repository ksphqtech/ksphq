/**
 * React Query hooks for organizational unit management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orgUnitApi } from '../lib/orgUnitApi';
import { toast } from 'sonner';

export function useOrgUnits(params = {}) {
  return useQuery({
    queryKey: ['org-units', params],
    queryFn: () => orgUnitApi.list(params),
    staleTime: 300000,
  });
}

export function useOrgUnit(unitId) {
  return useQuery({
    queryKey: ['org-units', unitId],
    queryFn: () => orgUnitApi.get(unitId),
    enabled: !!unitId,
    staleTime: 300000,
  });
}

export function useCreateOrgUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: orgUnitApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['org-units'] });
      toast.success(data.message || 'Organizational unit created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create organizational unit');
    },
  });
}

export function useUpdateOrgUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ unitId, updates }) => orgUnitApi.update(unitId, updates),
    onSuccess: (data, { unitId }) => {
      queryClient.invalidateQueries({ queryKey: ['org-units'] });
      queryClient.invalidateQueries({ queryKey: ['org-units', unitId] });
      toast.success(data.message || 'Organizational unit updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update organizational unit');
    },
  });
}

export function useDeleteOrgUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: orgUnitApi.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['org-units'] });
      toast.success(data.message || 'Organizational unit deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete organizational unit');
    },
  });
}

export function useBranches() {
  return useOrgUnits({ type: 'branch' });
}

export function useDepartments() {
  return useOrgUnits({ type: 'department' });
}

export function useShifts() {
  return useOrgUnits({ type: 'shift' });
}

export function useTeams() {
  return useOrgUnits({ type: 'team' });
}

export function useGroups() {
  return useOrgUnits({ type: 'group' });
}
