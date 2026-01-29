/**
 * Roles Management Page
 * Manage system and custom roles with permissions
 */

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, MoreVertical, Edit, Trash2, Shield, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles, useDeleteRole } from '@/hooks/useRoles';
import { CreateRoleDialog } from '@/components/roles/CreateRoleDialog';
import { EditRoleDialog } from '@/components/roles/EditRoleDialog';

export function RolesPage() {
  const { user: currentUser } = useAuth();
  const { data: rolesData, isLoading, error } = useRoles();
  const deleteRole = useDeleteRole();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const roles = rolesData?.roles || [];
  const isAdmin = currentUser?.role_level >= 100;

  const handleDelete = async (role) => {
    if (!confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteRole.mutateAsync(role.id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const getPermissionSummary = (permissions) => {
    if (!permissions) return 'No permissions';
    if (permissions.all) return 'All permissions';

    const enabled = Object.entries(permissions)
      .filter(([key, value]) => value === true && key !== 'all')
      .map(([key]) => key);

    if (enabled.length === 0) return 'No permissions';
    return enabled.slice(0, 3).join(', ') + (enabled.length > 3 ? '...' : '');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Roles & Permissions</h1>
            <p className="text-muted-foreground">
              Manage system roles and custom role templates
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          )}
        </div>

        {!isAdmin && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Only administrators can manage roles. Contact your administrator to create or modify roles.
            </AlertDescription>
          </Alert>
        )}

        {/* Roles Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Roles</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading...' : `${roles.length} role${roles.length !== 1 ? 's' : ''} configured`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  Failed to load roles: {error.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Type</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8">
                        <div className="text-muted-foreground">Loading roles...</div>
                      </TableCell>
                    </TableRow>
                  ) : roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8">
                        <div className="text-muted-foreground">No roles found</div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{role.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{role.level}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {role.description || 'No description'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {getPermissionSummary(role.permissions)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{role.user_count || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          {role.is_system_role ? (
                            <Badge variant="default" className="bg-blue-500">System</Badge>
                          ) : (
                            <Badge variant="outline">Custom</Badge>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingRole(role)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Role
                                </DropdownMenuItem>
                                {!role.is_system_role && role.user_count === 0 && (
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(role)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Role
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>System Roles:</strong> Cannot be deleted but can be edited. These are the default
              6-tier hierarchy (Admin level 100 → Employee level 10).
            </p>
            <p>
              <strong>Custom Roles:</strong> Can be created with any permission combination. Can only
              be deleted if no users are assigned to them.
            </p>
            <p>
              <strong>Role Levels:</strong> Higher level numbers indicate more privileged roles (1-100).
              Use levels to create clear hierarchies.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {isAdmin && (
        <>
          <CreateRoleDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

          {editingRole && (
            <EditRoleDialog
              role={editingRole}
              open={!!editingRole}
              onOpenChange={(open) => !open && setEditingRole(null)}
            />
          )}
        </>
      )}
    </DashboardLayout>
  );
}
