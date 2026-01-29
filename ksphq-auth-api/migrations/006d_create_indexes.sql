-- Migration 006d: Create indexes and enhance audit_logs

-- Create indexes for new user columns
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_active_not_deleted ON users(is_active, deleted_at);

-- Enhance audit_logs table
ALTER TABLE audit_logs ADD COLUMN target_user_id TEXT;
ALTER TABLE audit_logs ADD COLUMN changes TEXT;
ALTER TABLE audit_logs ADD COLUMN severity TEXT DEFAULT 'info';
ALTER TABLE audit_logs ADD COLUMN category TEXT DEFAULT 'other';

CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
