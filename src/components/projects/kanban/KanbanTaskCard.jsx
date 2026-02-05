import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  GripVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * Priority badge styling
 */
const priorityStyles = {
  low: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  medium: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  high: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  urgent: 'bg-red-100 text-red-700 hover:bg-red-100',
};

/**
 * Status icons
 */
const statusIcons = {
  pending: Clock,
  in_progress: AlertCircle,
  blocked: AlertCircle,
  completed: CheckCircle2,
};

/**
 * KanbanTaskCard Component
 * Card representation of a task in the kanban board
 * Supports drag-and-drop functionality
 *
 * @param {Object} task - Task data
 * @param {boolean} isSelected - Whether this task is currently selected
 * @param {function} onTaskSelect - Callback when task is clicked
 * @param {boolean} isDragging - Whether this card is being dragged
 */
export function KanbanTaskCard({ task, isSelected, onTaskSelect, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const StatusIcon = statusIcons[task.status] || Clock;

  const handleClick = (e) => {
    if (onTaskSelect && !isDragging) {
      onTaskSelect(task);
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          isSelected && 'ring-2 ring-primary',
          (isSortableDragging || isDragging) && 'opacity-50',
          isDragging && 'rotate-3'
        )}
        onClick={handleClick}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button
              className="cursor-grab active:cursor-grabbing mt-1"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex-1 space-y-2">
              {/* Title */}
              <h4 className="font-medium text-sm leading-tight line-clamp-2">
                {task.title}
              </h4>

              {/* Description */}
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Priority Badge */}
                <Badge
                  variant="secondary"
                  className={cn('text-xs', priorityStyles[task.priority])}
                >
                  {task.priority}
                </Badge>

                {/* Due Date */}
                {task.due_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(task.due_date), 'MMM d')}</span>
                  </div>
                )}

                {/* Subtask Count */}
                {task.subtask_count > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>
                      {task.completed_subtasks || 0}/{task.subtask_count}
                    </span>
                  </div>
                )}
              </div>

              {/* Assigned User */}
              {task.assigned_user && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={task.assigned_user.avatar_url}
                      alt={task.assigned_user.full_name}
                    />
                    <AvatarFallback className="text-xs">
                      {task.assigned_user.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">
                    {task.assigned_user.full_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
