# ProjectGanttView - Component Architecture

## Component Hierarchy

```
ProjectGanttView (Main Component)
│
├── View Mode Toggle Section
│   ├── Label: "View:"
│   └── Button Group (Border Container)
│       ├── Day Button
│       ├── Week Button
│       └── Month Button
│
├── Legend Section
│   ├── Pending Status Indicator
│   ├── In Progress Status Indicator
│   ├── Blocked Status Indicator
│   └── Completed Status Indicator
│
├── Gantt Chart Container (Desktop)
│   └── Gantt Component (from gantt-task-react)
│       ├── Task List Column (200px)
│       │   └── Task Names
│       ├── Timeline Grid
│       │   ├── Date Headers
│       │   ├── Task Bars
│       │   │   ├── Task Bar (draggable)
│       │   │   ├── Progress Bar
│       │   │   └── Resize Handles
│       │   └── Dependency Arrows
│       └── Custom Tooltip
│           ├── Task Name
│           ├── Start Date
│           ├── End Date
│           ├── Progress %
│           ├── Assigned User
│           └── Hint Text
│
├── Mobile Card List (Mobile)
│   ├── Info Banner
│   │   ├── AlertCircle Icon
│   │   ├── Title: "Desktop View Recommended"
│   │   └── Description Text
│   └── Task Cards
│       ├── Task Card 1
│       │   ├── Task Name
│       │   ├── Date Range
│       │   ├── Status Color Dot
│       │   └── Progress Bar
│       ├── Task Card 2
│       └── Task Card N
│
└── Help Text Section
    └── Instructions for drag-to-resize and double-click
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      ProjectTasksTab                         │
│  (Parent Component)                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Props:
                      │ - tasks: Array<Task>
                      │ - isLoading: boolean
                      │ - onTaskClick: function
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    ProjectGanttView                          │
│  (Main Component)                                            │
│                                                              │
│  State:                                                      │
│  - viewMode: ViewMode.Week                                   │
│  - isMobile: boolean                                         │
│                                                              │
│  Hooks:                                                      │
│  - updateTaskMutation = useUpdateTask()                      │
│  - useEffect() → Window resize listener                      │
│                                                              │
│  Computed:                                                   │
│  - dependencies = useMemo(() => extract from tasks)          │
│  - ganttTasks = useMemo(() => transformToGanttFormat())      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Transforms
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              transformToGanttFormat()                        │
│  (Helper Function)                                           │
│                                                              │
│  Input: tasks, dependencies                                  │
│  Process:                                                    │
│  1. Filter tasks with valid dates                            │
│  2. Parse and validate dates                                 │
│  3. Calculate progress                                       │
│  4. Map dependencies                                         │
│  5. Apply status colors                                      │
│  Output: ganttTasks                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Passes to
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Gantt Component (External)                      │
│  (from gantt-task-react)                                     │
│                                                              │
│  Props:                                                      │
│  - tasks: ganttTasks                                         │
│  - viewMode: viewMode                                        │
│  - onDateChange: handleDateChange                            │
│  - onDoubleClick: handleDoubleClick                          │
│  - onProgressChange: handleProgressChange                    │
│  - TooltipContent: Custom component                          │
│  - columnWidth, barFill, colors, etc.                        │
└──────────────────────────────────────────────────────────────┘
```

## Event Flow

### 1. Date Change (Drag-to-Resize)

```
User drags task bar edge
        │
        ▼
Gantt library detects change
        │
        ▼
onDateChange(task) handler
        │
        ├─→ Extract original task data
        ├─→ Format dates (YYYY-MM-DD)
        ├─→ Check if dates actually changed
        │
        ▼
updateTaskMutation.mutate()
        │
        ├─→ Optimistic UI update
        ├─→ API call to backend
        │
        ▼
Success/Error handling
        │
        ├─→ Success: Show toast
        ├─→ Error: Show error toast
        └─→ Query invalidation (automatic)
```

### 2. Task Click (Open Detail)

