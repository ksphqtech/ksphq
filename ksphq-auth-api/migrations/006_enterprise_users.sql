-- Migration 006: Enterprise User Management System
-- Created: 2026-01-29
-- Description: Transform basic user management into enterprise-grade system with:
--   - 6-tier role hierarchy (customizable)
--   - Organizational structure (branches, departments, shifts, teams, groups)
--   - Advanced user fields (name, phone, title, manager relationships)
--   - Soft delete with recovery
--   - Comprehensive audit tracking
--   - Enhanced security (lockout, password policies, session management)

-- ============================================================================
-- PART 1: NEW TABLES
-- ============================================================================

-- Organizational Units Table
-- Supports hierarchy: branches > departments > teams, shifts, groups
CREATE TABLE IF NOT EXISTS organizational_units (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  type TEXT NOT NULL CHECK (type IN ('branch', 'department', 'shift', 'team', 'group')),
  name TEXT NOT NULL,
  code TEXT, -- Short code like 'HQ', 'IT', 'DAY-SHIFT'
  parent_id TEXT, -- For hierarchy (dept under branch, team under dept)
  metadata TEXT, -- JSON for type-specific fields (address for branch, etc.)
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,

  FOREIGN KEY (parent_id) REFERENCES organizational_units(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_org_units_type ON organizational_units(type);
CREATE INDEX idx_org_units_parent ON organizational_units(parent_id);
CREATE INDEX idx_org_units_active ON organizational_units(is_active);
CREATE UNIQUE INDEX idx_org_units_type_name ON organizational_units(type, name) WHERE is_active = 1;

-- Roles Table (Customizable Role System)
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL, -- Hierarchy level (1-100, higher = more privileged)
  description TEXT,
  permissions TEXT, -- JSON object of permissions
  is_system_role INTEGER DEFAULT 0, -- System roles can't be deleted
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_roles_level ON roles(level);
CREATE INDEX idx_roles_active ON roles(is_active);

-- Seed default 6 roles
INSERT INTO roles (name, level, description, permissions, is_system_role) VALUES
  ('Admin', 100, 'Full system access', '{"all": true, "workforce": true, "docks": true, "projects": true, "tickets": true, "user_management": "full"}', 1),
  ('Branch Manager', 80, 'Manage branch operations', '{"workforce": true, "docks": true, "projects": true, "tickets": true, "user_management": "branch"}', 1),
  ('Senior Manager', 60, 'Department leadership', '{"workforce": true, "docks": true, "projects": true, "tickets": true, "user_management": "department"}', 1),
  ('Manager', 40, 'Team management', '{"workforce": true, "docks": true, "projects": false, "tickets": true, "user_management": "team"}', 1),
  ('Team Leader', 20, 'Lead team members', '{"workforce": true, "docks": false, "projects": false, "tickets": true, "user_management": "view_team"}', 1),
  ('Employee', 10, 'Standard access', '{"workforce": false, "docks": false, "projects": false, "tickets": false, "user_management": "view_self"}', 1);

-- User Sessions Table (Enhanced Session Tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  session_token_hash TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT,
  device_name TEXT, -- e.g., "Chrome on Windows"
  ip_address TEXT,
  user_agent TEXT,
  location TEXT, -- Derived from IP geolocation
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  last_activity_at TEXT,
  revoked_at TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Password History Table
CREATE TABLE IF NOT EXISTS password_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_history_user ON password_history(user_id);
CREATE INDEX idx_password_history_created ON password_history(created_at);

-- Failed Login Attempts Table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL,
  ip_address TEXT,
  device_fingerprint TEXT,
  attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
  reason TEXT -- 'invalid_password', 'account_locked', 'account_not_found'
);

CREATE INDEX idx_failed_logins_email ON failed_login_attempts(email);
CREATE INDEX idx_failed_logins_attempted ON failed_login_attempts(attempted_at);

-- ============================================================================
-- PART 2: ENHANCE EXISTING TABLES
-- ============================================================================

-- Add new columns to users table

-- Profile fields
ALTER TABLE users ADD COLUMN first_name TEXT;
ALTER TABLE users ADD COLUMN last_name TEXT;
ALTER TABLE users ADD COLUMN phone_number TEXT;
ALTER TABLE users ADD COLUMN employee_id TEXT;
ALTER TABLE users ADD COLUMN title TEXT;

-- Organizational fields
ALTER TABLE users ADD COLUMN role_id TEXT;
ALTER TABLE users ADD COLUMN branch_id TEXT;
ALTER TABLE users ADD COLUMN department_id TEXT;
ALTER TABLE users ADD COLUMN shift_id TEXT;
ALTER TABLE users ADD COLUMN team_id TEXT;
ALTER TABLE users ADD COLUMN group_id TEXT;
ALTER TABLE users ADD COLUMN manager_id TEXT;

-- Audit/tracking fields
ALTER TABLE users ADD COLUMN created_by TEXT;
ALTER TABLE users ADD COLUMN last_modified_by TEXT;
ALTER TABLE users ADD COLUMN last_modified_at TEXT;

-- Soft delete fields
ALTER TABLE users ADD COLUMN deleted_at TEXT;
ALTER TABLE users ADD COLUMN deleted_by TEXT;

-- Password management
ALTER TABLE users ADD COLUMN password_reset_required INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN password_changed_at TEXT;
ALTER TABLE users ADD COLUMN password_expires_at TEXT;
ALTER TABLE users ADD COLUMN account_expires_at TEXT; -- For contractors

-- Security fields
ALTER TABLE users ADD COLUMN failed_login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TEXT;
ALTER TABLE users ADD COLUMN last_failed_login_at TEXT;

-- Note: idle_timeout_minutes already exists in base schema, skipping

-- Create indexes for new user columns
CREATE INDEX idx_users_first_name ON users(first_name);
CREATE INDEX idx_users_last_name ON users(last_name);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_users_deleted ON users(deleted_at);
CREATE INDEX idx_users_active_not_deleted ON users(is_active, deleted_at);

-- Enhance audit_logs table
ALTER TABLE audit_logs ADD COLUMN target_user_id TEXT;
ALTER TABLE audit_logs ADD COLUMN changes TEXT; -- JSON of before/after values
ALTER TABLE audit_logs ADD COLUMN severity TEXT DEFAULT 'info';
ALTER TABLE audit_logs ADD COLUMN category TEXT DEFAULT 'other';

CREATE INDEX idx_audit_logs_target_user ON audit_logs(target_user_id);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);

-- ============================================================================
-- PART 3: DATA MIGRATION
-- ============================================================================

-- Map existing 'role' column to new 'role_id' foreign key
UPDATE users SET role_id = (
  SELECT id FROM roles WHERE
    (users.role = 'admin' AND roles.name = 'Admin') OR
    (users.role = 'manager' AND roles.name = 'Manager') OR
    (users.role = 'user' AND roles.name = 'Employee')
)
WHERE role_id IS NULL;

-- Set default values for new required fields
UPDATE users SET
  password_reset_required = 0,
  failed_login_count = 0,
  password_changed_at = COALESCE(password_changed_at, created_at),
  idle_timeout_minutes = COALESCE(idle_timeout_minutes, 60)
WHERE password_changed_at IS NULL OR idle_timeout_minutes IS NULL;

-- ============================================================================
-- PART 4: VERIFICATION QUERIES
-- ============================================================================

-- Verify roles were created
SELECT 'Roles created:' as check_type, COUNT(*) as count FROM roles;

-- Verify user migration worked
SELECT 'Users migrated:' as check_type, COUNT(*) as count FROM users WHERE role_id IS NOT NULL;

-- Verify tables exist
SELECT 'Tables created:' as check_type, COUNT(*) as count
FROM sqlite_master
WHERE type = 'table'
AND name IN ('organizational_units', 'roles', 'user_sessions', 'password_history', 'failed_login_attempts');
