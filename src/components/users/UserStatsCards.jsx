/**
 * User Stats Cards
 * Dashboard cards showing user statistics and metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';

export function UserStatsCards({ onDeletedClick }) {
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: rolesData } = useRoles();

  const users = usersData?.users || [];
  const roles = rolesData?.roles || [];

  // Calculate stats
  const activeUsers = users.filter(u => u.is_active && !u.deleted_at).length;
  const inactiveUsers = users.filter(u => !u.is_active && !u.deleted_at).length;
  const deletedUsers = users.filter(u => u.deleted_at).length;

  // Get top 3 roles by user count
  const roleStats = roles
    .map(role => ({
      name: role.name,
      count: users.filter(u => u.role_id === role.id && !u.deleted_at).length,
    }))
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Recent activity (logged in within last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentlyActive = users.filter(u => {
    if (!u.last_login_at || u.deleted_at) return false;
    return new Date(u.last_login_at) > sevenDaysAgo;
  }).length;

  if (usersLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Active Users */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-500" />
            Active Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeUsers}</div>
          {inactiveUsers > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {inactiveUsers} inactive
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Roles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            By Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {roleStats.length > 0 ? (
              roleStats.map((stat, index) => (
                <div key={stat.name} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{stat.name}</span>
                  <span className="text-sm font-semibold">{stat.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No users</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Active This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentlyActive}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Logged in last 7 days
          </p>
        </CardContent>
      </Card>

      {/* Deleted Users */}
      <Card
        className={deletedUsers > 0 ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
        onClick={deletedUsers > 0 ? onDeletedClick : undefined}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <UserX className="h-4 w-4 text-orange-500" />
            Deactivated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{deletedUsers}</div>
          {deletedUsers > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Click to view
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