```
User double-clicks task bar
        │
        ▼
Gantt library detects double-click
        │
        ▼
onDoubleClick(task) handler
        │
        ├─→ Extract original task data
        │
        ▼
onTaskClick(task._taskData) callback
        │
        ▼
Parent component (ProjectTasksTab)
        │
        ├─→ setSelectedTaskId(task.id)
        └─→ setShowDetailPanel(true)
```

### 3. View Mode Change

```
User clicks view mode button
        │
        ▼
Button onClick handler
        │
        ▼
setViewMode(newMode)
        │
        ▼
Component re-renders
        │
        ├─→ Update columnWidth
        ├─→ Update date granularity
        └─→ Gantt library re-renders
```

## State Management

```
┌──────────────────────────────────────────────────────────┐
│                      Local State                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  viewMode: ViewMode                                       │
│  ├─ Default: ViewMode.Week                                │
│  ├─ Options: Day, Week, Month                             │
│  └─ Controlled by: View toggle buttons                    │
│                                                           │
│  isMobile: boolean                                        │
│  ├─ Default: window.innerWidth < 768                      │
│  ├─ Updated: useEffect with resize listener               │
│  └─ Controls: Desktop vs Mobile view                      │
│                                                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    Computed State                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  dependencies: Array<Dependency>                          │
│  ├─ Computed: useMemo(() => extract from tasks)           │
│  ├─ Dependencies: [tasks]                                 │
│  └─ Used by: transformToGanttFormat()                     │
│                                                           │
│  ganttTasks: Array<GanttTask>                             │
│  ├─ Computed: useMemo(() => transformToGanttFormat())     │
│  ├─ Dependencies: [tasks, dependencies]                   │
│  └─ Used by: Gantt component                              │
│                                                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                   External State                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  updateTaskMutation: UseMutationResult                    │
│  ├─ From: useUpdateTask() hook                            │
│  ├─ Manages: API state (loading, error, success)          │
│  └─ Provides: mutate() function                           │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Props Interface

```typescript
interface ProjectGanttViewProps {
  // Required: Array of task objects
  tasks: Array<{
    id: string;
    title?: string;
    name?: string;
    start_date: string;        // ISO format: YYYY-MM-DD
    due_date: string;          // ISO format: YYYY-MM-DD
    status: 'pending' | 'in_progress' | 'blocked' | 'completed';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    estimated_hours?: number;
    actual_hours?: number;
    dependencies?: string[];   // Array of predecessor task IDs
    assigned_user?: {
      name: string;
      avatar_url?: string;
    };
  }>;
  
  // Optional: Loading state indicator
  isLoading?: boolean;
  
  // Optional: Callback when task is double-clicked
  onTaskClick?: (task: Task) => void;
}
```

## Helper Function Architecture

```
transformToGanttFormat(tasks, dependencies)
│
├── Input Validation
│   ├── Check tasks array exists
│   └── Return empty array if no tasks
│
├── Filter Tasks
│   ├── Filter by: task.start_date exists
│   └── Filter by: task.due_date exists
│
├── Transform Each Task
│   │
│   ├── Parse Dates
│   │   ├── parseISO(task.start_date)
│   │   └── parseISO(task.due_date)
│   │
│   ├── Validate Dates
│   │   ├── isValid(startDate)
│   │   ├── isValid(endDate)
│   │   └── Console warn if invalid
│   │
│   ├── Calculate Progress
│   │   ├── If completed: 100%
│   │   ├── Else if has hours: (actual/estimated) * 100
│   │   └── Else: 0%
│   │
│   ├── Map Dependencies
│   │   ├── Filter dependencies for this task
│   │   ├── Extract predecessor IDs
│   │   └── Filter out null values
│   │
│   ├── Apply Styles
│   │   ├── Get color from STATUS_COLORS
│   │   ├── Set backgroundColor
│   │   ├── Set progressColor
│   │   └── Set selection colors
│   │
│   └── Build Gantt Task Object
│       ├── id: task.id
│       ├── name: task.title || task.name
│       ├── start: Date object
│       ├── end: Date object
│       ├── progress: number (0-100)
│       ├── type: 'task'
│       ├── dependencies: string[]
│       ├── styles: object
│       └── _taskData: original task
│
└── Return Transformed Tasks
    └── Filter out null entries
