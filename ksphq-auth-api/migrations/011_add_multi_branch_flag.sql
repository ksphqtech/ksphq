-- Migration 011: Add is_multi_branch flag to organizational_units

-- Add flag to indicate if department is multi-branch (organization-wide)
-- Default: 0 (branch-specific)
-- Only admins and branch admins (role_level >= 80) can set to 1
ALTER TABLE organizational_units ADD COLUMN is_multi_branch INTEGER NOT NULL DEFAULT 0;

-- Create index for filtering multi-branch departments
CREATE INDEX IF NOT EXISTS idx_org_units_multi_branch ON organizational_units(is_multi_branch);
