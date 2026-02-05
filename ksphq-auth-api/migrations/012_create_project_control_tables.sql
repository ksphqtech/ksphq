-- Migration 012: Create Project Control tables
-- Comprehensive schema for project management with tasks, dependencies, and collaboration

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  branch_id TEXT NOT NULL,

  -- Project status with CHECK constraint
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in progress', 'on hold', 'completed', 'cancelled')),

  -- Priority with CHECK constraint
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Dates
  start_date TEXT,
  end_date TEXT,
  actual_start_date TEXT,
  actual_end_date TEXT,

  -- Progress tracking
  completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

  -- Budget tracking
  budget_amount REAL,
  actual_cost REAL,

  -- Assignment and ownership
  project_manager_id TEXT,
  created_by TEXT NOT NULL,

  -- Soft delete support
  is_active INTEGER NOT NULL DEFAULT 1,

  -- Audit fields
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,

  FOREIGN KEY (branch_id) REFERENCES organizational_units(id) ON DELETE CASCADE,
  FOREIGN KEY (project_manager_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PROJECT TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_tasks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL,
  parent_task_id TEXT,

  -- Task details
  title TEXT NOT NULL,
  description TEXT,

  -- Status with CHECK constraint
  status TEXT NOT NULL DEFAULT 'not started' CHECK (status IN ('planning', 'in progress', 'on hold', 'completed', 'cancelled')),

  -- Priority with CHECK constraint
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Assignment
  assigned_to TEXT,

  -- Dates and duration
  start_date TEXT,
  due_date TEXT,
  completed_at TEXT,
  estimated_hours REAL,
  actual_hours REAL,

  -- Progress
  completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

  -- Hierarchy and ordering
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Soft delete
  is_active INTEGER NOT NULL DEFAULT 1,

  -- Audit fields
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- TASK DEPENDENCIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_dependencies (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  task_id TEXT NOT NULL,
  depends_on_task_id TEXT NOT NULL,

  -- Dependency type
  dependency_type TEXT NOT NULL DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),

  -- Lag time in hours (can be negative for lead time)
  lag_hours INTEGER DEFAULT 0,

  -- Audit fields
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL,

  FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,

  -- Prevent self-dependencies
  CHECK (task_id != depends_on_task_id),

  -- Prevent duplicate dependencies
  UNIQUE (task_id, depends_on_task_id)
);

-- ============================================================================
-- TASK CHECKLIST ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_checklist_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  task_id TEXT NOT NULL,

  -- Checklist item details
  title TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,

  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Audit fields
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,
  completed_at TEXT,
  completed_by TEXT,

  FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- TASK COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_comments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  task_id TEXT NOT NULL,

  -- Comment content
  comment TEXT NOT NULL,

  -- Parent comment for threading
  parent_comment_id TEXT,

  -- Audit fields
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,

  -- Soft delete
  is_deleted INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  deleted_by TEXT,

  FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES task_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PROJECT MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,

  -- Role in project
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member', 'viewer')),

  -- Permissions
  can_edit_project INTEGER NOT NULL DEFAULT 0,
  can_create_tasks INTEGER NOT NULL DEFAULT 0,
  can_edit_tasks INTEGER NOT NULL DEFAULT 0,
  can_delete_tasks INTEGER NOT NULL DEFAULT 0,
  can_assign_tasks INTEGER NOT NULL DEFAULT 0,

  -- Audit fields
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

  -- Ensure user can only be added once per project
  UNIQUE (project_id, user_id)
);

