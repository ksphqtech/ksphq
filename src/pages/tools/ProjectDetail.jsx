import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useDeleteProject } from '@/hooks/useProjects';
import { ToolLayout } from '@/components/layout/ToolLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProjectOverviewTab } from '@/components/projects/detail/ProjectOverviewTab';
import { ProjectTeamTab } from '@/components/projects/detail/ProjectTeamTab';
import { ProjectMaterialsTab } from '@/components/projects/detail/ProjectMaterialsTab';
import { ProjectReportsTab } from '@/components/projects/detail/ProjectReportsTab';
import { ProjectActivityTab } from '@/components/projects/detail/ProjectActivityTab';
import { EditProjectDialog } from '@/components/projects/dialogs/EditProjectDialog';
import { useState } from 'react';
import { useToolNavigation } from '@/hooks/useNavigation';

export function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const toolConfig = useToolNavigation('projects');
  const { data: project, isLoading, isError } = useProject(projectId);
  const deleteProject = useDeleteProject();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleBack = () => {
    navigate('/tools/projects');
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(projectId);
      setShowDeleteDialog(false);
      navigate('/tools/projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  if (isLoading) {
    return (
      <ToolLayout
        navItems={toolConfig.subPages}
        toolName="Project Control"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </ToolLayout>
    );
  }

  if (isError || !project) {
    return (
      <ToolLayout
        navItems={toolConfig.subPages}
        toolName="Project Control"
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-2xl font-semibold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The project you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout
      navItems={toolConfig.subPages}
      toolName="Project Control"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground">
                Project ID: {project.project_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleEdit}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <ProjectOverviewTab project={project} />
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Tasks management coming soon...
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            <ProjectMaterialsTab projectId={projectId} />
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <ProjectTeamTab project={project} />
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <ProjectActivityTab projectId={projectId} />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ProjectReportsTab projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Project Dialog */}
      <EditProjectDialog
        project={project}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
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
    </ToolLayout>
  );
}
