-- Migration 012: Create Project Control tables
-- Projects, tasks, dependencies, and project members

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  description TEXT,

  -- Status: planning, active, on_hold, completed, cancelled
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),

  -- Priority: low, medium, high, critical
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Dates
  start_date TEXT NOT NULL,
  end_date TEXT,

  -- Budget tracking
  budget REAL,
  actual_cost REAL DEFAULT 0,

  -- Ownership and organization
  owner_id TEXT NOT NULL,
  branch_id TEXT,
  department_id TEXT,
  team_id TEXT,

  -- Custom fields (JSON)
  custom_fields TEXT,

  -- Audit fields
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT NOT NULL,
  deleted_at TEXT,
  deleted_by TEXT,

  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (branch_id) REFERENCES organizational_units(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES organizational_units(id) ON DELETE SET NULL,
  FOREIGN KEY (team_id) REFERENCES organizational_units(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Status: todo, in_progress, on_hold, completed, cancelled
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'on_hold', 'completed', 'cancelled')),

  -- Priority: low, medium, high, critical
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Dates
  start_date TEXT,
  due_date TEXT,
  completion_date TEXT,

  -- Time tracking
  estimated_hours REAL,
  actual_hours REAL DEFAULT 0,

  -- Assignment
  assigned_to TEXT,

  -- Custom fields (JSON)
  custom_fields TEXT,

  -- Audit fields
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT NOT NULL,
  deleted_at TEXT,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Task dependencies table
-- Supports multiple dependency types for complex project scheduling
CREATE TABLE IF NOT EXISTS task_dependencies (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  predecessor_id TEXT NOT NULL,
  successor_id TEXT NOT NULL,

  -- Dependency type: finish_to_start (most common), start_to_start, finish_to_finish, start_to_finish
  type TEXT NOT NULL DEFAULT 'finish_to_start' CHECK (type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (predecessor_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (successor_id) REFERENCES tasks(id) ON DELETE CASCADE,

  -- Prevent duplicate dependencies
  UNIQUE(predecessor_id, successor_id)
);

-- Project members table
-- Tracks team members assigned to each project
CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,

  -- Role: owner, manager, member, viewer
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member', 'viewer')),

  added_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Prevent duplicate memberships
  UNIQUE(project_id, user_id)
);

-- Create indexes for efficient querying

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_branch ON projects(branch_id);
CREATE INDEX IF NOT EXISTS idx_projects_department ON projects(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_team ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_projects_deleted ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_dates ON tasks(start_date, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at);

-- Task dependencies indexes
CREATE INDEX IF NOT EXISTS idx_task_deps_predecessor ON task_dependencies(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_successor ON task_dependencies(successor_id);

-- Project members indexes
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- Add new audit log actions for project management
-- These actions extend the AUDIT_ACTIONS in auditLogs.js
-- project_created, project_updated, project_deleted
-- task_created, task_updated, task_deleted
-- task_dependency_created, task_dependency_removed
