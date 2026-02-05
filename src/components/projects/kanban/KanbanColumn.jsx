import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanTaskCard } from './KanbanTaskCard';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Status badge colors
 */
const statusColors = {
  pending: 'bg-gray-100 text-gray-700 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
  blocked: 'bg-red-100 text-red-700 border-red-300',
  completed: 'bg-green-100 text-green-700 border-green-300',
};

/**
 * KanbanColumn Component
 * A column in the kanban board representing a task status
 * Supports drag-and-drop for task reordering and status changes
 *
 * @param {Object} column - Column configuration (id, title, status)
 * @param {Array} tasks - Tasks in this column
 * @param {string} selectedTaskId - Currently selected task ID
 * @param {function} onTaskSelect - Callback when task is clicked
 */
export function KanbanColumn({ column, tasks, selectedTaskId, onTaskSelect }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const taskIds = tasks.map((task) => task.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[300px] w-[300px] h-full',
        isOver && 'opacity-50'
      )}
    >
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{column.title}</h3>
            <span
              className={cn(
                'px-2 py-1 rounded-full text-xs font-medium border',
                statusColors[column.status]
              )}
            >
              {tasks.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-2">
          <SortableContext
            items={taskIds}
            strategy={verticalListSortingStrategy}
          >
            {tasks.length === 0 ? (
              <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Drop tasks here
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <KanbanTaskCard
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskId === task.id}
                  onTaskSelect={onTaskSelect}
                />
              ))
            )}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}
