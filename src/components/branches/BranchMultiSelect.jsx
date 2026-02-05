import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { orgUnitApi } from '@/lib/orgUnitApi';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export function BranchMultiSelect({
  selectedBranchIds = [],
  onSelectionChange,
  primaryBranchId,
  onPrimaryChange,
  disabled = false
}) {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBranches() {
      try {
        const result = await orgUnitApi.list({ type: 'branch' });
        setBranches(result.filter(b => b.is_active));
      } catch (error) {
        console.error('Failed to load branches:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadBranches();
  }, []);

  const handleToggle = (branchId) => {
    if (disabled) return;

    const newSelection = selectedBranchIds.includes(branchId)
      ? selectedBranchIds.filter(id => id !== branchId)
      : [...selectedBranchIds, branchId];

    onSelectionChange(newSelection);

    // If removing primary, set new primary
    if (!newSelection.includes(primaryBranchId) && newSelection.length > 0) {
      onPrimaryChange(newSelection[0]);
    }
  };

  const handleSetPrimary = (branchId) => {
    if (disabled) return;
    onPrimaryChange(branchId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Loading branches...</div>
        </CardContent>
      </Card>
    );
  }

  if (branches.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            No branches available. Create branches first.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="max-h-[200px] overflow-y-auto">
          <div className="space-y-3">
            {branches.map((branch) => {
              const isSelected = selectedBranchIds.includes(branch.id);
              const isPrimary = branch.id === primaryBranchId;

              return (
                <div key={branch.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Checkbox
                      id={branch.id}
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(branch.id)}
                      disabled={disabled}
                    />
                    <Label
                      htmlFor={branch.id}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      <div>{branch.name}</div>
                      <div className="text-xs text-muted-foreground">{branch.code}</div>
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPrimary && (
                      <Badge variant="outline" className="text-xs">Primary</Badge>
                    )}
                    {isSelected && !isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(branch.id)}
                        disabled={disabled}
                        className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        Set as primary
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Select one or more branches. The primary branch is used as the default.
        </p>
      </CardContent>
    </Card>
  );
}
