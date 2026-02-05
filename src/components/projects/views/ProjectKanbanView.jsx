import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, parseISO } from 'date-fns';
import { useUpdateTask } from '@/hooks/useTasks';

/**
 * Column configuration for Kanban board
 * Maps to actual task statuses in database
 */
const COLUMNS = [
  {
    id: 'pending',
    title: 'To Do',
    color: 'bg-slate-100 border-slate-300',
    headerColor: 'bg-slate-50',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    color: 'bg-blue-100 border-blue-300',
    headerColor: 'bg-blue-50',
  },
  {
    id: 'blocked',
    title: 'Blocked',
    color: 'bg-red-100 border-red-300',
    headerColor: 'bg-red-50',
  },
  {
    id: 'completed',
    title: 'Done',
    color: 'bg-green-100 border-green-300',
    headerColor: 'bg-green-50',
  },
];

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
 * KanbanTaskCard - Draggable task card component
 * Uses useSortable hook for drag and drop functionality
 */
function KanbanTaskCard({ task, isDragging }) {
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
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const isOverdue =
    task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'completed';

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={cn(
          'cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md',
          isOverdue && 'border-destructive',
          isDragging && 'opacity-50'
        )}
      >
        <CardContent className="p-3 space-y-3">
          {/* Task Title */}
          <h4 className="font-semibold text-sm line-clamp-2">{task.title}</h4>

          {/* Priority Badge */}
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', priorityVariants[task.priority])}>
              {task.priority}
            </Badge>
          </div>

          {/* Task Details */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {/* Assignee Avatar */}
            <div className="flex items-center gap-1">
              {task.assigned_user ? (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assigned_user.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {getInitials(task.assigned_user.name)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs">?</span>
                </div>
              )}
            </div>

            {/* Due Date */}
            {task.due_date && (
              <div
                className={cn(
                  'flex items-center gap-1',
                  isOverdue && 'text-destructive font-medium'
                )}
              >
                <Calendar className="h-3 w-3" />
                <span>{format(parseISO(task.due_date), 'MMM d')}</span>
              </div>
            )}
          </div>

          {/* Estimated Hours */}
          {task.estimated_hours && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{task.estimated_hours}h</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * KanbanColumn - Individual column with droppable area
 * Contains a SortableContext for tasks within the column
 */
function KanbanColumn({ column, tasks, activeTaskId }) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'column', column },
  });
  const taskIds = tasks.map((task) => task.id);

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col h-full w-80 flex-shrink-0 bg-background rounded-lg border"
    >
      {/* Column Header */}
      <div className={cn('p-3 border-b rounded-t-lg', column.headerColor)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge variant="outline" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>

      {/* Column Content - Scrollable */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[200px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              isDragging={task.id === activeTaskId}
            />
          ))}
        </SortableContext>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ProjectKanbanView - Main Kanban board component
 * Displays tasks in columns based on status with drag and drop functionality
 *
 * @param {Array} tasks - Array of task objects
 * @param {boolean} isLoading - Loading state
 */
export function ProjectKanbanView({ tasks = [], isLoading }) {
  const [activeTask, setActiveTask] = useState(null);
  const updateTaskMutation = useUpdateTask();

  // Configure sensors for drag and drop
  // PointerSensor with 8px activation constraint for better touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  /**
   * Group tasks by status (column)
   */
  const tasksByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks.filter((task) => task.status === column.id);
    return acc;
  }, {});

  /**
   * Handle drag start - store the active task
   */
  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task);
  };

  /**
   * Handle drag end - update task status
   */
  const handleDragEnd = (event) => {
    const { active, over } = event;

    setActiveTask(null);

    // If no valid drop target, do nothing
    if (!over) return;

    const taskId = active.id;
    let newStatus = over.id;

    // Find the task being moved
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // If dropped on another task, get the status of that task's column
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) {
      newStatus = overTask.status;
    }

    // If dropped in the same column, do nothing
    if (task.status === newStatus) return;

    // Validate that the drop target is a valid column
    const validColumn = COLUMNS.find((col) => col.id === newStatus);
    if (!validColumn) return;

    // Optimistic update - update immediately in UI
    // The mutation will handle the actual API call and error handling
    updateTaskMutation.mutate(
      {
        taskId,
        updates: { status: newStatus },
      },
      {
        onError: (error) => {
          // Error is already handled by the mutation hook with toast
          console.error('Failed to update task status:', error);
        },
      }
    );
  };

  /**
   * Handle drag cancel
   */
  const handleDragCancel = () => {
    setActiveTask(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold">No tasks found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first task to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Kanban Board - Horizontal scrolling container */}
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        <SortableContext items={COLUMNS.map((col) => col.id)}>
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.id] || []}
              activeTaskId={activeTask?.id}
            />
          ))}
        </SortableContext>
      </div>

      {/* DragOverlay - Shows the task being dragged */}
      <DragOverlay>
        {activeTask ? (
          <div className="w-80 opacity-90">
            <KanbanTaskCard task={activeTask} isDragging={false} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
