/**
 * Test Database Helper
 * Creates and manages in-memory SQLite databases for testing
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Create a test database with schema
 * @returns {Database} SQLite database instance
 */
export function createTestDb() {
  // Create in-memory database
  const db = new Database(':memory:');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Read and execute schema migrations
  const migrations = [
    '001_create_users_table.sql',
    '002_create_roles_table.sql',
    '003_create_organizational_units.sql',
    '004_create_sessions_table.sql',
    '012_create_project_control_tables.sql',
  ];

  for (const migration of migrations) {
    const migrationPath = join(process.cwd(), 'migrations', migration);
    try {
      const sql = readFileSync(migrationPath, 'utf8');
      // Execute migration
      db.exec(sql);
    } catch (error) {
      console.warn(`Warning: Could not load migration ${migration}:`, error.message);
    }
  }

  return db;
}

/**
 * Wrap better-sqlite3 database to match D1 interface
 * @param {Database} sqliteDb - better-sqlite3 database
 * @returns {object} D1-compatible database wrapper
 */
export function wrapDbForD1(sqliteDb) {
  return {
    prepare(query) {
      const stmt = sqliteDb.prepare(query);

      return {
        bind(...params) {
          // D1 uses positional parameters
          return {
            first() {
              const result = stmt.get(...params);
              return result || null;
            },
            all() {
              const results = stmt.all(...params);
              return { results };
            },
            run() {
              const info = stmt.run(...params);
              return {
                success: true,
                meta: {
                  changes: info.changes,
                  last_row_id: info.lastInsertRowid,
                },
              };
            },
          };
        },
        first() {
          const result = stmt.get();
          return result || null;
        },
        all() {
          const results = stmt.all();
          return { results };
        },
        run() {
          const info = stmt.run();
          return {
            success: true,
            meta: {
              changes: info.changes,
              last_row_id: info.lastInsertRowid,
            },
          };
        },
      };
    },
  };
}

/**
 * Create a test user for use in tests
 * @param {object} db - D1-wrapped database
 * @param {object} overrides - Override default user properties
 * @returns {object} Created user
 */
export function createTestUser(db, overrides = {}) {
  const userId = overrides.id || `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const roleId = overrides.role_id || 'test-role-id';

  // Create default test role if it doesn't exist
  db.prepare(`
    INSERT OR IGNORE INTO roles (id, name, level, permissions, is_active)
    VALUES (?, 'Test Role', 50, '{}', 1)
  `).bind(roleId).run();

  const user = {
    id: userId,
    first_name: 'Test',
    last_name: 'User',
    email: `test-${Date.now()}@example.com`,
    role_id: roleId,
    is_active: 1,
    ...overrides,
  };

  db.prepare(`
    INSERT INTO users (
      id, first_name, last_name, email, password_hash,
      role_id, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'test-hash', ?, ?, datetime('now'), datetime('now'))
  `).bind(
    user.id,
    user.first_name,
    user.last_name,
    user.email,
    user.role_id,
    user.is_active
  ).run();

  return user;
}

/**
 * Create a test project for use in tests
 * @param {object} db - D1-wrapped database
 * @param {object} overrides - Override default project properties
 * @returns {object} Created project
 */
export function createTestProject(db, overrides = {}) {
  const projectId = overrides.id || `test-project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create test branch if needed
  const branchId = overrides.branch_id || 'test-branch-id';
  db.prepare(`
    INSERT OR IGNORE INTO organizational_units (id, type, name, is_active)
    VALUES (?, 'branch', 'Test Branch', 1)
  `).bind(branchId).run();

  // Create test user for project manager
  const managerId = overrides.project_manager_id || 'test-manager-id';
  const createdBy = overrides.created_by || managerId;

  try {
    createTestUser(db, { id: managerId });
  } catch (error) {
    // User might already exist
  }

  if (createdBy !== managerId) {
    try {
      createTestUser(db, { id: createdBy });
    } catch (error) {
      // User might already exist
    }
  }

  const project = {
    id: projectId,
    name: 'Test Project',
    description: 'Test project description',
    status: 'planning',
    priority: 'medium',
    branch_id: branchId,
    project_manager_id: managerId,
    created_by: createdBy,
    completion_percentage: 0,
    is_active: 1,
    ...overrides,
  };

  db.prepare(`
    INSERT INTO projects (
      id, name, description, status, priority, branch_id,
      project_manager_id, created_by, completion_percentage,
      is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    project.id,
    project.name,
    project.description,
    project.status,
    project.priority,
    project.branch_id,
    project.project_manager_id,
    project.created_by,
    project.completion_percentage,
    project.is_active
  ).run();

  return project;
}

/**
 * Clean up test database
 * @param {Database} db - SQLite database instance
 */
export function cleanupTestDb(db) {
  if (db) {
    db.close();
  }
}
