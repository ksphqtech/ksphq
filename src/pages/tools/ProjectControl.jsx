import { ToolLayout } from '@/components/layout/ToolLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { projectData } from '@/data/mockData'
import { useToolNavigation } from '@/hooks/useNavigation'

export function ProjectControl() {
  const toolConfig = useToolNavigation('projects')

  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
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

  const getPriorityVariant = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <ToolLayout
      navItems={toolConfig.subPages}
      toolName="Project Control"
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectData.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projectData.filter(p => p.status === 'In Progress').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projectData.filter(p => p.status === 'Completed').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(projectData.reduce((acc, p) => acc + parseInt(p.completion), 0) / projectData.length)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
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
                {projectData.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.manager}</TableCell>
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
                    <TableCell>{project.startDate}</TableCell>
                    <TableCell>{project.dueDate}</TableCell>
                    <TableCell>{project.completion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  )
}
