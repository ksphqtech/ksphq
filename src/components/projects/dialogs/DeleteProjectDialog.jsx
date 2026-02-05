/**
 * Delete Project Dialog
 * Confirmation dialog for soft deleting a project
 */

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FolderOpen } from 'lucide-react';
import { useDeleteProject, useProject } from '@/hooks/useProjects';

export function DeleteProjectDialog({ project, open, onOpenChange }) {
  const deleteProject = useDeleteProject();

  // Fetch full project details to check for active tasks
  const { data: fullProjectData, isLoading: isLoadingProject } = useProject(project?.id);
  const fullProject = fullProjectData?.project;

  const [hasActiveTasks, setHasActiveTasks] = useState(false);

  // Check if project has active tasks
  useEffect(() => {
    if (fullProject && open) {
      // Check if project has tasks with status other than 'completed' or 'cancelled'
      const activeTasks = fullProject.tasks?.filter(
        task => task.status !== 'completed' && task.status !== 'cancelled'
      ) || [];
      setHasActiveTasks(activeTasks.length > 0);
    }
  }, [fullProject, open]);

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(project.id);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'on_hold':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Show loading state while fetching full project details
  if (open && isLoadingProject) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-3 text-muted-foreground">Loading project details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Project
          </DialogTitle>
          <DialogDescription>
            This will permanently delete the project and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          {hasActiveTasks ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This project has active tasks. Deleting the project
                will also delete all associated tasks and their data. This action cannot be undone.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. The project and all its data will be permanently
                deleted from the system.
              </AlertDescription>
            </Alert>
          )}

          {/* Project Info Card */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <p className="font-semibold text-base truncate">
                    {project?.name || fullProject?.name}
                  </p>
                  {(project?.description || fullProject?.description) && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {project?.description || fullProject?.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={getStatusBadgeVariant(project?.status || fullProject?.status)}>
                      {(project?.status || fullProject?.status || 'unknown').replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">Priority:</span>
                    <Badge variant={getPriorityBadgeVariant(project?.priority || fullProject?.priority)}>
                      {(project?.priority || fullProject?.priority || 'unknown')}
                    </Badge>
                  </div>
                </div>

                {hasActiveTasks && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="font-medium text-destructive">
                        {fullProject?.tasks?.length || 0} active task(s) will be deleted
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info Alert */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Note:</strong> This is a permanent deletion. Unlike user accounts,
              deleted projects cannot be recovered.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProject.isPending}
          >
            {deleteProject.isPending ? 'Deleting...' : 'Delete Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
