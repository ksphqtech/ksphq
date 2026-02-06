/**
 * Project List View
 * Table view for displaying and managing projects
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function ProjectListView({ projects = [], isLoading = false }) {
  const navigate = useNavigate();
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'in progress':
        return 'default';
      case 'planning':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'on hold':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityVariant = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a new project to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  onClick={() => navigate(`/tools/projects/${project.id}`)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.project_manager_name || 'Not assigned'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(project.status)}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityVariant(project.priority)}>
                      {project.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{project.start_date}</TableCell>
                  <TableCell>{project.end_date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Progress value={parseInt(project.completion_percentage || 0)} className="h-2" />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {project.completion_percentage}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