-- ============================================================================
-- INDEXES FOR PROJECTS TABLE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_branch ON projects(branch_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_projects_branch_status ON projects(branch_id, status, is_active);

-- ============================================================================
-- INDEXES FOR PROJECT TASKS TABLE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON project_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON project_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON project_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON project_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON project_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON project_tasks(project_id, status, is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON project_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_sort ON project_tasks(project_id, parent_task_id, sort_order);

-- ============================================================================
-- INDEXES FOR TASK DEPENDENCIES TABLE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_dependencies_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_depends_on ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_type ON task_dependencies(dependency_type);

-- ============================================================================
-- INDEXES FOR TASK CHECKLIST ITEMS TABLE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_checklist_task ON task_checklist_items(task_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completed ON task_checklist_items(is_completed);
CREATE INDEX IF NOT EXISTS idx_checklist_sort ON task_checklist_items(task_id, sort_order);

-- ============================================================================
-- INDEXES FOR TASK COMMENTS TABLE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON task_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_by ON task_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_comments_deleted ON task_comments(is_deleted);
CREATE INDEX IF NOT EXISTS idx_comments_task_active ON task_comments(task_id, is_deleted, created_at);

-- ============================================================================
-- INDEXES FOR PROJECT MEMBERS TABLE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_role ON project_members(role);
CREATE INDEX IF NOT EXISTS idx_members_project_role ON project_members(project_id, role);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Projects updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_projects_timestamp
  AFTER UPDATE ON projects
  FOR EACH ROW
BEGIN
  UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Project tasks updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_project_tasks_timestamp
  AFTER UPDATE ON project_tasks
  FOR EACH ROW
BEGIN
  UPDATE project_tasks SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Task checklist items updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_task_checklist_items_timestamp
  AFTER UPDATE ON task_checklist_items
  FOR EACH ROW
BEGIN
  UPDATE task_checklist_items SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Task comments updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_task_comments_timestamp
  AFTER UPDATE ON task_comments
  FOR EACH ROW
BEGIN
  UPDATE task_comments SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Project members updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_project_members_timestamp
  AFTER UPDATE ON project_members
  FOR EACH ROW
BEGIN
  UPDATE project_members SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- TRIGGER FOR TASK COMPLETION TIMESTAMP
-- ============================================================================
CREATE TRIGGER IF NOT EXISTS set_task_completed_at
  AFTER UPDATE OF status ON project_tasks
  FOR EACH ROW
  WHEN NEW.status = 'completed' AND OLD.status != 'completed'
BEGIN
  UPDATE project_tasks SET completed_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- TRIGGER FOR CHECKLIST COMPLETION TIMESTAMP
-- ============================================================================
CREATE TRIGGER IF NOT EXISTS set_checklist_completed_at
  AFTER UPDATE OF is_completed ON task_checklist_items
  FOR EACH ROW
  WHEN NEW.is_completed = 1 AND OLD.is_completed = 0
BEGIN
  UPDATE task_checklist_items
  SET completed_at = datetime('now'),
      completed_by = NEW.updated_by
  WHERE id = NEW.id;
END;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for active projects with member counts
CREATE VIEW IF NOT EXISTS v_projects_summary AS
SELECT
  p.*,
  ou.name as branch_name,
  u.email as manager_email,
  u.full_name as manager_name,
  COUNT(DISTINCT pm.user_id) as member_count,
  COUNT(DISTINCT CASE WHEN pt.is_active = 1 THEN pt.id END) as task_count,
  COUNT(DISTINCT CASE WHEN pt.status = 'completed' AND pt.is_active = 1 THEN pt.id END) as completed_task_count
FROM projects p
LEFT JOIN organizational_units ou ON p.branch_id = ou.id
LEFT JOIN users u ON p.project_manager_id = u.id
LEFT JOIN project_members pm ON p.id = pm.project_id
LEFT JOIN project_tasks pt ON p.id = pt.project_id
WHERE p.is_active = 1
GROUP BY p.id;

-- View for tasks with assignment and dependency info
CREATE VIEW IF NOT EXISTS v_tasks_detailed AS
SELECT
  pt.*,
  p.name as project_name,
  p.branch_id,
  u.email as assigned_to_email,
  u.full_name as assigned_to_name,
  parent.title as parent_task_title,
  COUNT(DISTINCT tci.id) as checklist_total,
  COUNT(DISTINCT CASE WHEN tci.is_completed = 1 THEN tci.id END) as checklist_completed,
  COUNT(DISTINCT tc.id) as comment_count,
  COUNT(DISTINCT td.depends_on_task_id) as dependency_count
FROM project_tasks pt
JOIN projects p ON pt.project_id = p.id
LEFT JOIN users u ON pt.assigned_to = u.id
LEFT JOIN project_tasks parent ON pt.parent_task_id = parent.id
LEFT JOIN task_checklist_items tci ON pt.id = tci.task_id
LEFT JOIN task_comments tc ON pt.id = tc.task_id AND tc.is_deleted = 0
LEFT JOIN task_dependencies td ON pt.id = td.task_id
WHERE pt.is_active = 1
GROUP BY pt.id;

-- ============================================================================
-- PROJECT MATERIALS TABLE
-- ============================================================================
-- Simple Materials table
CREATE TABLE IF NOT EXISTS project_materials (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  quantity_needed REAL NOT NULL,
  quantity_received REAL DEFAULT 0,
  unit TEXT NOT NULL, -- 'pcs', 'kg', 'm', 'L', etc.
  unit_cost REAL,
  status TEXT NOT NULL CHECK (status IN ('not_ordered', 'ordered', 'received', 'in_use')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_materials_project ON project_materials(project_id);
CREATE INDEX idx_materials_status ON project_materials(status);
