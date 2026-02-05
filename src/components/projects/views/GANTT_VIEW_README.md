# ProjectGanttView Component

## Overview

The `ProjectGanttView` component provides a comprehensive Gantt chart visualization for project tasks, enabling timeline management with drag-to-resize functionality, dependency visualization, and multiple view modes.

## File Location

`/src/components/projects/views/ProjectGanttView.jsx`

## Features

### Core Functionality
- **Timeline Visualization**: Displays project tasks on a timeline using the `gantt-task-react` library
- **Multiple View Modes**: Toggle between Day, Week, and Month views
- **Drag-to-Resize**: Adjust task dates by dragging task bar edges
- **Dependency Arrows**: Visual representation of task dependencies
- **Status Color Coding**: Color-coded task bars based on status
- **Double-Click to Open**: Opens task detail panel on double-click
- **Optimistic Updates**: Immediate UI feedback with API sync
- **Progress Visualization**: Shows task completion percentage

### Mobile Support
- **Simplified Read-Only View**: Mobile devices show a card-based list
- **Desktop Recommendation**: Displays message encouraging desktop use for editing
- **Responsive Design**: Automatically adapts to screen size

## Usage

### Basic Implementation

```jsx
import { ProjectGanttView } from '@/components/projects/views/ProjectGanttView';

function ProjectTasksTab({ projectId }) {
  const { data: tasksData, isLoading } = useTasks(projectId);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  const handleTaskClick = (task) => {
    setSelectedTaskId(task.id);
    setShowDetailPanel(true);
  };

  return (
    <ProjectGanttView
      tasks={tasksData?.tasks || []}
      isLoading={isLoading}
      onTaskClick={handleTaskClick}
    />
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tasks` | `Array` | Yes | Array of task objects with dates |
| `isLoading` | `boolean` | No | Loading state indicator |
| `onTaskClick` | `function` | No | Callback when task is double-clicked |

### Task Data Structure

Tasks must include the following fields for Gantt display:

```javascript
{
  id: 'task-123',
  title: 'Task Name',
  start_date: '2024-01-15',  // ISO date string (required)
  due_date: '2024-01-30',     // ISO date string (required)
  status: 'in_progress',      // 'pending' | 'in_progress' | 'blocked' | 'completed'
  priority: 'high',           // 'low' | 'medium' | 'high' | 'urgent'
  estimated_hours: 40,        // Optional: for progress calculation
  actual_hours: 20,           // Optional: for progress calculation
  assigned_user: {            // Optional: displayed in tooltip
    name: 'John Doe'
  },
  dependencies: ['task-100', 'task-101']  // Optional: array of predecessor task IDs
}
```

## Helper Functions

### transformToGanttFormat(tasks, dependencies)

Converts task objects to gantt-task-react format.

**Parameters:**
- `tasks` (Array): Array of task objects
- `dependencies` (Array): Array of dependency objects (optional)

**Returns:** Array of tasks in Gantt format

**Features:**
- Filters tasks without valid dates
- Validates date formats
- Calculates progress percentage
- Maps dependencies
- Applies status-based color coding

**Example:**

```javascript
const ganttTasks = transformToGanttFormat(tasks, dependencies);
// Returns:
// [
//   {
//     id: 'task-123',
//     name: 'Task Name',
//     start: Date object,
//     end: Date object,
//     progress: 50,
//     type: 'task',
//     dependencies: ['task-100'],
//     styles: { backgroundColor: '#3b82f6', ... },
//     _taskData: { /* original task object */ }
//   }
// ]
```

## View Modes

The component supports three view modes via `ViewMode` enum from `gantt-task-react`:

1. **Day View** (`ViewMode.Day`): Hourly granularity, 60px column width
2. **Week View** (`ViewMode.Week`): Daily granularity, 250px column width (default)
3. **Month View** (`ViewMode.Month`): Weekly granularity, 350px column width

Users can toggle between modes using the button group in the header.

## Status Colors

Tasks are color-coded based on their status:

| Status | Color | Hex Code |
|--------|-------|----------|
| Pending | Slate | `#94a3b8` |
| In Progress | Blue | `#3b82f6` |
| Blocked | Red | `#ef4444` |
| Completed | Green | `#22c55e` |

## Event Handlers

### Date Change (Drag-to-Resize)

When a user drags a task bar edge to resize:

```javascript
const handleDateChange = (task) => {
  // Extract original task data
  const originalTask = task._taskData;

  // Format dates for API
  const newStartDate = format(task.start, 'yyyy-MM-dd');
  const newDueDate = format(task.end, 'yyyy-MM-dd');

  // Optimistic update via useUpdateTask hook
  updateTaskMutation.mutate({
    taskId: originalTask.id,
    updates: { start_date: newStartDate, due_date: newDueDate }
  });
};
```

### Double-Click (Open Task Detail)

```javascript
const handleDoubleClick = (task) => {
  if (task._taskData && onTaskClick) {
    onTaskClick(task._taskData);
  }
};
```

