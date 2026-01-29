/**
 * Deactivate User Dialog
 * Confirmation dialog for soft deleting (deactivating) a user
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useDeleteUser } from '@/hooks/useUsers';

export function DeactivateUserDialog({ user, open, onOpenChange }) {
  const deleteUser = useDeleteUser();

  const handleDeactivate = async () => {
    try {
      await deleteUser.mutateAsync(user.id);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || 'U';
  };

  const getRoleName = (user) => {
    return user.role_name || user.role?.name || 'Unknown Role';
  };

  const getDepartmentName = (user) => {
    return user.department_name || 'No Department';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Deactivate User
          </DialogTitle>
          <DialogDescription>
            This will deactivate the user account and prevent them from logging in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The user will immediately lose access to the system. Their account data will be moved
              to the Deleted Users view where it can be recovered by administrators.
            </AlertDescription>
          </Alert>

          {/* User Info Card */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-sm">
                  {getInitials(user?.first_name, user?.last_name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.email}
                </p>
                {user?.first_name && user?.last_name && (
                  <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Role:</span>
                <Badge variant="secondary" className="ml-2">
                  {getRoleName(user)}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Department:</span>
                <span className="ml-2 font-medium">{getDepartmentName(user)}</span>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Note:</strong> Deactivated users can be reactivated by administrators from
              the Deleted Users panel. User data and history will be preserved.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeactivate}
            disabled={deleteUser.isPending}
          >
            {deleteUser.isPending ? 'Deactivating...' : 'Deactivate User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
