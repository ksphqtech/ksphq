import { useMemo } from 'react';
import { useBranch } from '@/contexts/BranchContext';

/**
 * Hook to filter data array by the currently selected branch
 * Returns all data if no branch is selected (admin "All Branches" view)
 * or filters to only items matching the selected branch ID
 */
export function useBranchFilteredData(data) {
  const { effectiveBranchId } = useBranch();

  return useMemo(() => {
    // null = "All Branches" (admin view) - return all data
    if (!effectiveBranchId) return data;

    // Filter by selected branch
    return data.filter(item => item.branch_id === effectiveBranchId);
  }, [data, effectiveBranchId]);
}
