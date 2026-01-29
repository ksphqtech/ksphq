-- Drop problematic indexes with WHERE clauses
DROP INDEX IF EXISTS idx_rate_limits_reset;
DROP INDEX IF EXISTS idx_revoked_tokens_jti;
DROP INDEX IF EXISTS idx_users_active;
DROP INDEX IF EXISTS idx_refresh_tokens_expires;

-- Recreate indexes without WHERE clauses
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset
  ON rate_limits(reset_time);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_jti
  ON revoked_access_tokens(jti);

CREATE INDEX IF NOT EXISTS idx_users_active
  ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires
  ON refresh_tokens(expires_at);
