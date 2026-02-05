import { useState, useMemo, useEffect } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { Button } from '@/components/ui/button';
import { Calendar, AlertCircle } from 'lucide-react';
import { format, parseISO, addDays, isValid } from 'date-fns';
import { useUpdateTask } from '@/hooks/useTasks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Status to color mapping for Gantt chart
 * Maps task status to visual representation
 */
const STATUS_COLORS = {
  pending: '#94a3b8', // slate-400
  in_progress: '#3b82f6', // blue-500
  blocked: '#ef4444', // red-500
  completed: '#22c55e', // green-500
};

/**
 * Transform tasks to Gantt format
 * Converts our task structure to gantt-task-react format
 *
 * @param {Array} tasks - Array of task objects
 * @param {Array} dependencies - Array of dependency objects (optional)
 * @returns {Array} Tasks in Gantt format
 */
function transformToGanttFormat(tasks = [], dependencies = []) {
  if (!tasks || tasks.length === 0) return [];

  return tasks
    .filter((task) => {
      // Only include tasks with valid dates
      return task.start_date && task.due_date;
    })
    .map((task) => {
      // Parse dates
      const startDate = parseISO(task.start_date);
      const endDate = parseISO(task.due_date);

      // Validate dates
      if (!isValid(startDate) || !isValid(endDate)) {
        console.warn(`Invalid dates for task ${task.id}:`, {
          start: task.start_date,
          end: task.due_date,
        });
        return null;
      }

      // Calculate progress percentage (0-100)
      // If status is completed, progress is 100%
      // Otherwise use estimated vs actual hours if available
      let progress = 0;
      if (task.status === 'completed') {
        progress = 100;
      } else if (task.estimated_hours && task.actual_hours) {
        progress = Math.min(100, (task.actual_hours / task.estimated_hours) * 100);
      }

      // Find dependencies for this task
      // Dependencies are tasks that this task depends on (predecessors)
      const taskDependencies = dependencies
        ?.filter((dep) => dep.successor_id === task.id)
        .map((dep) => dep.predecessor_id)
        .filter(Boolean) || [];

      return {
        id: task.id,
        name: task.title || task.name || 'Untitled Task',
        start: startDate,
        end: endDate,
        progress: Math.round(progress),
        type: 'task',
        dependencies: taskDependencies,
        styles: {
          backgroundColor: STATUS_COLORS[task.status] || STATUS_COLORS.pending,
          backgroundSelectedColor: STATUS_COLORS[task.status] || STATUS_COLORS.pending,
          progressColor: '#1e293b', // slate-800 for progress bar
          progressSelectedColor: '#1e293b',
        },
        // Store original task data for reference
        _taskData: task,
      };
    })
    .filter(Boolean); // Remove null entries
}

/**
 * ProjectGanttView Component
 * Displays project tasks on a timeline using Gantt chart
 * Supports drag-to-resize, dependencies, and multiple view modes
 *
 * @param {Array} tasks - Array of task objects
 * @param {boolean} isLoading - Loading state
 * @param {function} onTaskClick - Callback when task is clicked
 */
