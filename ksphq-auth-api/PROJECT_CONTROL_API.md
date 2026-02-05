# Project Control API Documentation

This document describes the backend API layer for the Project Control module in KSPHQ.

## Overview

The Project Control module provides comprehensive project and task management capabilities with:
- Project creation and tracking with budget management
- Task management with time tracking
- Task dependency management with cycle detection
- Branch/department/team scoping based on user permissions
- Project member management
- Audit logging for all operations

## Database Schema

### Projects Table
Stores project information with organizational scoping and budget tracking.

**Key Fields:**
- `id` - Unique project identifier
- `project_code` - Unique project code (e.g., "PROJ-001")
- `name` - Project name
- `description` - Project description
- `status` - Project status: `planning`, `active`, `on_hold`, `completed`, `cancelled`
- `priority` - Priority level: `low`, `medium`, `high`, `critical`
- `start_date` - Project start date
- `end_date` - Project end date (optional)
- `budget` - Project budget amount
- `actual_cost` - Actual cost incurred
- `owner_id` - Project owner user ID
- `branch_id`, `department_id`, `team_id` - Organizational scoping
- `custom_fields` - JSON field for custom data
- Audit fields: `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`

### Tasks Table
Stores project tasks with time tracking and assignment.

**Key Fields:**
- `id` - Unique task identifier
- `project_id` - Parent project ID
- `name` - Task name
- `description` - Task description
- `status` - Task status: `todo`, `in_progress`, `on_hold`, `completed`, `cancelled`
- `priority` - Priority level: `low`, `medium`, `high`, `critical`
- `start_date` - Task start date (optional)
- `due_date` - Task due date (optional)
- `completion_date` - Automatically set when status changes to `completed`
- `estimated_hours` - Estimated time to complete
- `actual_hours` - Actual time spent
- `assigned_to` - Assigned user ID (optional)
- `custom_fields` - JSON field for custom data
- Audit fields: `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`

### Task Dependencies Table
Stores task dependencies with support for multiple dependency types.

**Key Fields:**
- `id` - Unique dependency identifier
- `predecessor_id` - Task that must complete first
- `successor_id` - Task that depends on predecessor
- `type` - Dependency type:
  - `finish_to_start` (most common) - Successor can't start until predecessor finishes
  - `start_to_start` - Successor can't start until predecessor starts
  - `finish_to_finish` - Successor can't finish until predecessor finishes
  - `start_to_finish` - Successor can't finish until predecessor starts
- `created_at` - When dependency was created

**Cycle Detection:** The system automatically prevents circular dependencies using depth-first search.

### Project Members Table
Tracks team members assigned to projects.

**Key Fields:**
- `id` - Unique membership identifier
- `project_id` - Project ID
- `user_id` - User ID
- `role` - Member role: `owner`, `manager`, `member`, `viewer`
- `added_at` - When member was added

## API Endpoints

### Projects

#### List Projects
```
GET /api/projects
```

