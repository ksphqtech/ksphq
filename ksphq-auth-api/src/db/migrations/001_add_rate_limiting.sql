-- Persistent rate limiting storage
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 1,
  reset_time TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for fast lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset
  ON rate_limits(reset_time);
