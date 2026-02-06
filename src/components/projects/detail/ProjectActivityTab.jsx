import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Activity, Edit, UserPlus, UserMinus, Package, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const activityIcons = {
  project_created: Activity,
  project_updated: Edit,
  task_created: CheckCircle,
  task_updated: Edit,
  member_added: UserPlus,
  member_removed: UserMinus,
  material_added: Package,
  material_updated: Package,
};

const activityColors = {
  project_created: 'text-blue-500',
  project_updated: 'text-yellow-500',
  task_created: 'text-green-500',
  task_updated: 'text-orange-500',
  member_added: 'text-purple-500',
  member_removed: 'text-red-500',
  material_added: 'text-cyan-500',
  material_updated: 'text-indigo-500',
};

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function ProjectActivityTab({ projectId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['project-activity', projectId],
    queryFn: () => get(\`/api/projects/\${projectId}/activity\`),
    // If endpoint doesn't exist yet, provide mock data
    enabled: false,
  });

  // Mock activity data for now
  const activities = [
    {
      id: '1',
      action: 'project_created',
      user_name: 'John Doe',
      details: 'Created the project',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      action: 'task_created',
      user_name: 'Jane Smith',
      details: 'Added task "Setup database schema"',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      action: 'member_added',
      user_name: 'John Doe',
      details: 'Added Sarah Johnson to the team',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => {
                  const Icon = activityIcons[activity.action] || Activity;
                  const iconColor = activityColors[activity.action] || 'text-gray-500';

                  return (
                    <div key={activity.id} className="relative">
                      {index < activities.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" />
                      )}
                      <div className="flex gap-4">
                        <div className="relative">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <Icon className={\`h-5 w-5 \${iconColor}\`} />
                          </div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getInitials(activity.user_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{activity.user_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {activity.action.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.details}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(activity.created_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="text-xs text-muted-foreground text-center">
        Activity tracking is based on project changes and updates
      </div>
    </div>
  );
}
