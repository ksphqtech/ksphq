# Progress Calculator Utility

## Overview

The Progress Calculator automatically calculates and updates project completion percentages based on task completion. It uses a recursive algorithm to handle nested subtasks and provides accurate progress tracking.

## Location

**File:** `/ksphq-auth-api/src/utils/progressCalculator.js`

## How It Works

### Algorithm

1. **Leaf Tasks**: Tasks without subtasks use their `completion_percentage` field directly
2. **Parent Tasks**: Tasks with subtasks calculate progress as the average of all subtasks (recursive)
3. **Project Progress**: Calculated from all root-level tasks (tasks without a parent)

### Example Calculation

Given a project with the following structure:

```
Project XYZ
├── Task A (50% complete)
├── Task B (has subtasks)
│   ├── Task B.1 (100% complete)
│   ├── Task B.2 (50% complete)
│   └── Task B.3 (0% complete)
└── Task C (100% complete)
```

**Calculations:**
- Task B progress = (100 + 50 + 0) / 3 = **50%**
- Project progress = (50 + 50 + 100) / 3 = **67%**

## Automatic Integration

The progress calculator is **automatically called** when:

### 1. Task Created
```javascript
POST /api/projects/:projectId/tasks
```
- Creates the task
- Recalculates project progress
- Updates the `projects.completion_percentage` field

### 2. Task Updated
```javascript
PATCH /api/tasks/:id
```
- Updates the task
- If `completion_percentage` or `status` changed:
  - Recalculates all parent task progress recursively
  - Recalculates project progress
  - Updates database

### 3. Task Deleted
```javascript
DELETE /api/tasks/:id
```
- Soft deletes the task
- Recalculates project progress
- Updates the `projects.completion_percentage` field

## API Functions

### `calculateTaskProgress(task, allTasks)`

Calculates progress for a single task including its subtasks.

**Parameters:**
- `task` (object): Task object with `id`, `completion_percentage`, `parent_task_id`
- `allTasks` (array): All tasks in the project

**Returns:** Number (0-100) representing task progress percentage

**Example:**
```javascript
import { calculateTaskProgress } from './progressCalculator.js';

const task = { id: '1', completion_percentage: 75, parent_task_id: null };
const allTasks = [task, ...]; // All project tasks
const progress = calculateTaskProgress(task, allTasks);
// Returns: 75
```

### `calculateProjectProgress(projectId, tasks)`

Calculates overall project progress from all tasks.

**Parameters:**
- `projectId` (string): Project ID
- `tasks` (array): All tasks in the project

**Returns:** Number (0-100) representing project progress percentage

**Example:**
```javascript
import { calculateProjectProgress } from './progressCalculator.js';

const projectId = 'abc123';
const tasks = [...]; // All project tasks
const progress = calculateProjectProgress(projectId, tasks);
// Returns: 67 (based on example above)
```

### `updateProjectProgress(projectId, db)`

Updates project progress in the database.

**Parameters:**
- `projectId` (string): Project ID
- `db` (object): Database connection

**Returns:** Promise resolving to object with:
- `projectId`: Project ID
- `completionPercentage`: New progress (0-100)
- `taskCount`: Total active tasks
- `updatedAt`: Timestamp

**Example:**
```javascript
import { updateProjectProgress } from './progressCalculator.js';

await updateProjectProgress('abc123', env.DB);
// Updates projects.completion_percentage in database
```

### `updateTaskHierarchyProgress(taskId, db)`

Recalculates and updates all parent task progress recursively.

**Parameters:**
- `taskId` (string): Task ID that was updated
- `db` (object): Database connection

**Returns:** Promise resolving to array of updated task IDs

**Example:**
```javascript
import { updateTaskHierarchyProgress } from './progressCalculator.js';

const updatedTaskIds = await updateTaskHierarchyProgress('task123', env.DB);
// Returns: ['parentTask1', 'grandparentTask1']
```

### `getProjectProgressSummary(projectId, db)`

Gets detailed progress summary with task breakdown.

**Parameters:**
- `projectId` (string): Project ID
- `db` (object): Database connection

**Returns:** Promise resolving to object with detailed statistics

**Example:**
```javascript
import { getProjectProgressSummary } from './progressCalculator.js';

const summary = await getProjectProgressSummary('abc123', env.DB);
// Returns:
// {
//   projectId: 'abc123',
//   projectName: 'Project XYZ',
//   projectStatus: 'in progress',
//   completionPercentage: 67,
//   totalTasks: 5,
//   completedTasks: 2,
//   inProgressTasks: 2,
//   blockedTasks: 0,
//   notStartedTasks: 1,
//   rootTasks: 3,
//   avgTaskProgress: 60
// }
```

## Database Schema Requirements

The progress calculator expects the following database structure:

### Projects Table
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  -- other fields...
  CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);
```

### Tasks Table
```sql
CREATE TABLE project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  parent_task_id TEXT,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  -- other fields...
  CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (parent_task_id) REFERENCES project_tasks(id)
);
```

## Error Handling

The progress calculator includes error handling:

- If progress calculation fails, it logs the error but doesn't fail the main operation
- Invalid data is handled gracefully (returns 0 for empty task lists)
- Database errors are caught and logged
- Progress is always clamped to 0-100 range

## Performance Considerations

- **Efficient Queries**: Fetches only necessary fields (`id`, `parent_task_id`, `completion_percentage`)
- **Single Update**: Project progress updated once per operation
- **Recursive Caching**: Task progress calculated only when needed
- **Active Tasks Only**: Only considers tasks where `is_active = 1`

## Testing

To test the progress calculator manually:

1. Create a project
2. Add root-level tasks with different completion percentages
3. Add subtasks to a root task
4. Update task completion percentages
5. Verify project progress updates automatically

## Notes

- Progress is always rounded to nearest integer
- Deleted tasks (`is_active = 0`) are excluded from calculations
- Empty projects return 0% progress
- Parent task `completion_percentage` is overridden by calculated value
- Changes cascade up the hierarchy automatically
