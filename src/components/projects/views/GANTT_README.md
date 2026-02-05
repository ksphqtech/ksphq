# Gantt Chart Documentation

## Overview

The Gantt chart provides a visual timeline interface for managing project tasks. Built with `gantt-task-react`, it offers a powerful way to visualize task schedules, dependencies, progress tracking, and the critical path across a project timeline. This view is ideal for project managers who need to see the big picture of task relationships and project timelines.

### Key Features

- **Visual Timeline**: Display tasks on a horizontal timeline with start and end dates
- **Multiple View Modes**: Switch between Day, Week, and Month views for different planning horizons
- **Drag-to-Resize**: Adjust task duration directly on the timeline by dragging task bars
- **Task Dependencies**: Visualize relationships between tasks with dependency arrows
- **Critical Path**: Automatically highlight the critical path showing the minimum time to complete the project
- **Progress Tracking**: Visual progress bars show completion percentage for each task
- **Hierarchical Tasks**: Support for parent tasks and subtasks with collapsible groups

## Architecture

### Core Components

- **GanttView**: Main container component managing view state and data transformation
- **Gantt** (from gantt-task-react): Core chart component rendering the timeline
- **TaskListTable**: Custom table component showing task details alongside the chart
- **TooltipContent**: Custom tooltip showing task information on hover

### Technology Stack

- **gantt-task-react**: Core Gantt chart library (v0.3.9)
- **React Query**: Data fetching and caching
- **date-fns**: Date manipulation and formatting
- **Tailwind CSS**: Styling and responsive design

### Data Flow

1. **Fetching Tasks**: Tasks are fetched via React Query from the task API
2. **Data Transformation**: Tasks are transformed to match the gantt-task-react format
3. **Dependency Calculation**: Task dependencies are mapped for visualization
4. **Critical Path**: Library automatically calculates and highlights critical path
5. **User Interactions**: Drag and edit events update tasks via API
6. **Optimistic Updates**: UI updates immediately while API request processes

## How to Use the Timeline View

### Accessing the Timeline

The Gantt chart is accessible from the Projects navigation:

1. Navigate to **Project Control** tool
2. Select **Timeline** from the sidebar menu
3. Choose a specific project from the project dropdown (if applicable)

### Basic Navigation

```
Horizontal Scrolling: Click and drag the timeline or use scrollbar
Vertical Scrolling: Use mouse wheel or scrollbar to view more tasks
Zoom: Use view mode buttons (Day/Week/Month) to adjust timeline scale
```

### Reading the Chart

- **Task Bars**: Horizontal bars represent task duration from start to end date
- **Progress Bars**: Inner filled portion shows completion percentage
- **Dependency Arrows**: Lines connecting tasks show dependencies
- **Milestone Markers**: Diamond shapes indicate key project milestones
- **Today Line**: Vertical red line indicates current date

### Task Types

The Gantt chart supports three task types:

1. **Tasks**: Standard work items with start and end dates
2. **Milestones**: Key project events with a single date (displayed as diamonds)
3. **Projects**: Parent-level groupings that roll up child task dates

## View Modes

### Overview

The Gantt chart provides different zoom levels to accommodate various planning needs:

```javascript
// Available view modes
enum ViewMode {
  Hour = "Hour",           // Hourly view (rarely used)
  QuarterDay = "Quarter Day", // 6-hour intervals
  HalfDay = "Half Day",    // 12-hour intervals
  Day = "Day",             // Daily view (default)
  Week = "Week",           // Weekly view (ISO-8601 weeks)
  Month = "Month",         // Monthly view
  Year = "Year"            // Yearly view (long projects)
}
```

### Day View

**Best for**: Detailed short-term planning (1-4 weeks)

- Shows individual days as columns
- Ideal for sprint planning and daily task management
- Displays precise start/end times
- Column width: ~30-50px per day

```javascript
<Gantt
  tasks={tasks}
  viewMode={ViewMode.Day}
  columnWidth={40}
/>
```

### Week View

**Best for**: Medium-term planning (1-3 months)

- Shows weeks as columns (ISO-8601 week numbering)
- Good balance between detail and overview
- Default view for most project planning
- Column width: ~200px per week

```javascript
<Gantt
  tasks={tasks}
  viewMode={ViewMode.Week}
  columnWidth={200}
/>
```

### Month View

**Best for**: Long-term planning (3-12 months)

- Shows months as columns
- High-level overview of project timeline
- Best for executive reporting
- Column width: ~300px per month

```javascript
<Gantt
  tasks={tasks}
  viewMode={ViewMode.Month}
  columnWidth={300}
/>
```

