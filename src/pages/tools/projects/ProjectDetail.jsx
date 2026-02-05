import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectApi } from '@/lib/projectApi'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useToolNavigation } from '@/hooks/useNavigation'

export function ProjectDetail() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const toolConfig = useToolNavigation('projects')

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.get(projectId),
  })

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'in progress':
        return 'default'
      case 'planning':
        return 'secondary'
      case 'completed':
        return 'outline'
      case 'on hold':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (isLoading) {
    return (
      <ToolLayout
        navItems={toolConfig.subPages}
        toolName="Project Control"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </ToolLayout>
    )
  }

  if (error || !project) {
    return (
      <ToolLayout
        navItems={toolConfig.subPages}
        toolName="Project Control"
      >
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => navigate('/tools/projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {error ? 'Failed to load project details' : 'Project not found'}
              </p>
            </CardContent>
          </Card>
        </div>
      </ToolLayout>
    )
  }

  return (
    <ToolLayout
      navItems={toolConfig.subPages}
      toolName="Project Control"
    >
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate('/tools/projects')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <Badge variant={getStatusVariant(project.status)}>
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {project.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Description
                </h3>
                <p className="text-sm">{project.description}</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Start Date
                </h3>
                <p className="text-sm">
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  End Date
                </h3>
                <p className="text-sm">
                  {project.end_date
                    ? new Date(project.end_date).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>
            </div>

            {project.branch_id && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Branch ID
                </h3>
                <p className="text-sm">{project.branch_id}</p>
              </div>
            )}

            {project.created_at && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Created
                </h3>
                <p className="text-sm">
                  {new Date(project.created_at).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  )
}