**Query Parameters:**
- `branch_id` - Filter by branch
- `department_id` - Filter by department
- `team_id` - Filter by team
- `status` - Filter by status
- `priority` - Filter by priority
- `owner_id` - Filter by owner
- `search` - Search in name, description, or project code
- `include_deleted` - Include soft-deleted projects (default: false)
- `sort` - Sort field and order (default: `created_at:desc`)
  - Valid fields: `created_at`, `updated_at`, `name`, `start_date`, `end_date`, `priority`, `status`
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "...",
        "project_code": "PROJ-001",
        "name": "New Website",
        "description": "Redesign company website",
        "status": "active",
        "priority": "high",
        "start_date": "2026-01-01",
        "end_date": "2026-06-30",
        "budget": 50000.00,
        "actual_cost": 15000.00,
        "owner_id": "...",
        "owner_name": "John Doe",
        "branch_name": "Main Branch",
        "department_name": "Engineering",
        "team_name": "Web Development",
        "task_count": 25,
        "completed_task_count": 10,
        "created_at": "2026-01-01T00:00:00Z",
        "created_by_name": "Jane Smith"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    }
  }
}
```

#### Get Project Details
```
GET /api/projects/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "...",
      "project_code": "PROJ-001",
      "name": "New Website",
      "description": "Redesign company website",
      "status": "active",
      "priority": "high",
      "start_date": "2026-01-01",
      "end_date": "2026-06-30",
      "budget": 50000.00,
      "actual_cost": 15000.00,
      "owner_id": "...",
      "owner_name": "John Doe",
      "owner_email": "john@example.com",
      "branch_id": "...",
      "branch_name": "Main Branch",
      "department_id": "...",
      "department_name": "Engineering",
      "team_id": "...",
      "team_name": "Web Development",
      "custom_fields": { "client": "Acme Corp" },
      "members": [
        {
          "id": "...",
          "user_id": "...",
          "user_name": "John Doe",
          "user_email": "john@example.com",
          "role": "owner",
          "added_at": "2026-01-01T00:00:00Z"
        }
      ],
      "created_at": "2026-01-01T00:00:00Z",
      "created_by_name": "Jane Smith",
      "updated_at": "2026-01-15T00:00:00Z",
      "updated_by_name": "John Doe"
    }
  }
}
```

#### Create Project
```
POST /api/projects
```

**Request Body:**
```json
{
  "project_code": "PROJ-001",
  "name": "New Website",
  "description": "Redesign company website",
  "status": "planning",
  "priority": "high",
  "start_date": "2026-01-01",
  "end_date": "2026-06-30",
  "budget": 50000.00,
  "owner_id": "...",
  "branch_id": "...",
  "department_id": "...",
  "team_id": "...",
  "custom_fields": { "client": "Acme Corp" }
}
```

**Required Fields:** `project_code`, `name`, `start_date`, `owner_id`

#### Update Project
```
PATCH /api/projects/:id
```

**Request Body:** Any project fields to update (same as create, all optional)

#### Delete Project
```
DELETE /api/projects/:id
```

Soft deletes the project. Cannot delete projects with active (non-completed) tasks.

#### Add Project Member
```
POST /api/projects/:id/members
```

**Request Body:**
```json
{
  "user_id": "...",
  "role": "member"
}
```

**Roles:** `owner`, `manager`, `member`, `viewer`

#### Remove Project Member
```
DELETE /api/projects/:id/members/:userId
```

### Tasks

#### List Tasks
```
GET /api/projects/:projectId/tasks
```

**Query Parameters:**
- `status` - Filter by status
- `priority` - Filter by priority
- `assigned_to` - Filter by assigned user
- `include_deleted` - Include soft-deleted tasks (default: false)
- `sort` - Sort field and order (default: `created_at:desc`)

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "...",
        "project_id": "...",
        "name": "Design homepage",
        "description": "Create wireframes and mockups",
        "status": "in_progress",
        "priority": "high",
        "start_date": "2026-01-05",
        "due_date": "2026-01-20",
        "completion_date": null,
        "estimated_hours": 40,
        "actual_hours": 15,
        "assigned_to": "...",
        "assigned_to_name": "John Doe",
        "created_by_name": "Jane Smith",
        "predecessor_count": 0,
        "successor_count": 2,
        "created_at": "2026-01-05T00:00:00Z"
      }
    ]
  }
}
```

#### Get Task Details
```
GET /api/tasks/:id
```

**Response:** Includes `predecessors` and `successors` arrays with dependency details.

#### Create Task
```
POST /api/projects/:projectId/tasks
```

**Request Body:**
```json
{
  "name": "Design homepage",
  "description": "Create wireframes and mockups",
  "status": "todo",
  "priority": "high",
  "start_date": "2026-01-05",
  "due_date": "2026-01-20",
  "estimated_hours": 40,
  "assigned_to": "...",
  "custom_fields": { "phase": "design" }
}
```

**Required Fields:** `name`

#### Update Task
```
PATCH /api/tasks/:id
```

**Request Body:** Any task fields to update (same as create, all optional)

**Note:** When status changes to `completed`, `completion_date` is automatically set.

#### Delete Task
```
DELETE /api/tasks/:id
```

Soft deletes the task and removes all its dependencies.

### Task Dependencies

#### Add Task Dependency
```
POST /api/tasks/:taskId/dependencies
```

Adds a dependency where the task at `:taskId` is the **successor** (depends on the predecessor).

**Request Body:**
```json
{
  "predecessor_id": "...",
  "type": "finish_to_start"
}
```

**Dependency Types:**
- `finish_to_start` - Successor can't start until predecessor finishes (default)
- `start_to_start` - Successor can't start until predecessor starts
- `finish_to_finish` - Successor can't finish until predecessor finishes
- `start_to_finish` - Successor can't finish until predecessor starts

**Cycle Detection:** Returns 400 error if dependency would create a circular reference.

#### Remove Task Dependency
```
DELETE /api/dependencies/:id
```