### Switching View Modes

```jsx
function GanttView() {
  const [viewMode, setViewMode] = useState(ViewMode.Week);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button
          variant={viewMode === ViewMode.Day ? 'default' : 'outline'}
          onClick={() => setViewMode(ViewMode.Day)}
        >
          Day
        </Button>
        <Button
          variant={viewMode === ViewMode.Week ? 'default' : 'outline'}
          onClick={() => setViewMode(ViewMode.Week)}
        >
          Week
        </Button>
        <Button
          variant={viewMode === ViewMode.Month ? 'default' : 'outline'}
          onClick={() => setViewMode(ViewMode.Month)}
        >
          Month
        </Button>
      </div>
      <Gantt tasks={tasks} viewMode={viewMode} />
    </div>
  );
}
```

## Drag-to-Resize Functionality

### How It Works

The Gantt chart allows direct manipulation of task duration by dragging:

- **Drag Task Bar**: Move the entire task to different dates (shifts start and end)
- **Drag Left Handle**: Adjust start date while keeping end date fixed
- **Drag Right Handle**: Adjust end date while keeping start date fixed
- **Drag Progress**: Update task completion percentage (optional feature)

### Enabling Drag-to-Resize

```javascript
<Gantt
  tasks={tasks}
  viewMode={viewMode}
  onDateChange={handleDateChange}
  onProgressChange={handleProgressChange}
/>
```

### Date Change Handler

```javascript
const handleDateChange = async (task, children) => {
  try {
    // Validate new dates
    if (task.end < task.start) {
      toast.error('End date must be after start date');
      return false; // Prevents the change
    }

    // Update task in database
    await taskApi.update(task.id, {
      start_date: task.start.toISOString(),
      end_date: task.end.toISOString(),
    });

    // If task has children (subtasks), update them too
    if (children && children.length > 0) {
      await Promise.all(
        children.map(child =>
          taskApi.update(child.id, {
            start_date: child.start.toISOString(),
            end_date: child.end.toISOString(),
          })
        )
      );
    }

    toast.success('Task dates updated');
    return true; // Confirms the change
  } catch (error) {
    toast.error('Failed to update task dates');
    return false; // Reverts the change
  }
};
```

### Progress Change Handler

```javascript
const handleProgressChange = async (task) => {
  try {
    await taskApi.update(task.id, {
      progress: task.progress,
    });

    toast.success('Progress updated');
    return true;
  } catch (error) {
    toast.error('Failed to update progress');
    return false;
  }
};
```

### Drag Constraints

You can implement business logic to prevent certain changes:

```javascript
const handleDateChange = async (task, children) => {
  // Prevent moving completed tasks
  if (task.status === 'completed') {
    toast.error('Cannot modify completed tasks');
    return false;
  }

  // Enforce project boundaries
  if (task.start < projectStartDate || task.end > projectEndDate) {
    toast.error('Task must be within project timeline');
    return false;
  }

  // Prevent tasks from starting before their dependencies complete
  const blockedByTasks = getTaskDependencies(task.id);
  const earliestStart = Math.max(...blockedByTasks.map(t => t.end));
  if (task.start < earliestStart) {
    toast.error('Task cannot start before dependencies are complete');
    return false;
  }

  // Proceed with update
  return updateTask(task);
};
```

## Dependencies and Critical Path

### Understanding Task Dependencies

Dependencies define the order in which tasks must be completed:

- **Finish-to-Start (FS)**: Most common - Task B cannot start until Task A finishes
- **Visual Arrows**: Lines drawn from predecessor to successor tasks
- **Cascading Changes**: Moving a task can affect dependent tasks

### Adding Dependencies

Dependencies are managed through the task API:

```javascript
// Add a dependency
await taskApi.addDependency(taskId, dependsOnTaskId);

// Remove a dependency
await taskApi.removeDependency(taskId, dependsOnTaskId);
```

### Data Structure

```javascript
const task = {
  id: 'task-123',
  name: 'Design Homepage',
  start: new Date('2026-02-01'),
  end: new Date('2026-02-07'),
  progress: 75,
  type: 'task',
  dependencies: ['task-100', 'task-101'], // IDs of tasks this depends on
};
```

### Critical Path

The critical path is automatically calculated and highlighted by the library:

- **Definition**: Sequence of tasks that determines minimum project duration
- **Visualization**: Tasks on critical path are typically highlighted in red/orange
- **Importance**: Delays in critical path tasks delay the entire project
- **Non-Critical Tasks**: Have slack time and can be delayed without affecting project end date

