# ProjectGanttView - Quick Reference

## File Location
`/src/components/projects/views/ProjectGanttView.jsx`

## Basic Usage

```jsx
import { ProjectGanttView } from '@/components/projects/views/ProjectGanttView';

<ProjectGanttView
  tasks={tasks}
  isLoading={isLoading}
  onTaskClick={handleTaskClick}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `tasks` | Array | Array of task objects (required) |
| `isLoading` | boolean | Loading state |
| `onTaskClick` | function | Callback for task double-click |

## Task Requirements

**Required fields:**
- `id` - Unique identifier
- `title` or `name` - Task name
- `start_date` - ISO date string (YYYY-MM-DD)
- `due_date` - ISO date string (YYYY-MM-DD)
- `status` - One of: pending, in_progress, blocked, completed

**Optional fields:**
- `estimated_hours` - For progress calculation
- `actual_hours` - For progress calculation
- `dependencies` - Array of predecessor task IDs
- `assigned_user.name` - For tooltip display

## Features

### View Modes
- **Day** - Hourly view
- **Week** - Daily view (default)
- **Month** - Weekly view

### Interactions
- **Drag edges** - Resize to change dates
- **Double-click** - Open task details
- **Hover** - Show task information

### Status Colors
- Pending: Slate (#94a3b8)
- In Progress: Blue (#3b82f6)
- Blocked: Red (#ef4444)
- Completed: Green (#22c55e)

## Helper Function

```javascript
transformToGanttFormat(tasks, dependencies)
```

Converts tasks to gantt-task-react format. Filters out tasks without valid dates.

## Mobile Behavior

- Displays card-based list on < 768px
- Shows desktop recommendation banner
- Read-only mode (no drag-to-resize)
- Tap cards to view details

## Integration Example

```jsx
// In ProjectTasksTab.jsx
const [view, setView] = useState('list');

// Add Gantt button to view toggle
<Button
  variant={view === 'gantt' ? 'secondary' : 'ghost'}
  onClick={() => setView('gantt')}
>
  <Calendar className="h-4 w-4 mr-2" />
  Gantt
</Button>

// Render based on view
{view === 'gantt' && (
  <ProjectGanttView
    tasks={tasks}
    isLoading={isLoading}
    onTaskClick={handleTaskSelect}
  />
)}
```

## Empty States

1. **Loading** - Shows spinner
2. **No tasks** - Shows calendar icon with message
3. **No tasks with dates** - Shows alert with instructions

## Progress Calculation

```javascript
// Completed tasks = 100%
// Others = (actual_hours / estimated_hours) * 100
// Capped at 100%
```

## Dependencies

Automatically visualized as arrows between tasks. Tasks must have `dependencies` array with predecessor IDs.

## Error Handling

- Invalid dates filtered with console warning
- API errors shown via toast notifications
- Null-safe data access throughout

## Performance

- Uses `useMemo` for task transformation
- Optimistic updates for better UX
- Efficient re-render prevention

## Customization

Edit these constants in the component:

```javascript
// Status colors
const STATUS_COLORS = {
  pending: '#94a3b8',
  in_progress: '#3b82f6',
  blocked: '#ef4444',
  completed: '#22c55e',
};

// Column widths
columnWidth={
  viewMode === ViewMode.Day ? 60 :
  viewMode === ViewMode.Week ? 250 : 350
}
```

## Common Issues

**Tasks not showing?**
- Check dates are ISO format (YYYY-MM-DD)
- Verify both start_date and due_date exist
- Use date-fns `isValid()` to validate dates

**Dependencies not working?**
- Ensure predecessor tasks have valid dates
- Check dependency IDs match task IDs
- Verify tasks are in the same task list

**Drag not working?**
- Check window width (must be >= 768px)
- Verify useUpdateTask hook is working
- Check browser console for errors

## Next Steps

See full documentation in:
- `GANTT_VIEW_README.md` - Complete documentation
- `GANTT_INTEGRATION_EXAMPLE.jsx` - Full integration code
