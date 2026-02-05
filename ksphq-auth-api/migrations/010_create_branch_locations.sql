-- Migration 010: Create branch_locations table for multi-location support

CREATE TABLE IF NOT EXISTS branch_locations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  branch_id TEXT NOT NULL,
  location_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state_province TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'USA',
  is_primary INTEGER NOT NULL DEFAULT 0,
  latitude REAL,
  longitude REAL,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,

  FOREIGN KEY (branch_id) REFERENCES organizational_units(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_branch_locations_branch ON branch_locations(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_locations_primary ON branch_locations(branch_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_branch_locations_active ON branch_locations(is_active);

-- Ensure only one primary location per active branch
-- This unique partial index enforces the constraint at the database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_branch_locations_single_primary
  ON branch_locations(branch_id)
  WHERE is_primary = 1 AND is_active = 1;