```javascript
<Gantt
  tasks={tasks}
  // Critical path is automatically shown with special styling
  barBackgroundColor="#e0e0e0"           // Non-critical tasks
  barBackgroundSelectedColor="#c0c0c0"
  projectBackgroundColor="#ff6b6b"       // Critical path tasks
  projectBackgroundSelectedColor="#ff5252"
/>
```

### Managing Dependencies in UI

```jsx
function TaskDependencyManager({ task, allTasks }) {
  const { mutate: addDependency } = useAddDependency();
  const { mutate: removeDependency } = useRemoveDependency();

  const availableDependencies = allTasks.filter(
    t => t.id !== task.id && !task.dependencies?.includes(t.id)
  );

  return (
    <div>
      <h4>Dependencies</h4>
      <div className="space-y-2">
        {task.dependencies?.map(depId => {
          const depTask = allTasks.find(t => t.id === depId);
          return (
            <div key={depId} className="flex items-center gap-2">
              <span>{depTask?.name}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeDependency({ taskId: task.id, dependsOnTaskId: depId })}
              >
                Remove
              </Button>
            </div>
          );
        })}
      </div>

      <Select onValueChange={(depId) => addDependency({ taskId: task.id, dependsOnTaskId: depId })}>
        <SelectTrigger>
          <SelectValue placeholder="Add dependency" />
        </SelectTrigger>
        <SelectContent>
          {availableDependencies.map(t => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

## Mobile Limitations

### Touch Device Challenges

The Gantt chart library has limited mobile support due to:

1. **Complex Interactions**: Drag-and-drop gestures conflict with scrolling
2. **Screen Space**: Timeline requires horizontal space not available on mobile
3. **Precision**: Touch targets too small for precise date manipulation
4. **Performance**: Rendering large datasets impacts mobile performance

### Recommended Mobile Alternative

For mobile devices, redirect users to the List or Kanban view:

```javascript
function ResponsiveProjectView({ projectId }) {
  const [view, setView] = useState('list');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Force list view on mobile if gantt was selected
      if (mobile && view === 'gantt') {
        setView('list');
        toast.info('Gantt view is not available on mobile. Showing list view.');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [view]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={() => setView('list')}>List</Button>
        <Button onClick={() => setView('kanban')}>Kanban</Button>
        {!isMobile && (
          <Button onClick={() => setView('gantt')}>Timeline</Button>
        )}
      </div>

      {view === 'list' && <TaskList projectId={projectId} />}
      {view === 'kanban' && <ProjectKanbanView projectId={projectId} />}
      {view === 'gantt' && !isMobile && <GanttView projectId={projectId} />}
    </div>
  );
}
```

### Mobile-Friendly Features

If you must support mobile, consider these adaptations:

```javascript
const mobileGanttConfig = {
  // Larger column width for easier touch targets
  columnWidth: isMobile ? 80 : 40,

  // Disable drag interactions on mobile
  onDateChange: isMobile ? undefined : handleDateChange,
  onProgressChange: isMobile ? undefined : handleProgressChange,

  // Start in month view for better overview
  viewMode: isMobile ? ViewMode.Month : ViewMode.Week,

  // Simplify task list on mobile
  listCellWidth: isMobile ? '100px' : '155px',
};
```

### Warning Message

Display a clear message to mobile users:

```jsx
{isMobile && view === 'gantt' && (
  <Alert variant="warning" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Limited Mobile Support</AlertTitle>
    <AlertDescription>
      The timeline view has limited functionality on mobile devices.
      For the best experience, use a desktop computer or switch to List view.
    </AlertDescription>
  </Alert>
)}
```

## Performance Tips for Large Projects

### Virtualization

For projects with 100+ tasks, implement virtualization:

```javascript
import { useVirtualizer } from '@tanstack/react-virtual';