#### Get Project Dependencies
```
GET /api/projects/:projectId/dependencies
```

Returns all dependencies for a project (useful for Gantt chart visualization).

## Permission System

### Project Permissions

The `projects` permission in user roles controls access:

- **`full`** - Full access to all projects across the organization
- **`branch`** - Access to projects in the user's branch
- **`department`** - Access to projects in the user's department
- **`team`** - Access to projects in the user's team
- **`view_own`** - Access only to projects where user is owner, creator, or member (read-only)

### Permission Checks

1. **View Projects/Tasks** - All permission levels can view projects within their scope
2. **Create Projects/Tasks** - All levels except `view_own` can create
3. **Edit Projects/Tasks** - All levels except `view_own` can edit within their scope
4. **Delete Projects/Tasks** - All levels except `view_own` can delete within their scope

### Organizational Scoping

Projects are automatically scoped based on:
- User's branch_id, department_id, team_id
- Project's branch_id, department_id, team_id
- Project membership

Users can only access projects that match their organizational scope or where they are explicitly added as members.

## Audit Logging

All project and task operations are logged with the following actions:

- `project_created` - New project created
- `project_updated` - Project modified
- `project_deleted` - Project soft-deleted
- `task_created` - New task created
- `task_updated` - Task modified
- `task_deleted` - Task soft-deleted
- `task_dependency_created` - Dependency added
- `task_dependency_removed` - Dependency removed

Audit logs include:
- User who performed the action
- Timestamp
- Before/after changes (for updates)
- Descriptive details

## Error Handling

All endpoints return standard error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": { "additional": "info" }
  }
}
```

**Common Error Codes:**
- `400` - Validation error, invalid data
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `409` - Conflict (duplicate project code, circular dependency)
- `500` - Internal server error

## Migration

To set up the database tables, run:

```bash
cd ksphq-auth-api
wrangler d1 execute ksphq-auth-db --file=./migrations/012_create_project_control.sql
```

## File Structure

```
ksphq-auth-api/
├── src/
│   ├── db/
│   │   ├── projectQueries.js      # Project database operations
│   │   ├── taskQueries.js         # Task database operations
│   │   └── auditLogs.js           # Updated with project actions
│   └── handlers/
│       ├── projects.js            # Project API handlers
│       └── tasks.js               # Task API handlers
└── migrations/
    └── 012_create_project_control.sql  # Database schema
```

## Usage Examples

### Creating a Project with Tasks

```javascript
// 1. Create project
const projectResponse = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    project_code: 'WEB-2026',
    name: 'Website Redesign',
    status: 'planning',
    priority: 'high',
    start_date: '2026-02-01',
    end_date: '2026-06-30',
    budget: 50000,
    owner_id: 'user-123'
  })
});
const { data: { project } } = await projectResponse.json();

// 2. Create tasks
const task1 = await fetch(`/api/projects/${project.id}/tasks`, {
  method: 'POST',
  body: JSON.stringify({
    name: 'Requirements gathering',
    priority: 'high',
    estimated_hours: 20,
    assigned_to: 'user-456'
  })
});

const task2 = await fetch(`/api/projects/${project.id}/tasks`, {
  method: 'POST',
  body: JSON.stringify({
    name: 'Design mockups',
    priority: 'high',
    estimated_hours: 40,
    assigned_to: 'user-789'
  })
});

// 3. Create dependency (task2 depends on task1)
await fetch(`/api/tasks/${task2.id}/dependencies`, {
  method: 'POST',
  body: JSON.stringify({
    predecessor_id: task1.id,
    type: 'finish_to_start'
  })
});
```

### Querying Projects

```javascript
// List active high-priority projects in Engineering department
const response = await fetch('/api/projects?' + new URLSearchParams({
  department_id: 'dept-eng',
  status: 'active',
  priority: 'high',
  sort: 'start_date:asc'
}));

const { data: { projects, pagination } } = await response.json();
```

## Integration Notes

### Frontend Integration
- Use with React Query or SWR for data fetching and caching
- Implement optimistic updates for better UX
- Display Gantt charts using dependency data from `/api/projects/:id/dependencies`
- Show task counts and progress percentages from project list data

### Role Configuration
Ensure roles have the `projects` permission configured:
```json
{
  "permissions": {
    "projects": "branch"  // or "department", "team", "view_own", "full"
  }
}
```

### Custom Fields
Both projects and tasks support `custom_fields` as JSON. Use this for:
- Client information
- Budget categories
- Custom workflow states
- Integration IDs with external systems
