# Kanban Board Documentation

## Overview

The Kanban board provides a visual, column-based interface for managing project tasks. Built with `@dnd-kit` for drag-and-drop functionality, it offers an intuitive way to track task progress across different stages of completion.

## Architecture

### Core Components

- **KanbanBoard**: Main container component managing board state and drag-and-drop context
- **KanbanColumn**: Individual column component representing a task status
- **KanbanCard**: Draggable task card component
- **TaskCard**: Reusable task display component (shared with list view)

### Technology Stack

- **@dnd-kit/core**: Core drag-and-drop functionality
- **@dnd-kit/sortable**: Sortable list utilities for cards within columns
- **@dnd-kit/utilities**: Helper utilities for drag-and-drop operations
- **React Query**: Data fetching and caching
- **Tailwind CSS**: Styling and responsive design

## How the Kanban Board Works

### Data Flow

1. **Fetching Tasks**: Tasks are fetched via React Query from the API
2. **Grouping by Status**: Tasks are grouped into columns based on their status field
3. **Drag Events**: When a card is dragged, dnd-kit tracks the movement
4. **Status Updates**: On drop, the task's status is updated via API
5. **Optimistic Updates**: UI updates immediately while API request processes

### State Management

```javascript
const [columns, setColumns] = useState({
  pending: [],
  in_progress: [],
  blocked: [],
  completed: []
});
```

## Drag and Drop Functionality

### Basic Implementation

```jsx
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
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

function KanbanBoard({ projectId }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance to activate
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    // Update task status
    updateTaskStatus(taskId, newStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto">
        {Object.keys(columns).map((columnId) => (
          <KanbanColumn
            key={columnId}
            id={columnId}
            tasks={columns[columnId]}
          />
        ))}
      </div>
    </DndContext>
  );
}
```

### Drag Constraints

- **Minimum Distance**: 8px drag distance to prevent accidental drags
- **Collision Detection**: Uses `closestCorners` algorithm for smooth drop zones
- **Keyboard Support**: Full keyboard navigation for accessibility

## Column Configuration

### Default Columns

The board uses the following default column structure:

```javascript
const DEFAULT_COLUMNS = [
  {
    id: 'pending',
    title: 'Pending',
    status: 'pending',
    color: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-300',
    icon: 'Clock',
    limit: null, // No WIP limit
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    status: 'in_progress',
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    icon: 'PlayCircle',
    limit: 5, // Work-in-progress limit
  },
  {
    id: 'blocked',
    title: 'Blocked',
    status: 'blocked',
    color: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    icon: 'AlertCircle',
    limit: null,
  },
  {
    id: 'completed',
    title: 'Completed',
    status: 'completed',
    color: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
    icon: 'CheckCircle',
    limit: null,
  },
];
```

### Column Component Structure

```jsx
function KanbanColumn({ id, title, tasks, color, limit }) {
  const { setNodeRef } = useDroppable({ id });
  const isOverLimit = limit && tasks.length >= limit;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[300px] max-w-[300px] rounded-lg',
        'bg-muted/50 p-4 space-y-3'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('rounded p-1', color)}>
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="outline">{tasks.length}</Badge>
        </div>
        {isOverLimit && (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}
      </div>

      {/* Tasks */}
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[200px]">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
```

## Touch Support on Mobile

### Touch Sensor Configuration

```javascript
import { TouchSensor, MouseSensor } from '@dnd-kit/core';

const sensors = useSensors(
  // Mouse sensor for desktop
  useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  }),
  // Touch sensor for mobile
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  }),
  // Keyboard sensor for accessibility
  useSensor(KeyboardSensor)
);
```

### Mobile Optimizations

- **Delay Activation**: 250ms delay prevents conflicts with scrolling
- **Tolerance**: 5px tolerance for touch jitter
- **Visual Feedback**: Larger drag handles and touch targets on mobile
- **Responsive Layout**: Horizontal scrolling on small screens

### Mobile-Specific Styles

```css
/* Touch-friendly card sizing */
@media (max-width: 768px) {
  .kanban-card {
    min-height: 80px;
    touch-action: none;
  }

  .drag-handle {
    padding: 12px;
    min-width: 44px;
    min-height: 44px;
  }
}
```

## Customizing Columns

### Adding a New Column

To add a new column (e.g., "In Review"):

1. **Update Column Configuration**:

```javascript
const CUSTOM_COLUMNS = [
  ...DEFAULT_COLUMNS,
  {
    id: 'in_review',
    title: 'In Review',
    status: 'in_review',
    color: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-300',
    icon: 'Eye',
    limit: 3,
  },
];
```

2. **Update Database Schema**:

```sql
ALTER TYPE task_status ADD VALUE 'in_review' AFTER 'in_progress';
```

3. **Update TypeScript Types** (if using TypeScript):

