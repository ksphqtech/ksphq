import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { MoreVertical, Edit2, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { ProjectCard } from '../ProjectCard'

// Helper function to get status badge variant
const getStatusVariant = (status) => {
  const variants = {
    planning: 'outline',
    active: 'default',
    on_hold: 'secondary',
    completed: 'default',
    cancelled: 'destructive',
  }
  return variants[status] || 'outline'
}

// Helper function to get priority badge variant
const getPriorityVariant = (priority) => {
  const variants = {
    low: 'outline',
    medium: 'secondary',
    high: 'default',
    urgent: 'destructive',
  }
  return variants[priority] || 'outline'
}

export function ProjectListView({ projects, isLoading, onEdit, onDelete }) {
  const navigate = useNavigate()

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!projects || projects.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold">No projects found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started by creating your first project.
          </p>
        </div>
      </div>
    )
  }

  const handleRowClick = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

  return (
    <>
      {/* Desktop table view */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(project.id)}
              >
                <TableCell>
                  <div className="font-medium">{project.name}</div>
                  {project.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {project.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(project.status)}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityVariant(project.priority)}>
                    {project.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {project.completion_percentage !== null &&
                  project.completion_percentage !== undefined ? (
                    <div className="flex items-center gap-2">
                      <Progress
                        value={project.completion_percentage}
                        className="w-[100px]"
                      />
                      <span className="text-sm text-muted-foreground">
                        {project.completion_percentage}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {project.due_date ? (
                    <span className="text-sm">
                      {format(new Date(project.due_date), 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(project)
                        }}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(project)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card view */}
      <div className="grid gap-4 md:hidden">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </>
  )
}