export function ProjectGanttView({ tasks = [], isLoading, onTaskClick }) {
  const [viewMode, setViewMode] = useState(ViewMode.Week);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const updateTaskMutation = useUpdateTask();

  // Check if mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Extract dependencies from tasks
  // Tasks have a dependencies array with predecessor task IDs
  const dependencies = useMemo(() => {
    const deps = [];
    tasks.forEach((task) => {
      if (task.dependencies && Array.isArray(task.dependencies)) {
        task.dependencies.forEach((depId) => {
          deps.push({
            predecessor_id: depId,
            successor_id: task.id,
          });
        });
      }
    });
    return deps;
  }, [tasks]);

  // Transform tasks to Gantt format
  const ganttTasks = useMemo(() => {
    return transformToGanttFormat(tasks, dependencies);
  }, [tasks, dependencies]);

  /**
   * Handle date change from drag-to-resize
   * Updates task dates with optimistic UI updates
   */
  const handleDateChange = (task) => {
    // Extract original task data
    const originalTask = task._taskData;
    if (!originalTask) return;

    // Format dates for API
    const newStartDate = format(task.start, 'yyyy-MM-dd');
    const newDueDate = format(task.end, 'yyyy-MM-dd');

    // Check if dates actually changed
    if (
      originalTask.start_date === newStartDate &&
      originalTask.due_date === newDueDate
    ) {
      return;
    }

    // Optimistic update
    updateTaskMutation.mutate(
      {
        taskId: originalTask.id,
        updates: {
          start_date: newStartDate,
          due_date: newDueDate,
        },
      },
      {
        onSuccess: () => {
          toast.success('Task dates updated successfully');
        },
        onError: (error) => {
          console.error('Failed to update task dates:', error);
          // Error toast is already shown by the mutation hook
        },
      }
    );
  };

  /**
   * Handle task double-click
   * Opens task detail panel
   */
  const handleDoubleClick = (task) => {
    if (task._taskData && onTaskClick) {
      onTaskClick(task._taskData);
    }
  };

  /**
   * Handle progress change
   * Note: We don't automatically update progress from the chart
   * as it's calculated from actual_hours/estimated_hours
   */
  const handleProgressChange = (task) => {
    // Progress is read-only in our implementation
    // It's calculated from actual_hours vs estimated_hours
    // Users should update actual_hours through the task detail panel
    toast.info('Update actual hours in task details to change progress');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading timeline...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No tasks found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create tasks with start and due dates to see them on the timeline.
          </p>
        </div>
      </div>
    );
  }

  // No tasks with dates
  if (ganttTasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No tasks with dates</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add start and due dates to tasks to display them on the timeline.
          </p>
        </div>
      </div>
    );
  }

  // Mobile view - show simplified read-only message
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Mobile Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">Desktop View Recommended</h4>
              <p className="text-sm text-blue-700 mt-1">
                Gantt chart editing is optimized for desktop. Use a larger screen to edit task dates and view dependencies.
              </p>
            </div>
          </div>
        </div>

        {/* Simplified Task List for Mobile */}
        <div className="space-y-2 overflow-y-auto flex-1">
          {ganttTasks.map((task) => (
            <div
              key={task.id}
              className="border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => handleDoubleClick(task)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{task.name}</h4>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(task.start, 'MMM d')} - {format(task.end, 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: task.styles.backgroundColor }}
                />
              </div>
              {task.progress > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{task.progress}% complete</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Desktop Gantt view
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">View:</span>
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === ViewMode.Day ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(ViewMode.Day)}
              className="h-8 px-3"
            >
              Day
            </Button>
            <Button
              variant={viewMode === ViewMode.Week ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(ViewMode.Week)}
              className="h-8 px-3"
            >
              Week
            </Button>
            <Button
              variant={viewMode === ViewMode.Month ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(ViewMode.Month)}
              className="h-8 px-3"
            >
              Month
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: STATUS_COLORS.pending }} />
            <span className="text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: STATUS_COLORS.in_progress }} />
            <span className="text-muted-foreground">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: STATUS_COLORS.blocked }} />
            <span className="text-muted-foreground">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: STATUS_COLORS.completed }} />
            <span className="text-muted-foreground">Completed</span>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-auto border rounded-lg bg-card">
        <Gantt
          tasks={ganttTasks}
          viewMode={viewMode}
          onDateChange={handleDateChange}
          onDoubleClick={handleDoubleClick}
          onProgressChange={handleProgressChange}
          listCellWidth="200px"
          columnWidth={viewMode === ViewMode.Day ? 60 : viewMode === ViewMode.Week ? 250 : 350}
          barCornerRadius={4}
          barFill={60}
          barProgressColor={STATUS_COLORS.in_progress}
          barProgressSelectedColor={STATUS_COLORS.in_progress}
          arrowColor="#64748b"
          arrowIndent={20}
          fontSize="14px"
          fontFamily="inherit"
          rowHeight={50}
          todayColor="rgba(59, 130, 246, 0.1)"
          TooltipContent={({ task }) => (
            <div className="bg-popover text-popover-foreground rounded-lg shadow-lg p-3 border max-w-sm">
              <div className="font-semibold mb-2">{task.name}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Start:</span>
                  <span>{format(task.start, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">End:</span>
                  <span>{format(task.end, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Progress:</span>
                  <span>{task.progress}%</span>
                </div>
                {task._taskData?.assigned_user && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Assigned:</span>
                    <span>{task._taskData.assigned_user.name}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Double-click to view details
              </p>
            </div>
          )}
        />
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground">
        <p>
          <strong>Tip:</strong> Drag the edges of task bars to adjust dates. Double-click a task to view details.
          Dependencies are shown as arrows between tasks.
        </p>
      </div>
    </div>
  );
}