function OptimizedGanttView({ tasks }) {
  const parentRef = useRef(null);

  // Only render visible tasks
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Row height
    overscan: 10, // Render extra rows for smooth scrolling
  });

  const virtualTasks = virtualizer
    .getVirtualItems()
    .map(virtualRow => tasks[virtualRow.index]);

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <Gantt tasks={virtualTasks} />
    </div>
  );
}
```

### Pagination and Filtering

Break large project timelines into manageable chunks:

```javascript
function PaginatedGanttView({ projectId }) {
  const [filters, setFilters] = useState({
    status: '',
    dateRange: 'this_month',
    assignedTo: '',
  });

  const { data: tasksData } = useTasks(projectId, filters);

  // Filter tasks by date range
  const filteredTasks = useMemo(() => {
    if (filters.dateRange === 'this_month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      return tasksData?.tasks.filter(
        task => task.start >= startOfMonth && task.end <= endOfMonth
      );
    }
    return tasksData?.tasks || [];
  }, [tasksData, filters.dateRange]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Select
          value={filters.dateRange}
          onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="next_month">Next Month</SelectItem>
            <SelectItem value="this_quarter">This Quarter</SelectItem>
            <SelectItem value="all">All Tasks</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Gantt tasks={filteredTasks} />

      <div className="mt-2 text-sm text-muted-foreground">
        Showing {filteredTasks.length} of {tasksData?.tasks.length} tasks
      </div>
    </div>
  );
}
```

### Lazy Loading

Load task details on demand:

```javascript
function LazyGanttView({ projectId }) {
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  // Only fetch basic task info initially
  const { data: basicTasks } = useQuery({
    queryKey: ['tasks', projectId, 'basic'],
    queryFn: () => taskApi.list({
      project_id: projectId,
      fields: 'id,name,start_date,end_date,progress' // Minimal fields
    }),
  });

  // Fetch full details only for expanded tasks
  const { data: detailedTasks } = useQuery({
    queryKey: ['tasks', projectId, 'detailed', Array.from(expandedTasks)],
    queryFn: () => Promise.all(
      Array.from(expandedTasks).map(taskId => taskApi.get(taskId))
    ),
    enabled: expandedTasks.size > 0,
  });

  const handleExpanderClick = (task) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(task.id)) {
        next.delete(task.id);
      } else {
        next.add(task.id);
      }
      return next;
    });
  };

  return (
    <Gantt
      tasks={basicTasks?.tasks || []}
      onExpanderClick={handleExpanderClick}
    />
  );
}
```

### Memoization

Prevent unnecessary recalculations:

```javascript
function GanttView({ projectId }) {
  const { data: tasksData } = useTasks(projectId);

  // Transform data only when tasks change
  const ganttTasks = useMemo(() => {
    return transformToGanttFormat(tasksData?.tasks || []);
  }, [tasksData?.tasks]);

  // Memoize event handlers
  const handleDateChange = useCallback(async (task, children) => {
    // Handler logic
  }, []);

  const handleProgressChange = useCallback(async (task) => {
    // Handler logic
  }, []);

  return (
    <Gantt
      tasks={ganttTasks}
      onDateChange={handleDateChange}
      onProgressChange={handleProgressChange}
    />
  );
}
```

### Debounced Updates

Prevent API spam during drag operations:

```javascript
import { useDebouncedCallback } from 'use-debounce';

function GanttView() {
  const [localTasks, setLocalTasks] = useState([]);
  const { mutate: updateTask } = useUpdateTask();

  // Update local state immediately
  const handleDateChange = (task, children) => {
    setLocalTasks(prev =>
      prev.map(t => t.id === task.id ? { ...t, start: task.start, end: task.end } : t)
    );

    // Debounce API call
    debouncedUpdate(task, children);

    return true; // Accept change immediately for better UX
  };

  // Only update API after user stops dragging for 500ms
  const debouncedUpdate = useDebouncedCallback(async (task, children) => {
    try {
      await updateTask({
        taskId: task.id,
        updates: {
          start_date: task.start.toISOString(),
          end_date: task.end.toISOString(),
        },
      });
    } catch (error) {
      // Revert on error
      setLocalTasks(prev => {
        // Restore original state
      });
    }
  }, 500);

  return <Gantt tasks={localTasks} onDateChange={handleDateChange} />;
}
```

### Progress Indicators

Show loading states for better UX:

```javascript
function GanttView({ projectId }) {
  const { data, isLoading, isFetching } = useTasks(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="space-y-2 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isFetching && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-md border">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span className="text-xs">Updating...</span>
          </div>
        </div>
      )}
      <Gantt tasks={data?.tasks || []} />
    </div>
  );
}
```

## Customization Options

### Styling

Customize colors to match your brand:

```javascript
<Gantt
  tasks={tasks}

  // Header styling
  headerHeight={50}
  fontFamily="Inter, system-ui, sans-serif"
  fontSize="14px"

  // Column widths
  columnWidth={60}
  listCellWidth="155px"

  // Row styling
  rowHeight={45}

  // Bar styling
  barCornerRadius={4}
  barFill={75}  // Bar takes up 75% of row height
  handleWidth={8}  // Drag handle width

  // Task bar colors
  barBackgroundColor="hsl(var(--primary))"
  barBackgroundSelectedColor="hsl(var(--primary) / 0.8)"
  barProgressColor="hsl(var(--primary-foreground))"
  barProgressSelectedColor="hsl(var(--primary-foreground) / 0.9)"

  // Project (parent task) colors
  projectBackgroundColor="hsl(var(--secondary))"
  projectBackgroundSelectedColor="hsl(var(--secondary) / 0.8)"
  projectProgressColor="hsl(var(--secondary-foreground))"
  projectProgressSelectedColor="hsl(var(--secondary-foreground) / 0.9)"

  // Milestone colors
  milestoneBackgroundColor="hsl(var(--accent))"
  milestoneBackgroundSelectedColor="hsl(var(--accent) / 0.8)"

  // Dependency arrow colors
  arrowColor="hsl(var(--muted-foreground))"
  arrowIndent={15}

  // Today marker
  todayColor="rgba(239, 68, 68, 0.5)"  // Red line
