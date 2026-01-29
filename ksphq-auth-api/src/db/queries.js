/**
 * Database query functions for D1
 * All queries use prepared statements to prevent SQL injection
 */

/**
 * Create a new user
 */
export async function createUser(db, { email, passwordHash, role = 'user' }) {
  const result = await db
    .prepare(
      `INSERT INTO users (email, password_hash, role)
       VALUES (?, ?, ?)
       RETURNING id, email, role, perm_workforce, perm_docks, perm_projects, perm_tickets, idle_timeout_minutes, created_at`
    )
    .bind(email, passwordHash, role)
    .first();

  return result;
}

/**
 * Find user by email
 */
export async function findUserByEmail(db, email) {
  const result = await db
    .prepare(
      `SELECT u.id, u.email, u.password_hash, u.role, u.role_id,
              u.first_name, u.last_name,
              u.perm_workforce, u.perm_docks, u.perm_projects, u.perm_tickets,
              u.is_active, u.idle_timeout_minutes, u.last_activity_at,
              u.password_reset_required, u.deleted_at,
              r.level as role_level,
              r.name as role_name,
              r.permissions as role_permissions
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? COLLATE NOCASE`
    )
    .bind(email)
    .first();

  return result;
}

/**
 * Find user by ID
 */
export async function findUserById(db, userId) {
  const result = await db
    .prepare(
      `SELECT u.id, u.email, u.role, u.role_id,
              u.first_name, u.last_name,
              u.perm_workforce, u.perm_docks, u.perm_projects, u.perm_tickets,
              u.is_active, u.idle_timeout_minutes, u.last_activity_at,
              u.password_reset_required,
              r.level as role_level,
              r.name as role_name,
              r.permissions as role_permissions
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`
    )
    .bind(userId)
    .first();

  return result;
}

/**
 * Update user last login timestamp
 */
export async function updateLastLogin(db, userId) {
  await db
    .prepare(
      `UPDATE users
       SET last_login_at = datetime('now'),
           last_activity_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(userId)
    .run();
}

/**
 * Update user last activity timestamp
 */
export async function updateLastActivity(db, userId) {
  await db
    .prepare(
      `UPDATE users
       SET last_activity_at = datetime('now')
       WHERE id = ?`
    )
    .bind(userId)
    .run();
}

/**
 * Update user profile
 */
export async function updateUser(db, userId, updates) {
  const fields = [];
  const values = [];

  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }

  if (updates.idleTimeoutMinutes !== undefined) {
    fields.push('idle_timeout_minutes = ?');
    values.push(updates.idleTimeoutMinutes);
  }

  if (fields.length === 0) {
    return await findUserById(db, userId);
  }

  fields.push("updated_at = datetime('now')");
  values.push(userId);

  const result = await db
    .prepare(
      `UPDATE users
       SET ${fields.join(', ')}
       WHERE id = ?
       RETURNING id, email, role, perm_workforce, perm_docks, perm_projects, perm_tickets, idle_timeout_minutes`
    )
    .bind(...values)
    .first();

  return result;
}

/**
 * Update user password
 */
export async function updatePassword(db, userId, newPasswordHash) {
  await db
    .prepare(
      `UPDATE users
       SET password_hash = ?,
           password_reset_required = 0,
           updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(newPasswordHash, userId)
    .run();
}

/**
 * Get user password hash
 */
export async function getUserPasswordHash(db, userId) {
  const result = await db
    .prepare(
      `SELECT password_hash
       FROM users
       WHERE id = ?`
    )
    .bind(userId)
    .first();

  return result?.password_hash || null;
}

/**
 * Create refresh token
 */
export async function createRefreshToken(db, { userId, tokenHash, expiresAt, ipAddress, userAgent }) {
  const result = await db
    .prepare(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`
    )
    .bind(userId, tokenHash, expiresAt, ipAddress, userAgent)
    .first();

  return result.id;
}

/**
 * Find refresh token by hash
 */
export async function findRefreshToken(db, tokenHash) {
  const result = await db
    .prepare(
      `SELECT id, user_id, expires_at, revoked_at
       FROM refresh_tokens
       WHERE token_hash = ?`
    )
    .bind(tokenHash)
    .first();

  return result;
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(db, tokenId) {
  await db
    .prepare(
      `UPDATE refresh_tokens
       SET revoked_at = datetime('now')
       WHERE id = ?`
    )
    .bind(tokenId)
    .run();
}

/**
 * Revoke all user refresh tokens
 */
export async function revokeAllUserTokens(db, userId) {
  await db
    .prepare(
      `UPDATE refresh_tokens
       SET revoked_at = datetime('now')
       WHERE user_id = ? AND revoked_at IS NULL`
    )
    .bind(userId)
    .run();
}

/**
 * Clean up expired tokens
 */
export async function cleanupExpiredTokens(db) {
  await db
    .prepare(
      `DELETE FROM refresh_tokens
       WHERE expires_at < datetime('now')
       OR revoked_at IS NOT NULL AND revoked_at < datetime('now', '-30 days')`
    )
    .run();
}

/**
 * Create audit log entry
 */
export async function createAuditLog(db, { userId, action, resource, details, ipAddress, userAgent }) {
  await db
    .prepare(
      `INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(userId || null, action, resource || null, details || null, ipAddress, userAgent)
    .run();
}

/**
 * Get user audit logs
 */
export async function getUserAuditLogs(db, userId, limit = 50) {
  const results = await db
    .prepare(
      `SELECT action, resource, details, ip_address, created_at
       FROM audit_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .bind(userId, limit)
    .all();

  return results.results || [];
}

/**
 * Revoke access token by adding to blacklist
 */
export async function revokeAccessToken(db, jti, userId, expiresAt, reason = 'logout') {
  await db.prepare(
    `INSERT OR IGNORE INTO revoked_access_tokens (jti, user_id, expires_at, reason)
     VALUES (?, ?, ?, ?)`
  ).bind(jti, userId, expiresAt, reason).run();
}

/**
 * Check if access token is revoked
 */
export async function isAccessTokenRevoked(db, jti) {
  const result = await db.prepare(
    `SELECT jti FROM revoked_access_tokens
     WHERE jti = ? AND expires_at > datetime('now')`
  ).bind(jti).first();

  return !!result;
}

/**
 * Clean up expired revoked tokens
 */
export async function cleanupRevokedAccessTokens(db) {
  await db.prepare(
    `DELETE FROM revoked_access_tokens
     WHERE expires_at < datetime('now')`
  ).run();
}