```typescript
type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'in_review'  // New status
  | 'blocked'
  | 'completed';
```

### Customizing Column Colors

You can customize column colors to match your brand or preferences:

```javascript
// Theme-based colors
const THEMED_COLUMNS = {
  pending: {
    color: 'bg-slate-100',
    textColor: 'text-slate-800',
    borderColor: 'border-slate-300',
  },
  in_progress: {
    color: 'bg-sky-100',
    textColor: 'text-sky-800',
    borderColor: 'border-sky-300',
  },
  // ...
};

// Using CSS variables for dynamic themes
const column = {
  color: 'bg-primary/10',
  textColor: 'text-primary',
  borderColor: 'border-primary/20',
};
```

### Reordering Columns

To change column order, simply reorder the array:

```javascript
const COLUMN_ORDER = [
  'pending',
  'in_progress',
  'blocked',    // Moved before completed
  'completed',
];

// Render columns in specified order
{COLUMN_ORDER.map(columnId => (
  <KanbanColumn key={columnId} {...columns[columnId]} />
))}
```

## Handling Custom Task Statuses

### Dynamic Status Mapping

For projects with custom statuses, implement a status mapping system:

```javascript
// Status mapping configuration
const STATUS_MAPPING = {
  // Custom status -> Board column
  'backlog': 'pending',
  'ready': 'pending',
  'in_dev': 'in_progress',
  'code_review': 'in_review',
  'qa': 'in_review',
  'blocked': 'blocked',
  'done': 'completed',
};

// Map tasks to columns
function groupTasksByColumn(tasks) {
  const grouped = {};

  tasks.forEach(task => {
    const columnId = STATUS_MAPPING[task.status] || 'pending';
    if (!grouped[columnId]) {
      grouped[columnId] = [];
    }
    grouped[columnId].push(task);
  });

  return grouped;
}
```

### Custom Status Workflow

Define status transitions to control which moves are allowed:

```javascript
const ALLOWED_TRANSITIONS = {
  pending: ['in_progress', 'blocked'],
  in_progress: ['in_review', 'blocked', 'pending'],
  in_review: ['completed', 'in_progress', 'blocked'],
  blocked: ['pending', 'in_progress'],
  completed: [], // Cannot move completed tasks
};

function handleDragEnd(event) {
  const { active, over } = event;
  const task = findTask(active.id);
  const newStatus = over.id;

  // Check if transition is allowed
  if (!ALLOWED_TRANSITIONS[task.status].includes(newStatus)) {
    toast.error(`Cannot move task from ${task.status} to ${newStatus}`);
    return;
  }

  updateTaskStatus(task.id, newStatus);
}
```

## Performance Considerations

### Virtualization for Large Lists

For columns with many tasks (>50), implement virtualization:

```javascript
import { useVirtualizer } from '@tanstack/react-virtual';

function KanbanColumn({ tasks }) {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated card height
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-y-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <SortableTaskCard task={tasks[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Optimistic Updates

Implement optimistic updates for better UX:

```javascript
const updateTaskMutation = useMutation({
  mutationFn: ({ taskId, status }) =>
    taskApi.update(taskId, { status }),

  // Optimistic update
  onMutate: async ({ taskId, status }) => {
    await queryClient.cancelQueries(['tasks', projectId]);

    const previousTasks = queryClient.getQueryData(['tasks', projectId]);

    // Update cache immediately
    queryClient.setQueryData(['tasks', projectId], (old) => ({
      ...old,
      tasks: old.tasks.map(task =>
        task.id === taskId ? { ...task, status } : task
      ),
    }));

    return { previousTasks };
  },

  // Rollback on error
  onError: (err, variables, context) => {
    queryClient.setQueryData(
      ['tasks', projectId],
      context.previousTasks
    );
    toast.error('Failed to update task');
  },

  // Refetch on success
  onSuccess: () => {
    queryClient.invalidateQueries(['tasks', projectId]);
  },
});
```

### Memoization

Memoize expensive computations:

```javascript
const groupedTasks = useMemo(() => {
  return groupTasksByStatus(tasks);
}, [tasks]);

const columnStats = useMemo(() => {
  return Object.entries(groupedTasks).reduce((acc, [status, tasks]) => {
    acc[status] = {
      count: tasks.length,
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      overdue: tasks.filter(t => isOverdue(t.due_date)).length,
    };
    return acc;
  }, {});
}, [groupedTasks]);
```

### Debounced Auto-save

For inline editing, debounce save operations:

```javascript
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

