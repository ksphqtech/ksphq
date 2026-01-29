/**
 * Users Page - Enterprise User Management
 * Complete user management interface with all CRUD operations
 */

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Edit, Trash2, KeyRound, UserX, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { UserStatsCards } from '@/components/users/UserStatsCards';
import { UserTableFilters } from '@/components/users/UserTableFilters';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { DeactivateUserDialog } from '@/components/users/DeactivateUserDialog';
import { PasswordResetDialog } from '@/components/users/PasswordResetDialog';
import { DeletedUsersPanel } from '@/components/users/DeletedUsersPanel';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [filters, setFilters] = useState({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deactivatingUser, setDeactivatingUser] = useState(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState(null);
  const [showDeletedPanel, setShowDeletedPanel] = useState(false);

  const { data, isLoading, error } = useUsers(filters);
  const users = data?.users || [];
  const pagination = data?.pagination || {};

  // Check user permissions
  const userPermissions = currentUser?.role_permissions || currentUser?.permissions || {};
  const canManageUsers = ['full', 'branch', 'department', 'team'].includes(
    userPermissions.user_management
  );
  const canViewOnly = userPermissions.user_management === 'view_team' ||
                       userPermissions.user_management === 'view_self';

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || 'U';
  };

  const getRoleBadgeVariant = (roleLevel) => {
    if (roleLevel >= 80) return 'default';
    if (roleLevel >= 40) return 'secondary';
    return 'outline';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canViewOnly && (
              <Badge variant="outline" className="gap-1">
                <Info className="h-3 w-3" />
                View Only
              </Badge>
            )}
            {canManageUsers && (
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create User
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <UserStatsCards onDeletedClick={() => setShowDeletedPanel(true)} />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <UserTableFilters filters={filters} onFiltersChange={setFilters} />
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  {isLoading
                    ? 'Loading...'
                    : `Showing ${users.length} of ${pagination.total || 0} users`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  Failed to load users: {error.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    {canManageUsers && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={canManageUsers ? 6 : 5} className="text-center py-8">
                        <div className="text-muted-foreground">Loading users...</div>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManageUsers ? 6 : 5} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {Object.keys(filters).length > 0
                            ? 'No users match your filters'
                            : 'No users found'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(user.first_name, user.last_name, user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">
                                  {user.first_name && user.last_name
                                    ? `${user.first_name} ${user.last_name}`
                                    : user.email}
                                </p>
                                {user.id === currentUser?.id && (
                                  <Badge variant="outline" className="text-xs">You</Badge>
                                )}
                              </div>
                              {user.first_name && user.last_name && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {user.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role_level)}>
                            {user.role_name || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {user.department_name || 'None'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.is_active ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(user.last_login_at)}
                          </span>
                        </TableCell>
                        {canManageUsers && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setResettingPasswordUser(user)}>
                                  <KeyRound className="mr-2 h-4 w-4" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeactivatingUser(user)}
                                  disabled={user.id === currentUser?.id}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Deactivate User
                                </DropdownMenuItem>
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateUserDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        />
      )}

      {deactivatingUser && (
        <DeactivateUserDialog
          user={deactivatingUser}
          open={!!deactivatingUser}
          onOpenChange={(open) => !open && setDeactivatingUser(null)}
        />
      )}

      {resettingPasswordUser && (
        <PasswordResetDialog
          user={resettingPasswordUser}
          open={!!resettingPasswordUser}
          onOpenChange={(open) => !open && setResettingPasswordUser(null)}
        />
      )}

      <DeletedUsersPanel open={showDeletedPanel} onOpenChange={setShowDeletedPanel} />
    </DashboardLayout>
  );
}
