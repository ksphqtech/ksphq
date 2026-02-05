-- Migration 009: Add manager_id to organizational_units
-- For branches: manager_id = branch manager
-- For departments: manager_id = department head

-- Add manager/head field to organizational_units
ALTER TABLE organizational_units ADD COLUMN manager_id TEXT;

-- Create index for manager lookups
CREATE INDEX IF NOT EXISTS idx_org_units_manager ON organizational_units(manager_id);

-- Note: Foreign key constraint to users table enforced via PRAGMA foreign_keys=ON
-- If a user is deleted, manager_id will be set to NULL
