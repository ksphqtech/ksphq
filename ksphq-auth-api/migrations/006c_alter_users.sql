-- Migration 006c: Add new columns to users table

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
ALTER TABLE users ADD COLUMN account_expires_at TEXT;

-- Security fields
ALTER TABLE users ADD COLUMN failed_login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TEXT;
ALTER TABLE users ADD COLUMN last_failed_login_at TEXT;
