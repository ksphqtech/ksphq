-- Revoked access tokens (short-lived storage)
CREATE TABLE IF NOT EXISTS revoked_access_tokens (
  jti TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  revoked_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  reason TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for fast lookup during auth check
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_jti
  ON revoked_access_tokens(jti);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires
  ON revoked_access_tokens(expires_at);