/>
```

### Custom Task Colors

Apply colors based on task properties:

```javascript
const transformToGanttFormat = (tasks) => {
  return tasks.map(task => ({
    id: task.id,
    name: task.title,
    start: new Date(task.start_date),
    end: new Date(task.end_date),
    progress: task.progress || 0,
    type: task.parent_task_id ? 'task' : 'project',
    dependencies: task.dependencies?.map(d => d.depends_on_task_id) || [],

    // Custom colors based on priority
    styles: {
      backgroundColor: getPriorityColor(task.priority),
      backgroundSelectedColor: getPriorityColor(task.priority, 0.8),
      progressColor: getProgressColor(task.priority),
      progressSelectedColor: getProgressColor(task.priority, 0.9),
    },
  }));
};

const getPriorityColor = (priority, opacity = 1) => {
  const colors = {
    urgent: `rgba(239, 68, 68, ${opacity})`,   // Red
    high: `rgba(249, 115, 22, ${opacity})`,    // Orange
    medium: `rgba(59, 130, 246, ${opacity})`,  // Blue
    low: `rgba(156, 163, 175, ${opacity})`,    // Gray
  };
  return colors[priority?.toLowerCase()] || colors.medium;
};

const getProgressColor = (priority, opacity = 1) => {
  return priority === 'urgent' ? `rgba(255, 255, 255, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;
};
```

### Custom Tooltip

Create a custom tooltip component:

```jsx
function CustomTooltip({ task, fontSize, fontFamily }) {
  return (
    <div
      className="bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border"
      style={{ fontSize, fontFamily }}
    >
      <div className="space-y-2">
        <div>
          <h4 className="font-semibold">{task.name}</h4>
          <Badge variant={getStatusVariant(task.status)} className="mt-1">
            {task.status}
          </Badge>
        </div>

        <Separator />

        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Start:</span>
            <span>{format(task.start, 'PP')}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">End:</span>
            <span>{format(task.end, 'PP')}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Duration:</span>
            <span>{differenceInDays(task.end, task.start)} days</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Progress:</span>
            <span>{task.progress}%</span>
          </div>
        </div>

        {task.assigned_user && (
          <>
            <Separator />
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{task.assigned_user.name}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Usage
<Gantt
  tasks={tasks}
  TooltipContent={CustomTooltip}
/>
```

### Custom Task List

Create a custom task list table:

```jsx
function CustomTaskListTable({
  rowHeight,
  rowWidth,
  fontFamily,
  fontSize,
  locale,
  tasks,
  selectedTaskId,
  setSelectedTask,
  onExpanderClick,
}) {
  return (
    <div className="border-r" style={{ fontFamily, fontSize }}>
      {/* Header */}
      <div
        className="flex items-center border-b bg-muted font-semibold"
        style={{ height: rowHeight }}
      >
        <div className="flex-1 px-4">Task Name</div>
        <div className="w-24 px-4">Progress</div>
        <div className="w-32 px-4">Assigned To</div>
      </div>

      {/* Task Rows */}
      {tasks.map(task => (
        <div
          key={task.id}
          className={cn(
            'flex items-center border-b hover:bg-accent cursor-pointer',
            selectedTaskId === task.id && 'bg-accent'
          )}
          style={{ height: rowHeight, width: rowWidth }}
          onClick={() => setSelectedTask(task.id)}
        >
          {/* Expander for parent tasks */}
          <div className="w-8 flex items-center justify-center">
            {task.type === 'project' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpanderClick(task);
                }}
              >
                {task.hideChildren ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* Task Name */}
          <div className="flex-1 px-4 truncate">
            {task.name}
          </div>

          {/* Progress */}
          <div className="w-24 px-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <span className="text-xs">{task.progress}%</span>
            </div>
          </div>

          {/* Assigned To */}
          <div className="w-32 px-4 truncate text-sm text-muted-foreground">
            {task.assigned_user?.name || 'Unassigned'}
          </div>
        </div>
      ))}
    </div>
  );
}

// Usage
<Gantt
  tasks={tasks}
  TaskListTable={CustomTaskListTable}
/>
```

### Localization

Support different languages and date formats:

```javascript
import { enUS, es, fr, de } from 'date-fns/locale';

const localeMap = {
  'en-US': enUS,
  'es': es,
  'fr': fr,
  'de': de,
};

function LocalizedGanttView({ projectId, locale = 'en-US' }) {
  const { data } = useTasks(projectId);

  return (
    <Gantt
      tasks={data?.tasks || []}
      locale={locale}
      // Library uses date-fns internally
      // Dates will be formatted according to locale
    />
  );
}
```

## Integration with Task Management

### Complete Implementation Example

```jsx
import { useState, useMemo, useCallback } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { useTasks, useUpdateTask } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function GanttView({ projectId }) {
  const [viewMode, setViewMode] = useState(ViewMode.Week);
  const { data: tasksData, isLoading } = useTasks(projectId);
  const { mutate: updateTask } = useUpdateTask();

  // Transform tasks to Gantt format
  const ganttTasks = useMemo(() => {
    if (!tasksData?.tasks) return [];

    return tasksData.tasks.map(task => ({
      id: task.id,
      name: task.title,
      start: new Date(task.start_date),
      end: new Date(task.end_date || task.start_date),
      progress: calculateProgress(task),
      type: task.parent_task_id ? 'task' : 'project',
      dependencies: task.dependencies?.map(d => d.depends_on_task_id) || [],
      project: task.parent_task_id,
      isDisabled: task.status === 'completed',
      styles: getTaskStyles(task),
      // Store original task data for reference
      _originalTask: task,
    }));
  }, [tasksData]);

  // Handle date changes
  const handleDateChange = useCallback(async (task, children) => {
    try {
      // Validate dates
      if (task.end < task.start) {
        toast.error('End date must be after start date');
        return false;
      }

      // Update task
      await updateTask({
        taskId: task.id,
        updates: {
          start_date: task.start.toISOString(),
          end_date: task.end.toISOString(),
        },
      });

      // Update children if any
      if (children?.length > 0) {
        await Promise.all(
          children.map(child =>
            updateTask({
              taskId: child.id,
              updates: {
                start_date: child.start.toISOString(),
                end_date: child.end.toISOString(),
              },
            })
          )
        );
      }

      return true;
    } catch (error) {
      toast.error('Failed to update task dates');
      return false;
    }
  }, [updateTask]);

  // Handle progress changes
  const handleProgressChange = useCallback(async (task) => {
    try {
      await updateTask({
        taskId: task.id,
        updates: { progress: task.progress },
      });
      return true;
    } catch (error) {
      toast.error('Failed to update progress');
      return false;
    }
  }, [updateTask]);

  // Handle task selection
  const handleTaskClick = useCallback((task) => {
    // Open task detail panel or dialog
    console.log('Task clicked:', task);
  }, []);

  if (isLoading) {
    return <div>Loading timeline...</div>;
  }

  if (!ganttTasks.length) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-muted-foreground">No tasks to display</p>
        <Button>Create First Task</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === ViewMode.Day ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(ViewMode.Day)}
          >
            Day
          </Button>
          <Button
            variant={viewMode === ViewMode.Week ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(ViewMode.Week)}
          >
            Week
          </Button>
          <Button
            variant={viewMode === ViewMode.Month ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(ViewMode.Month)}
          >
            Month
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {ganttTasks.length} tasks
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="border rounded-lg overflow-hidden">
        <Gantt
          tasks={ganttTasks}
          viewMode={viewMode}
          onDateChange={handleDateChange}
          onProgressChange={handleProgressChange}
          onClick={handleTaskClick}
          columnWidth={viewMode === ViewMode.Month ? 300 : viewMode === ViewMode.Week ? 200 : 60}
          listCellWidth="200px"
          rowHeight={45}
          barCornerRadius={4}
          barFill={75}
          locale="en-US"
        />
      </div>
    </div>
  );
}

// Helper functions
function calculateProgress(task) {
  if (task.progress !== undefined && task.progress !== null) {
    return task.progress;
  }
  if (task.status === 'completed') return 100;
  if (task.status === 'in_progress') return 50;
  return 0;
}

function getTaskStyles(task) {
  // Custom styling based on task properties
  const priorityColors = {
    urgent: { backgroundColor: '#ef4444', progressColor: '#ffffff' },
    high: { backgroundColor: '#f97316', progressColor: '#ffffff' },
    medium: { backgroundColor: '#3b82f6', progressColor: '#ffffff' },
    low: { backgroundColor: '#9ca3af', progressColor: '#ffffff' },
  };

  return priorityColors[task.priority?.toLowerCase()] || priorityColors.medium;
}
```

### Syncing with List and Kanban Views

Ensure data consistency across different views:

```javascript
// In ProjectTasksTab component
function ProjectTasksTab({ projectId }) {
  const [view, setView] = useState('list'); // 'list', 'kanban', 'gantt'
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Shared data fetching
  const { data: tasksData } = useTasks(projectId);

  // Shared handlers
  const handleTaskSelect = (taskId) => {
    setSelectedTaskId(taskId);
  };

  return (
    <div className="space-y-4">
      {/* View Switcher */}
      <div className="flex gap-2">
        <Button onClick={() => setView('list')}>List</Button>
        <Button onClick={() => setView('kanban')}>Kanban</Button>
        <Button onClick={() => setView('gantt')}>Timeline</Button>
      </div>

      {/* Render appropriate view */}
      {view === 'list' && (
        <TaskList
          tasks={tasksData?.tasks}
          selectedTaskId={selectedTaskId}
          onTaskSelect={handleTaskSelect}
        />
      )}
      {view === 'kanban' && (
        <ProjectKanbanView
          tasks={tasksData?.tasks}
          selectedTaskId={selectedTaskId}
          onTaskSelect={handleTaskSelect}
        />
      )}
      {view === 'gantt' && (
        <GanttView
          tasks={tasksData?.tasks}
          selectedTaskId={selectedTaskId}
          onTaskSelect={handleTaskSelect}
        />
      )}
    </div>
  );
}
```

## Developer Notes

### Extending the Component

#### Adding New Task Types

```javascript
// 1. Define new task type
const TASK_TYPES = {
  TASK: 'task',
  MILESTONE: 'milestone',
  PROJECT: 'project',
  PHASE: 'phase', // New type
};

// 2. Update transformation logic
const transformToGanttFormat = (tasks) => {
  return tasks.map(task => ({
    id: task.id,
    name: task.title,
    start: new Date(task.start_date),
    end: new Date(task.end_date),
    type: getTaskType(task),
    // ...
  }));
};

function getTaskType(task) {
  if (task.is_milestone) return TASK_TYPES.MILESTONE;
  if (task.is_phase) return TASK_TYPES.PHASE;
  if (!task.parent_task_id) return TASK_TYPES.PROJECT;
  return TASK_TYPES.TASK;
}

// 3. Add custom styling for new type
const getTaskStyles = (task) => {
  if (task.is_phase) {
    return {
      backgroundColor: '#8b5cf6',
      progressColor: '#ffffff',
    };
  }
  // ...
};
```

#### Custom Event Handlers

```javascript
// Add custom event handlers
<Gantt
  tasks={tasks}

  // Double-click to edit
  onDoubleClick={(task) => {
    openEditDialog(task);
  }}

  // Select task
  onSelect={(task, isSelected) => {
    if (isSelected) {
      setSelectedTaskId(task.id);
    } else {
      setSelectedTaskId(null);
    }
  }}

  // Delete task (if keyboard delete is pressed)
  onDelete={async (task) => {
    const confirmed = await confirm('Delete this task?');
    if (confirmed) {
      await taskApi.delete(task.id);
      return true;
    }
    return false;
  }}

  // Expand/collapse parent tasks
  onExpanderClick={(task) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(task.id)) {
        next.delete(task.id);
      } else {
        next.add(task.id);
      }
      return next;
    });
  }}
/>
```

#### State Management Integration

```javascript
// With Redux
import { useDispatch, useSelector } from 'react-redux';
import { updateTask, selectTasks } from '@/store/tasksSlice';

function GanttView({ projectId }) {
  const dispatch = useDispatch();
  const tasks = useSelector(state => selectTasks(state, projectId));

  const handleDateChange = async (task) => {
    dispatch(updateTask({
      id: task.id,
      start_date: task.start,
      end_date: task.end,
    }));
  };

  return <Gantt tasks={transformTasks(tasks)} onDateChange={handleDateChange} />;
}

// With Zustand
import { useTaskStore } from '@/store/taskStore';

function GanttView({ projectId }) {
  const tasks = useTaskStore(state => state.getProjectTasks(projectId));
  const updateTask = useTaskStore(state => state.updateTask);

  const handleDateChange = async (task) => {
    updateTask(task.id, {
      start_date: task.start,
      end_date: task.end,
    });
  };

  return <Gantt tasks={tasks} onDateChange={handleDateChange} />;
}
```

### API Integration

The Gantt chart integrates with the existing task API:

**Endpoints Used:**
- `GET /api/tasks?project_id=<id>` - Fetch tasks
- `PATCH /api/tasks/:id` - Update task dates/progress
- `POST /api/tasks/:id/dependencies` - Add dependency
- `DELETE /api/tasks/:id/dependencies/:depId` - Remove dependency

**Task Data Format:**
```typescript
interface Task {
  id: string;
  project_id: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'blocked' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  assigned_user?: {
    id: string;
    name: string;
    email: string;
  };
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
  due_date?: string; // ISO 8601
  progress?: number; // 0-100
  dependencies?: Array<{
    task_id: string;
    depends_on_task_id: string;
  }>;
  created_at: string;
  updated_at: string;
}
```

### Testing

```javascript
// Example test suite
describe('GanttView', () => {
  it('renders tasks correctly', () => {
    const tasks = [
      {
        id: '1',
        title: 'Task 1',
        start_date: '2026-02-01',
        end_date: '2026-02-07',
        progress: 50,
      },
    ];

    render(<GanttView tasks={tasks} />);
    expect(screen.getByText('Task 1')).toBeInTheDocument();
  });

  it('handles date changes', async () => {
    const mockUpdateTask = jest.fn();
    const { user } = render(<GanttView onDateChange={mockUpdateTask} />);

    // Drag task bar
    const taskBar = screen.getByTestId('task-bar-1');
    await user.drag(taskBar, { delta: { x: 100, y: 0 } });

    expect(mockUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1' }),
      expect.any(Array)
    );
  });

  it('respects disabled state', () => {
    const tasks = [
      {
        id: '1',
        title: 'Completed Task',
        start_date: '2026-02-01',
        end_date: '2026-02-07',
        isDisabled: true,
      },
    ];

    render(<GanttView tasks={tasks} />);
    const taskBar = screen.getByTestId('task-bar-1');
    expect(taskBar).toHaveAttribute('data-disabled', 'true');
  });
});
```

### Common Issues and Solutions

**Issue: Tasks not rendering**
```javascript
// Ensure all required fields are present
const task = {
  id: 'unique-id', // Required
  name: 'Task Name', // Required
  start: new Date(), // Required (Date object, not string)
  end: new Date(), // Required (Date object, not string)
  progress: 0, // Required (0-100)
  type: 'task', // Required ('task', 'milestone', or 'project')
};
```

**Issue: Dependencies not showing**
```javascript
// Dependencies must reference existing task IDs
const task1 = { id: 'task-1', name: 'Task 1', /* ... */ };
const task2 = {
  id: 'task-2',
  name: 'Task 2',
  dependencies: ['task-1'], // Must be array of existing IDs
  // ...
};
```

**Issue: Drag operations not working**
```javascript
// Ensure handlers return true/false or Promise<boolean>
const handleDateChange = async (task) => {
  try {
    await updateTask(task);
    return true; // Accept change
  } catch {
    return false; // Reject change
  }
};
```

## Related Files

- **Task Components**: `/src/components/projects/tasks/`
- **Task API**: `/src/lib/taskApi.js`
- **Task Hooks**: `/src/hooks/useTasks.js`
- **Project Detail**: `/src/pages/tools/projects/ProjectDetail.jsx`
- **Kanban View**: `/src/components/projects/views/ProjectKanbanView.jsx`
- **List View**: `/src/components/projects/views/ProjectListView.jsx`

## Resources

- [gantt-task-react Documentation](https://github.com/MaTeMaTuK/gantt-task-react)
- [gantt-task-react Examples](https://github.com/MaTeMaTuK/gantt-task-react/tree/main/example)
- [React Query Documentation](https://tanstack.com/query/latest)
- [date-fns Documentation](https://date-fns.org/)
- [Project Management Best Practices](https://www.pmi.org/)

## Contributing

When extending the Gantt chart feature:

1. **Follow existing patterns**: Use the same data transformation approach
2. **Maintain type safety**: Update TypeScript types if using TypeScript
3. **Test thoroughly**: Ensure drag operations work correctly
4. **Document changes**: Update this README with new features
5. **Consider performance**: Test with 100+ tasks
6. **Mobile compatibility**: Ensure graceful degradation on mobile

---

**Last Updated**: 2026-02-05
**Version**: 1.0.0
**Maintainer**: Project Control Team
