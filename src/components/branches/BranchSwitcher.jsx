import { useBranch } from '@/contexts/BranchContext';
import { Building2, Check, Search } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

export function BranchSwitcher() {
  const {
    branches,
    selectedBranch,
    selectBranch,
    canViewAllBranches,
    isLoading
  } = useBranch();

  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading || branches.length === 0) return null;

  const filteredBranches = branches.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = async (branchId) => {
    try {
      await selectBranch(branchId);
      setIsOpen(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Branch switch failed:', error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent">
        <Building2 className="h-4 w-4" />
        <span className="hidden md:inline">
          {selectedBranch ? selectedBranch.name : 'All Branches'}
        </span>
        <span className="md:hidden">
          {selectedBranch ? selectedBranch.code : 'All'}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[300px]">
        <div className="p-2">
          <div className="flex items-center gap-2 px-2 py-1 border rounded-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 p-0 h-auto focus-visible:ring-0"
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-[300px] overflow-y-auto">
          {canViewAllBranches && (
            <>
              <DropdownMenuItem onClick={() => handleSelect(null)}>
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">All Branches</span>
                  {!selectedBranch && <Check className="h-4 w-4" />}
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {filteredBranches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => handleSelect(branch.id)}
            >
              <div className="flex items-center justify-between w-full">
                <div>
                  <div className="font-medium">{branch.name}</div>
                  <div className="text-xs text-muted-foreground">{branch.code}</div>
                </div>
                {selectedBranch?.id === branch.id && (
                  <Check className="h-4 w-4" />
                )}
              </div>
            </DropdownMenuItem>
          ))}

          {filteredBranches.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No branches found
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
