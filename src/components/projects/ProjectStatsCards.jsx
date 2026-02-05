/**
 * Project Stats Cards
 * Dashboard cards showing project statistics and metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export function ProjectStatsCards({ projects = [], isLoading = false }) {
  // Calculate stats
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter(p => p.status === 'In Progress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const avgCompletion = totalProjects > 0
    ? Math.round(projects.reduce((acc, p) => acc + parseInt(p.completion || 0), 0) / totalProjects)
    : 0;

  if (isLoading) {
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
      {/* Total Projects */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-blue-500" />
            Total Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProjects}</div>
          <p className="text-xs text-muted-foreground mt-1">
            All active projects
          </p>
        </CardContent>
      </Card>

      {/* In Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            In Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inProgressProjects}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Currently active
          </p>
        </CardContent>
      </Card>

      {/* Completed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Completed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedProjects}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Successfully finished
          </p>
        </CardContent>
      </Card>

      {/* Average Completion */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" />
            Avg Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgCompletion}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            Overall progress
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
