import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { branchApi } from '@/lib/branchApi';

const BranchContext = createContext({
  branches: [],
  selectedBranch: null,
  selectBranch: () => {},
  effectiveBranchId: null, // null = "All Branches" for admins
  canViewAllBranches: false,
  isLoading: true
});

export function BranchProvider({ children }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const canViewAllBranches = user?.role_level >= 100; // Admin

  // Load user's branches
  useEffect(() => {
    if (!user) {
      setBranches([]);
      setSelectedBranch(null);
      setIsLoading(false);
      return;
    }

    async function loadBranches() {
      try {
        const userBranches = await branchApi.getUserBranches();

        // Ensure we have a valid array
        if (!Array.isArray(userBranches)) {
          console.warn('getUserBranches did not return an array:', userBranches);
          setBranches([]);
          setIsLoading(false);
          return;
        }

        setBranches(userBranches);

        // Restore from localStorage or use active from server
        const savedBranchId = localStorage.getItem('selected_branch_id');
        const active = userBranches.find(b => b.id === savedBranchId)
          || userBranches.find(b => b.id === user.activeBranchId)
          || userBranches.find(b => b.is_primary)
          || userBranches[0];

        setSelectedBranch(active);
      } catch (error) {
        console.error('Failed to load branches:', error);
        setBranches([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadBranches();
  }, [user]);

  const selectBranch = async (branchId) => {
    try {
      // null = "All Branches" for admins
      if (branchId === null && !canViewAllBranches) {
        throw new Error('Insufficient permissions');
      }

      if (branchId) {
        await branchApi.selectBranch(branchId);
        const newBranch = branches.find(b => b.id === branchId);
        setSelectedBranch(newBranch);
        localStorage.setItem('selected_branch_id', branchId);
      } else {
        // "All Branches" - no API call needed
        setSelectedBranch(null);
        localStorage.removeItem('selected_branch_id');
      }
    } catch (error) {
      console.error('Failed to select branch:', error);
      throw error;
    }
  };

  const effectiveBranchId = selectedBranch?.id || null;

  return (
    <BranchContext.Provider value={{
      branches,
      selectedBranch,
      selectBranch,
      effectiveBranchId,
      canViewAllBranches,
      isLoading
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => useContext(BranchContext);
