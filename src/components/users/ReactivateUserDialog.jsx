/**
 * Reactivate User Dialog
 * Confirmation dialog for restoring a soft-deleted user
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
import { CheckCircle2, Info } from 'lucide-react';
import { useReactivateUser } from '@/hooks/useUsers';

export function ReactivateUserDialog({ user, open, onOpenChange }) {
  const reactivateUser = useReactivateUser();

  const handleReactivate = async () => {
    try {
      await reactivateUser.mutateAsync(user.id);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Reactivate User
          </DialogTitle>
          <DialogDescription>
            Restore this user account to active status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The user will regain access to the system and will be required to change their
              password on next login for security.
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

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <Badge variant="secondary">{getRoleName(user)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deactivated:</span>
                <span className="font-medium">{formatDate(user?.deleted_at)}</span>
              </div>
              {user?.deleted_by_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deactivated by:</span>
                  <span className="font-medium">{user.deleted_by_name}</span>
                </div>
              )}
            </div>
          </div>

          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Security measure:</strong> The user will be required to change their password
              on next login to ensure account security.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReactivate} disabled={reactivateUser.isPending}>
            {reactivateUser.isPending ? 'Reactivating...' : 'Reactivate User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
