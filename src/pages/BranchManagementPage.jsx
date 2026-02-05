import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Users, Edit2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { orgUnitApi } from '@/lib/orgUnitApi';
import { branchApi } from '@/lib/branchApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BranchDialog } from '@/components/branches/BranchDialog';

export function BranchManagementPage() {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [branchUsers, setBranchUsers] = useState({});

  const loadBranches = async () => {
    try {
      setIsLoading(true);
      const result = await orgUnitApi.list({ type: 'branch' });
      setBranches(result);

      // Load user counts for each branch
      const userCounts = {};
      if (Array.isArray(result) && result.length > 0) {
        await Promise.all(
          result.map(async (branch) => {
            try {
              const users = await branchApi.getBranchUsers(branch.id);
              // Validate users is an array
              userCounts[branch.id] = Array.isArray(users) ? users.length : 0;
            } catch (error) {
              console.error(`Failed to load users for branch ${branch.id}:`, error);
              userCounts[branch.id] = 0;
            }
          })
        );
      }
      setBranchUsers(userCounts);
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleCreate = () => {
    setSelectedBranch(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    await loadBranches();
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Branch Management</h1>
            <p className="text-muted-foreground">
              Manage branch locations and user assignments
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Branch
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No branches found. Create your first branch to get started.
                  </TableCell>
                </TableRow>
              ) : (
                branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {branchUsers[branch.id] || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(branch)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Branch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <BranchDialog
          branch={selectedBranch}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
        />
      </div>
    </DashboardLayout>
  );
}
