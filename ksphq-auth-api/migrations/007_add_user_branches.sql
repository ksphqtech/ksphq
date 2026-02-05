-- Many-to-many relationship: users can belong to multiple branches
CREATE TABLE IF NOT EXISTS user_branches (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES organizational_units(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE(user_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_user_branches_user ON user_branches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_branch ON user_branches(branch_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_primary ON user_branches(user_id, is_primary);

-- Backfill from existing users.branch_id
INSERT INTO user_branches (user_id, branch_id, is_primary, created_by)
SELECT
  u.id,
  u.branch_id,
  1,
  u.id
FROM users u
WHERE u.branch_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM user_branches ub
  WHERE ub.user_id = u.id AND ub.branch_id = u.branch_id
);
