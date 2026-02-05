/**
 * GANTT VIEW INTEGRATION EXAMPLE
 *
 * This file demonstrates how to integrate ProjectGanttView into ProjectTasksTab
 * with List, Kanban, and Gantt view switching.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, X, List, LayoutGrid, Calendar } from 'lucide-react';
import { TaskList } from '../tasks/TaskList';
import { ProjectKanbanView } from '../views/ProjectKanbanView';
import { ProjectGanttView } from '../views/ProjectGanttView';
import { TaskDetailPanel } from '../tasks/TaskDetailPanel';
import { CreateTaskDialog } from '../dialogs/CreateTaskDialog';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

/**
 * Enhanced ProjectTasksTab with Gantt View Support
 * Includes three view modes: List, Kanban, and Gantt
 */
export function ProjectTasksTab({ projectId }) {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [view, setView] = useState('list'); // 'list', 'kanban', or 'gantt'
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigned_to: '',
    search: '',
  });

  // Set default view based on screen size
  // Gantt view is desktop-only by default
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile && (view === 'kanban' || view === 'gantt')) {
        setView('list');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [view]);

  // Fetch tasks with filters
  const { data: tasksData, isLoading } = useTasks(projectId, {
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    assigned_to: filters.assigned_to || undefined,
    search: filters.search || undefined,
  });

  const tasks = tasksData?.tasks || [];

  const handleTaskSelect = (task) => {
    setSelectedTaskId(task.id);
    setShowDetailPanel(true);
  };

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedTaskId(null);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      assigned_to: '',
      search: '',
    });
  };

  const hasActiveFilters =
    filters.status || filters.priority || filters.assigned_to || filters.search;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <h2 className="text-2xl font-bold">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            Manage project tasks and subtasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle - Including Gantt */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant={view === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('kanban')}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant={view === 'gantt' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('gantt')}
              className="h-8 px-3"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Gantt
            </Button>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Filters Bar - Hidden in Gantt view as it has its own controls */}
      {view !== 'gantt' && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select
            value={filters.priority}
            onValueChange={(value) => handleFilterChange('priority', value)}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearFilters}
              title="Clear filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Main Content Area - Two Column Layout (except Gantt which is full-width) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
        {/* Task View - Left Column or Full Width for Gantt */}
        <div
          className={cn(
            view === 'gantt' ? 'lg:col-span-3' : 'lg:col-span-2',
            view === 'kanban' || view === 'gantt' ? 'overflow-hidden' : 'overflow-y-auto',
            showDetailPanel && view !== 'gantt' && 'hidden lg:block'
          )}
        >
          {view === 'list' ? (
            <TaskList
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onTaskSelect={handleTaskSelect}
              loading={isLoading}
            />
          ) : view === 'kanban' ? (
            <ProjectKanbanView
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onTaskSelect={handleTaskSelect}
              loading={isLoading}
            />
          ) : (
            <ProjectGanttView
              tasks={tasks}
              isLoading={isLoading}
              onTaskClick={handleTaskSelect}
            />
          )}
        </div>

        {/* Detail Panel - Right Column (Hidden in Gantt view on desktop) */}
        {showDetailPanel && view !== 'gantt' && (
          <div
            className={cn(
              'lg:col-span-1 overflow-y-auto',
              'fixed inset-0 z-50 bg-background lg:static lg:z-auto'
            )}
          >
            <div className="h-full p-4 lg:p-0">
              <TaskDetailPanel
                taskId={selectedTaskId}
                onClose={handleCloseDetailPanel}
              />
            </div>
          </div>
        )}

        {/* Detail Panel for Gantt View - Opens as Modal */}
        {showDetailPanel && view === 'gantt' && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="fixed inset-4 sm:inset-auto sm:right-4 sm:top-4 sm:bottom-4 sm:w-[480px] bg-background border rounded-lg shadow-lg overflow-y-auto">
              <div className="p-4">
                <TaskDetailPanel
                  taskId={selectedTaskId}
                  onClose={handleCloseDetailPanel}
                />
              </div>
            </div>
          </div>
        )}

        {/* Empty State for Detail Panel */}
        {!showDetailPanel && view !== 'gantt' && (
          <div className="hidden lg:flex lg:col-span-1 items-center justify-center border-2 border-dashed rounded-lg p-8">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Select a task to view details
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}

/**
 * INTEGRATION NOTES:
 *
 * 1. Import the ProjectGanttView component
 * 2. Add 'gantt' as a view option in the state
 * 3. Add a Gantt button to the view toggle
 * 4. Render ProjectGanttView when view === 'gantt'
 * 5. Pass tasks, isLoading, and onTaskClick props
 * 6. Hide filters bar in Gantt view (it has its own controls)
 * 7. Make Gantt view full-width (lg:col-span-3)
 * 8. Handle task detail panel differently in Gantt view (modal overlay)
 *
 * TASK DATA REQUIREMENTS:
 *
 * For tasks to appear in the Gantt chart, they must have:
 * - start_date: ISO date string (e.g., '2024-01-15')
 * - due_date: ISO date string (e.g., '2024-01-30')
 *
 * Optional but recommended:
 * - estimated_hours: For progress calculation
 * - actual_hours: For progress calculation
 * - dependencies: Array of predecessor task IDs
 *
 * MOBILE BEHAVIOR:
 *
 * The component automatically:
 * - Shows a simplified card list on mobile
 * - Displays a message recommending desktop use
 * - Allows tapping cards to view task details
 * - Hides drag-to-resize functionality
 */