function KanbanCard({ task }) {
  const debouncedUpdate = useDebouncedCallback(
    (taskId, updates) => updateTask(taskId, updates),
    1000 // Wait 1s after last change
  );

  const handleTitleChange = (newTitle) => {
    // Update local state immediately
    setLocalTitle(newTitle);
    // Debounce API call
    debouncedUpdate(task.id, { title: newTitle });
  };
}
```

## Accessibility Features

### Keyboard Navigation

Full keyboard support for navigating and moving cards:

```javascript
// Keyboard sensor with custom coordinates
const keyboardCoordinates = {
  start: ['Space', 'Enter'],
  end: ['Space', 'Enter'],
  cancel: ['Escape'],
  // Arrow keys to move between columns
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
};

const sensors = useSensors(
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

### Keyboard Shortcuts

- **Space/Enter**: Pick up or drop card
- **Arrow Keys**: Move card between columns or positions
- **Escape**: Cancel drag operation
- **Tab**: Navigate between cards
- **Shift + Tab**: Navigate backwards

### Screen Reader Support

```jsx
function SortableTaskCard({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      role="button"
      aria-label={`Task: ${task.title}. Status: ${task.status}. Priority: ${task.priority}`}
      aria-describedby={`task-${task.id}-details`}
      tabIndex={0}
    >
      <TaskCard task={task} dragHandleProps={listeners} />
      <div id={`task-${task.id}-details`} className="sr-only">
        {task.description}
        {task.assigned_user && ` Assigned to: ${task.assigned_user.name}`}
        {task.due_date && ` Due: ${format(parseISO(task.due_date), 'PPP')}`}
      </div>
    </div>
  );
}
```

### ARIA Attributes

```jsx
<div
  role="region"
  aria-label="Kanban board"
  aria-describedby="kanban-instructions"
>
  <div id="kanban-instructions" className="sr-only">
    Use arrow keys to navigate between tasks.
    Press Space or Enter to pick up a task.
    Use arrow keys to move it, then press Space or Enter to drop.
  </div>

  {/* Columns */}
  {columns.map(column => (
    <div
      key={column.id}
      role="region"
      aria-label={`${column.title} column, ${column.tasks.length} tasks`}
    >
      {/* Tasks */}
    </div>
  ))}
</div>
```

### Focus Management

```javascript
function KanbanBoard() {
  const [activeId, setActiveId] = useState(null);
  const focusableElements = useRef([]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    // Announce to screen readers
    announceToScreenReader(`Picked up task ${event.active.id}`);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over) {
      announceToScreenReader(
        `Task moved to ${over.id} column`
      );
    }

    setActiveId(null);

    // Restore focus to the moved card
    const movedCard = document.querySelector(`[data-task-id="${active.id}"]`);
    movedCard?.focus();
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart({ active }) {
            return `Picked up task ${active.id}`;
          },
          onDragOver({ active, over }) {
            return `Task ${active.id} over ${over?.id}`;
          },
          onDragEnd({ active, over }) {
            return `Task ${active.id} dropped on ${over?.id}`;
          },
          onDragCancel({ active }) {
            return `Drag cancelled for task ${active.id}`;
          },
        },
      }}
    >
      {/* Board content */}
    </DndContext>
  );
}
```

### Visual Focus Indicators

```css
/* Ensure visible focus indicators */
.kanban-card:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

.drag-handle:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: -2px;
  border-radius: 4px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .kanban-card {
    border: 2px solid currentColor;
  }
}
```

## Additional Features

### Swimlanes

Group tasks by assignee or priority:

```javascript
function KanbanWithSwimlanes({ tasks }) {
  const swimlanes = useMemo(() => {
    return groupBy(tasks, 'assigned_user.id');
  }, [tasks]);

  return (
    <div className="space-y-8">
      {Object.entries(swimlanes).map(([userId, userTasks]) => (
        <div key={userId}>
          <h3>{userTasks[0].assigned_user.name}</h3>
          <KanbanBoard tasks={userTasks} />
        </div>
      ))}
    </div>
  );
}
```

### Card Actions Menu

Quick actions without opening detail panel:

```jsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <MoreVertical className="h-4 w-4" />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => editTask(task)}>
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => duplicateTask(task)}>
      Duplicate
    </DropdownMenuItem>
    <DropdownMenuItem
      onClick={() => deleteTask(task)}
      className="text-destructive"
    >
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Column Limits

Enforce work-in-progress limits:

```javascript
function handleDragEnd(event) {
  const { over } = event;
  const targetColumn = columns[over.id];

  if (targetColumn.limit && targetColumn.tasks.length >= targetColumn.limit) {
    toast.error(`${targetColumn.title} has reached its WIP limit`);
    return;
  }

  // Proceed with move
}
```

## Related Files

- **Task Components**: `/src/components/projects/tasks/`
- **Task API**: `/src/lib/projectApi.js`
- **Task Hooks**: `/src/hooks/useTasks.js`
- **Project Detail**: `/src/pages/tools/projects/ProjectDetail.jsx`

## Resources

- [dnd-kit Documentation](https://docs.dndkit.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
