-- Performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_users_active
  ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_users_last_activity
  ON users(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires
  ON refresh_tokens(expires_at);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_valid
  ON refresh_tokens(user_id, revoked_at, expires_at);

-- Optimize database
PRAGMA optimize;
