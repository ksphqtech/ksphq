import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, AlertCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, parseISO } from 'date-fns';

/**
 * Status badge variants
 */
const statusVariants = {
  pending: 'bg-gray-100 text-gray-800 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  blocked: 'bg-red-100 text-red-800 border-red-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
};

/**
 * Priority badge variants
 */
const priorityVariants = {
  low: 'bg-slate-100 text-slate-700 border-slate-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  urgent: 'bg-red-100 text-red-800 border-red-300',
};

/**
 * Get initials from name
 */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Calculate task progress based on checklist completion
 */
function calculateProgress(task) {
  if (!task.checklist || task.checklist.length === 0) {
    return task.status === 'completed' ? 100 : 0;
  }

  const completed = task.checklist.filter((item) => item.completed).length;
  return Math.round((completed / task.checklist.length) * 100);
}

/**
 * TaskCard Component
 * Displays a single task with status, priority, assignee, due date, and progress
 * Supports nested rendering for subtasks
 *
 * @param {Object} task - Task object
 * @param {boolean} isSelected - Whether the task is currently selected
 * @param {function} onClick - Click handler to select task
 * @param {boolean} isExpanded - Whether subtasks are expanded
 * @param {function} onToggleExpand - Handler to toggle subtask expansion
 * @param {Array} children - Subtask components
 * @param {number} level - Nesting level for indentation
 */
export function TaskCard({
  task,
  isSelected,
  onClick,
  isExpanded,
  onToggleExpand,
  children,
  level = 0,
}) {
  const hasSubtasks = children && children.length > 0;
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'completed';
  const progress = calculateProgress(task);

  return (
    <div className="space-y-2" style={{ marginLeft: `${level * 1.5}rem` }}>
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          isSelected && 'ring-2 ring-primary',
          isOverdue && 'border-destructive'
        )}
        onClick={() => onClick(task)}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {hasSubtasks && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand(task.id);
                    }}
                    className="shrink-0 hover:bg-accent rounded p-1"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}
                <h3 className="font-semibold text-sm truncate flex-1">
                  {task.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge className={cn('text-xs', statusVariants[task.status])}>
                  {task.status.replace('_', ' ')}
                </Badge>
                <Badge className={cn('text-xs', priorityVariants[task.priority])}>
                  {task.priority}
                </Badge>
              </div>
            </div>

            {/* Task Details Row */}
            <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                {/* Assigned User */}
                {task.assigned_user && (
                  <div className="flex items-center gap-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.assigned_user.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getInitials(task.assigned_user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{task.assigned_user.name}</span>
                  </div>
                )}

                {/* Due Date */}
                {task.due_date && (
                  <div
                    className={cn(
                      'flex items-center gap-1',
                      isOverdue && 'text-destructive font-medium'
                    )}
                  >
                    {isOverdue && <AlertCircle className="h-3 w-3" />}
                    <Calendar className="h-3 w-3" />
                    <span>{format(parseISO(task.due_date), 'MMM d, yyyy')}</span>
                  </div>
                )}

                {/* Estimated Hours */}
                {task.estimated_hours && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{task.estimated_hours}h</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {progress > 0 && (
                <div className="flex items-center gap-2 min-w-[100px]">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{progress}%</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render Subtasks */}
      {hasSubtasks && isExpanded && (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
