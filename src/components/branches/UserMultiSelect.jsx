import { useState, useEffect } from 'react';
import { branchApi } from '@/lib/branchApi';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export function UserMultiSelect({ branchId }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      if (!branchId) return;

      try {
        setIsLoading(true);
        const branchUsers = await branchApi.getBranchUsers(branchId);
        setUsers(branchUsers);
      } catch (error) {
        console.error('Failed to load branch users:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, [branchId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>No users assigned to this branch</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <Users className="h-4 w-4" />
            <span>{users.length} user{users.length !== 1 ? 's' : ''} assigned</span>
          </div>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.email}
                  </span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  {user.is_primary && (
                    <Badge variant="outline" className="text-xs">Primary</Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {user.role_name || 'User'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            To modify user assignments, go to the Users page and edit individual user settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
