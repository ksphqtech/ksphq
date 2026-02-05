import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTaskCard } from './KanbanTaskCard';
import { useUpdateTask } from '@/hooks/useTasks';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * ProjectKanbanView Component
 * Kanban board view for project tasks with drag-and-drop functionality
 * Organizes tasks by status columns: Pending, In Progress, Blocked, Completed
 *
 * @param {Array} tasks - Array of tasks to display
 * @param {string} selectedTaskId - ID of currently selected task
 * @param {function} onTaskSelect - Callback when task is selected
 * @param {boolean} loading - Loading state
 */
export function ProjectKanbanView({ tasks, selectedTaskId, onTaskSelect, loading }) {
  const [activeId, setActiveId] = useState(null);
  const updateTaskMutation = useUpdateTask();

  // Define kanban columns
  const columns = [
    { id: 'pending', title: 'Pending', status: 'pending' },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress' },
    { id: 'blocked', title: 'Blocked', status: 'blocked' },
    { id: 'completed', title: 'Completed', status: 'completed' },
  ];

  // Group tasks by status (only parent tasks, no subtasks in kanban)
  const tasksByStatus = useMemo(() => {
    if (!tasks || tasks.length === 0) return {};

    // Filter out subtasks - only show parent tasks in kanban
    const parentTasks = tasks.filter((task) => !task.parent_task_id);

    return columns.reduce((acc, column) => {
      acc[column.status] = parentTasks
        .filter((task) => task.status === column.status)
        .sort((a, b) => {
          // Sort by priority first (urgent > high > medium > low)
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;

          // Then by created date (newest first)
          return new Date(b.created_at) - new Date(a.created_at);
        });
      return acc;
    }, {});
  }, [tasks]);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get the active task being dragged
  const activeTask = useMemo(() => {
    if (!activeId) return null;
    return tasks.find((task) => task.id === activeId);
  }, [activeId, tasks]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTaskId = active.id;
    const overColumnId = over.id;

    // Find the task being moved
    const task = tasks.find((t) => t.id === activeTaskId);
    if (!task) return;

    // Check if dropped on a column (not another task)
    const targetColumn = columns.find((col) => col.id === overColumnId);

    if (targetColumn && task.status !== targetColumn.status) {
      // Update task status
      updateTaskMutation.mutate({
        taskId: task.id,
        updates: {
          status: targetColumn.status,
        },
      });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <h3 className="font-semibold text-lg">No tasks yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Get started by creating your first task for this project.
            </p>
          </div>
        </CardContent>
      </Card>
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
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.status] || []}
            selectedTaskId={selectedTaskId}
            onTaskSelect={onTaskSelect}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-90">
            <KanbanTaskCard
              task={activeTask}
              isSelected={false}
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
