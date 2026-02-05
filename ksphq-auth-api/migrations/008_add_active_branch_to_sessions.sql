-- Track which branch user is currently viewing
ALTER TABLE user_sessions ADD COLUMN active_branch_id TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_active_branch ON user_sessions(active_branch_id);