### Progress Change

Progress is read-only and calculated from `actual_hours` / `estimated_hours`. Users must update these fields in the task detail panel.

## Dependencies

### NPM Packages
- `gantt-task-react` (v0.3.9): Gantt chart library
- `date-fns`: Date manipulation and formatting
- `lucide-react`: Icons
- `sonner`: Toast notifications

### Internal Dependencies
- `@/hooks/useTasks`: Task management hooks (useUpdateTask)
- `@/components/ui/button`: Button component
- `@/lib/utils`: Utility functions (cn)

## Integration with ProjectTasksTab

The Gantt view can be integrated into the ProjectTasksTab alongside List and Kanban views:

```jsx
import { ProjectGanttView } from '../views/ProjectGanttView';
import { Calendar } from 'lucide-react';

export function ProjectTasksTab({ projectId }) {
  const [view, setView] = useState('list'); // 'list' | 'kanban' | 'gantt'

  return (
    <div>
      {/* View Toggle */}
      <div className="flex items-center border rounded-lg p-1">
        <Button
          variant={view === 'list' ? 'secondary' : 'ghost'}
          onClick={() => setView('list')}
        >
          <List className="h-4 w-4 mr-2" />
          List
        </Button>
        <Button
          variant={view === 'kanban' ? 'secondary' : 'ghost'}
          onClick={() => setView('kanban')}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Kanban
        </Button>
        <Button
          variant={view === 'gantt' ? 'secondary' : 'ghost'}
          onClick={() => setView('gantt')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Gantt
        </Button>
      </div>

      {/* View Content */}
      {view === 'list' && <TaskList tasks={tasks} />}
      {view === 'kanban' && <ProjectKanbanView tasks={tasks} />}
      {view === 'gantt' && <ProjectGanttView tasks={tasks} onTaskClick={handleTaskSelect} />}
    </div>
  );
}
```

## Empty States

The component handles three empty states:

1. **Loading State**: Spinner with "Loading timeline..." message
2. **No Tasks**: Calendar icon with "No tasks found" message
3. **No Tasks with Dates**: Alert icon with "No tasks with dates" message and instructions

## Mobile Experience

On mobile devices (< 768px width):

1. **Information Banner**: Blue alert explaining desktop optimization
2. **Card-Based List**: Tasks displayed as interactive cards
3. **Status Indicators**: Color-coded dots for status
4. **Progress Bars**: Visual progress indicators
5. **Tap to Open**: Cards are clickable to view task details

## Tooltip

Hovering over a task bar displays a custom tooltip with:
- Task name
- Start date
- End date
- Progress percentage
- Assigned user (if available)
- "Double-click to view details" hint

## Progress Calculation

Task progress is automatically calculated:

```javascript
let progress = 0;
if (task.status === 'completed') {
  progress = 100;
} else if (task.estimated_hours && task.actual_hours) {
  progress = Math.min(100, (task.actual_hours / task.estimated_hours) * 100);
}
```

## Error Handling

- **Invalid Dates**: Tasks with invalid dates are filtered out with console warnings
- **Missing Dates**: Tasks without start_date or due_date are excluded
- **API Errors**: Handled by useUpdateTask hook with toast notifications
- **Null Safety**: All data access includes null/undefined checks

## Performance Considerations

- **useMemo**: Tasks are transformed using useMemo to prevent unnecessary recalculations
- **Dependency Extraction**: Dependencies are extracted once and memoized
- **Optimistic Updates**: UI updates immediately while API call is in progress
- **Filtered Rendering**: Only tasks with valid dates are rendered

## Styling

The component uses:
- **Tailwind CSS**: For layout and responsive design
- **Custom Colors**: Status-based color scheme
- **Gantt Library Styles**: Imported from 'gantt-task-react/dist/index.css'
- **Custom Tooltip**: Styled using Tailwind classes

## Browser Compatibility

The component works in all modern browsers that support:
- ES6+ JavaScript
- CSS Grid and Flexbox
- Date manipulation APIs

## Future Enhancements

Potential improvements:
1. Task filtering within Gantt view
2. Critical path highlighting
3. Milestone markers
4. Resource allocation view
5. Export to PDF/PNG
6. Zoom controls
7. Today marker line
8. Weekend/holiday highlighting

## Troubleshooting

### Tasks not appearing
- Ensure tasks have both `start_date` and `due_date` fields
- Check date format is ISO 8601 (YYYY-MM-DD)
- Verify dates are valid using date-fns `isValid()`

### Dependencies not showing
- Confirm `dependencies` array exists on task objects
- Verify predecessor task IDs are valid and in the task list
- Check that predecessor tasks have valid dates

### Drag not working
- Ensure component is rendered in desktop mode (>= 768px)
- Check that `useUpdateTask` hook is properly connected
- Verify user has edit permissions

## License

This component is part of the KSPHQ project and follows the project's licensing terms.
