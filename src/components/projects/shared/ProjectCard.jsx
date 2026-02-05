import { useNavigate } from 'react-router-dom';
import { MoreVertical, Edit, Trash2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export function ProjectCard({ project, onEdit, onDelete }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/projects/${project.id}`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(project);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(project);
  };

  // Status badge variants
  const getStatusVariant = (status) => {
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
        return 'outline';
    }
  };

  // Priority badge colors
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Calculate progress percentage (if available)
  const progressPercentage = project.progress || 0;

  // Format due date
  const formattedDueDate = project.due_date
    ? format(new Date(project.due_date), 'MMM dd, yyyy')
    : 'No due date';

  // Check if overdue
  const isOverdue = project.due_date && new Date(project.due_date) < new Date() && project.status !== 'completed';

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{project.name}</h3>
            {project.code && (
              <p className="text-sm text-muted-foreground">{project.code}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status and Priority Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={getStatusVariant(project.status)}>
            {formatStatus(project.status)}
          </Badge>
          {project.priority && (
            <Badge
              variant="outline"
              className={getPriorityColor(project.priority)}
            >
              {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
            </Badge>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className={isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}>
            {formattedDueDate}
            {isOverdue && ' (Overdue)'}
          </span>
        </div>

        {/* Branch Info */}
        {project.branch_name && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Branch: <span className="font-medium">{project.branch_name}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