```

## Responsive Breakpoints

```
┌──────────────────────────────────────────────────────────┐
│                    < 768px (Mobile)                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Layout:                                                  │
│  └─ Single column                                         │
│                                                           │
│  Components Shown:                                        │
│  ├─ Info banner (blue)                                    │
│  └─ Card-based task list                                  │
│                                                           │
│  Components Hidden:                                       │
│  ├─ View mode toggles                                     │
│  ├─ Legend                                                │
│  ├─ Gantt chart                                           │
│  └─ Help text                                             │
│                                                           │
│  Interactions:                                            │
│  ├─ Tap card to view details                              │
│  └─ No drag-to-resize                                     │
│                                                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  >= 768px (Desktop)                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Layout:                                                  │
│  └─ Full width with controls                              │
│                                                           │
│  Components Shown:                                        │
│  ├─ View mode toggles                                     │
│  ├─ Legend                                                │
│  ├─ Gantt chart                                           │
│  └─ Help text                                             │
│                                                           │
│  Components Hidden:                                       │
│  └─ Mobile info banner                                    │
│                                                           │
│  Interactions:                                            │
│  ├─ Drag edges to resize                                  │
│  ├─ Double-click to view details                          │
│  ├─ Hover for tooltip                                     │
│  └─ Toggle view modes                                     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Performance Optimizations

```
┌──────────────────────────────────────────────────────────┐
│                  useMemo Optimizations                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. Dependencies Extraction                               │
│     useMemo(() => {                                       │
│       // Extract dependencies from tasks                  │
│     }, [tasks])                                           │
│     → Prevents re-extraction on every render              │
│                                                           │
│  2. Task Transformation                                   │
│     useMemo(() => {                                       │
│       return transformToGanttFormat(tasks, deps)          │
│     }, [tasks, dependencies])                             │
│     → Prevents re-transformation on every render          │
│                                                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                 Optimistic UI Updates                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  When user drags task:                                    │
│  1. UI updates immediately (Gantt library)                │
│  2. Mutation called in background                         │
│  3. If success: Changes persist                           │
│  4. If error: React Query auto-reverts                    │
│                                                           │
│  Benefits:                                                │
│  ├─ Feels instant and responsive                          │
│  ├─ No loading spinners for drag                          │
│  └─ Automatic error recovery                              │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Error Handling Strategy

```
┌──────────────────────────────────────────────────────────┐
│                    Error Boundaries                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Level 1: Input Validation                                │
│  ├─ Check tasks array exists                              │
│  ├─ Filter tasks without dates                            │
│  └─ Validate date formats                                 │
│                                                           │
│  Level 2: Data Processing                                 │
│  ├─ Null/undefined checks                                 │
│  ├─ Console warnings for invalid data                     │
│  └─ Filter out problematic tasks                          │
│                                                           │
│  Level 3: API Operations                                  │
│  ├─ Mutation error handling                               │
│  ├─ Toast notifications                                   │
│  └─ Query invalidation                                    │
│                                                           │
│  Level 4: UI Fallbacks                                    │
│  ├─ Empty state for no tasks                              │
│  ├─ Empty state for no dates                              │
│  └─ Loading state                                         │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Integration Points

```
ProjectGanttView integrates with:

┌─────────────────────────────────────────────────────────┐
│  Parent: ProjectTasksTab                                 │
│  ├─ Receives: tasks, isLoading, onTaskClick              │
│  └─ Provides: View switching, task selection             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Hook: useUpdateTask                                     │
│  ├─ Receives: Task updates                               │
│  └─ Provides: Mutation function, loading state           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Library: gantt-task-react                               │
│  ├─ Receives: Transformed tasks, config                  │
│  └─ Provides: Gantt UI, drag handlers                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Library: date-fns                                       │
│  ├─ Receives: Date strings                               │
│  └─ Provides: Parsing, formatting, validation            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Library: sonner                                         │
│  ├─ Receives: Messages                                   │
│  └─ Provides: Toast notifications                        │
└─────────────────────────────────────────────────────────┘
```

This architecture ensures:
- Clear separation of concerns
- Efficient data flow
- Proper error handling
- Performance optimization
- Responsive design
- Maintainable code structure
