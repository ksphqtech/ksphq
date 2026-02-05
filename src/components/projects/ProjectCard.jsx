import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { MoreVertical, Edit2, Trash2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'

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

const getPriorityVariant = (priority) => {
  const variants = {
    low: 'outline',
    medium: 'secondary',
    high: 'default',
    urgent: 'destructive',
  }
  return variants[priority] || 'outline'
}

export function ProjectCard({ project, onEdit, onDelete }) {
  const navigate = useNavigate()

  const handleCardClick = (e) => {
    // Don't navigate if clicking on the actions dropdown
    if (e.target.closest('[data-actions-dropdown]')) {
      return
    }
    navigate(`/projects/${project.id}`)
  }

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            {project.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {project.description}
              </CardDescription>
            )}
          </div>
          <div data-actions-dropdown>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge variant={getStatusVariant(project.status)}>
            {project.status.replace('_', ' ')}
          </Badge>
          <Badge variant={getPriorityVariant(project.priority)}>
            {project.priority}
          </Badge>
        </div>
        {project.completion_percentage !== null &&
          project.completion_percentage !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.completion_percentage}%</span>
              </div>
              <Progress value={project.completion_percentage} />
            </div>
          )}
      </CardContent>
      {project.due_date && (
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Due: {format(new Date(project.due_date), 'MMM d, yyyy')}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
