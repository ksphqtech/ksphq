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
import { Plus, Search, Filter, X, List, LayoutGrid, Calendar } from 'lucide-react';
import { TaskList } from '../tasks/TaskList';
import { ProjectKanbanView } from '../kanban/ProjectKanbanView';
import { ProjectGanttView } from '../views/ProjectGanttView';
import { TaskDetailPanel } from '../tasks/TaskDetailPanel';
import { CreateTaskDialog } from '../dialogs/CreateTaskDialog';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

/**
 * ProjectTasksTab Component
 * Main container for task management with list and detail panel layout
 * Includes filtering, search, and task creation
 *
 * @param {string} projectId - Project ID to fetch tasks for
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
  }, []);

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
          {/* View Toggle */}
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
              Timeline
            </Button>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
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

      {/* Main Content Area - Two Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
        {/* Task View - Left Column */}
        <div
          className={cn(
            'lg:col-span-2',
            view === 'kanban' || view === 'gantt' ? 'overflow-hidden' : 'overflow-y-auto',
            showDetailPanel && 'hidden lg:block'
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

        {/* Detail Panel - Right Column */}
        {showDetailPanel && (
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

        {/* Empty State for Detail Panel */}
        {!showDetailPanel && (
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
