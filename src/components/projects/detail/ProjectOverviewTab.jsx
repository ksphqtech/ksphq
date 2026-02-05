import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, DollarSign, User, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

export function ProjectOverviewTab({ project }) {
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'in progress':
      case 'active':
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const calculateProgress = () => {
    if (project.progress !== undefined) {
      return project.progress;
    }
    if (project.completion !== undefined) {
      const completion = parseInt(project.completion);
      return isNaN(completion) ? 0 : completion;
    }
    return 0;
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={getStatusVariant(project.status)}>
              {project.status || 'Unknown'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priority</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={getPriorityVariant(project.priority)}>
              {project.priority || 'Not set'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.budget
                ? `$${parseFloat(project.budget).toLocaleString()}`
                : 'Not set'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Overview of project information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          {project.description && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {project.description}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Project Manager */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1">Project Manager</h3>
              <p className="text-sm text-muted-foreground">
                {project.manager || project.created_by || 'Not assigned'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium mb-1">Start Date</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(project.start_date || project.startDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium mb-1">End Date</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(project.end_date || project.dueDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(project.branch_id || project.location) && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-1">Location</h3>
                <p className="text-sm text-muted-foreground">
                  {project.location || `Branch ID: ${project.branch_id}`}
                </p>
              </div>
            </>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{formatDate(project.created_at)}</span>
            </div>
            {project.updated_at && (
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span>{formatDate(project.updated_at)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget Information */}
      {project.budget && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Information</CardTitle>
            <CardDescription>Financial details for this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="text-sm font-medium mb-1">Allocated Budget</h3>
                <p className="text-2xl font-bold">
                  ${parseFloat(project.budget).toLocaleString()}
                </p>
              </div>
              {project.spent && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Spent</h3>
                  <p className="text-2xl font-bold text-destructive">
                    ${parseFloat(project.spent).toLocaleString()}
                  </p>
                </div>
              )}
              {project.budget && project.spent && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Remaining</h3>
                  <p className="text-2xl font-bold text-green-600">
                    ${(parseFloat(project.budget) - parseFloat(project.spent)).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
