/**
 * Deleted Users Panel
 * View and manage soft-deleted (deactivated) users
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, RotateCcw, Info } from 'lucide-react';
import { useDeletedUsers } from '@/hooks/useUsers';
import { ReactivateUserDialog } from './ReactivateUserDialog';

export function DeletedUsersPanel({ open, onOpenChange }) {
  const { data: deletedUsersData, isLoading } = useDeletedUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [reactivatingUser, setReactivatingUser] = useState(null);

  const deletedUsers = deletedUsersData?.users || [];

  const filteredUsers = deletedUsers.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query)
    );
  });

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Deactivated Users</DialogTitle>
            <DialogDescription>
              View and restore users who have been deactivated. User data is retained for recovery.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Deactivated users are retained for 90 days before permanent deletion. You can
                reactivate users at any time to restore their access.
              </AlertDescription>
            </Alert>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deleted users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-sm text-muted-foreground">Loading...</div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No deleted users match your search' : 'No deleted users'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Deleted</TableHead>
                      <TableHead>Deleted By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(user.first_name, user.last_name, user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {user.first_name && user.last_name
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.email}
                              </p>
                              {user.first_name && user.last_name && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {user.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.role_name || 'Unknown'}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {user.department_name || 'None'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(user.deleted_at)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {user.deleted_by_name || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReactivatingUser(user)}
                            className="gap-2"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reactivate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Footer Info */}
            {filteredUsers.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {deletedUsers.length} deactivated user
                {deletedUsers.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reactivate Dialog */}
      {reactivatingUser && (
        <ReactivateUserDialog
          user={reactivatingUser}
          open={!!reactivatingUser}
          onOpenChange={(open) => !open && setReactivatingUser(null)}
        />
      )}
    </>
  );
}
