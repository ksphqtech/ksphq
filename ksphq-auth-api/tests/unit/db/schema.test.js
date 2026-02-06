/**
 * Schema Validation Tests
 * Critical tests to prevent schema mismatch regressions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, cleanupTestDb, wrapDbForD1 } from '../../helpers/testDb.js';

describe('Database Schema Validation', () => {
  let sqliteDb;
  let db;

  beforeAll(() => {
    sqliteDb = createTestDb();
    db = wrapDbForD1(sqliteDb);
  });

  afterAll(() => {
    cleanupTestDb(sqliteDb);
  });

  describe('Projects Table', () => {
    it('should exist with correct name (projects, not project)', () => {
      const result = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='projects'
      `).first();

      expect(result).toBeTruthy();
      expect(result.name).toBe('projects');
    });

    it('should have is_active column (not deleted_at)', () => {
      const result = db.prepare(`
        PRAGMA table_info(projects)
      `).all();

      const columns = result.results.map(col => col.name);

      expect(columns).toContain('is_active');
      expect(columns).not.toContain('deleted_at');
    });

    it('should have project_manager_id column', () => {
      const result = db.prepare(`
        PRAGMA table_info(projects)
      `).all();

      const columns = result.results.map(col => col.name);
      expect(columns).toContain('project_manager_id');
    });

    it('should have completion_percentage column (not just completion)', () => {
      const result = db.prepare(`
        PRAGMA table_info(projects)
      `).all();

      const columns = result.results.map(col => col.name);
      expect(columns).toContain('completion_percentage');
    });

    it('should have all required columns', () => {
      const result = db.prepare(`
        PRAGMA table_info(projects)
      `).all();

      const columns = result.results.map(col => col.name);
      const requiredColumns = [
        'id',
        'name',
        'description',
        'branch_id',
        'status',
        'priority',
        'start_date',
        'end_date',
        'actual_start_date',
        'actual_end_date',
        'completion_percentage',
        'budget_amount',
        'actual_cost',
        'project_manager_id',
        'created_by',
        'is_active',
        'created_at',
        'updated_at',
      ];

      for (const col of requiredColumns) {
        expect(columns, `Missing column: ${col}`).toContain(col);
      }
    });

    it('should have CHECK constraint for status', () => {
      const result = db.prepare(`
        SELECT sql FROM sqlite_master
        WHERE type='table' AND name='projects'
      `).first();

      expect(result.sql).toContain('CHECK');
      expect(result.sql).toMatch(/status.*CHECK.*IN.*planning.*in progress.*on hold.*completed.*cancelled/i);
    });

    it('should have CHECK constraint for priority', () => {
      const result = db.prepare(`
        SELECT sql FROM sqlite_master
        WHERE type='table' AND name='projects'
      `).first();

      expect(result.sql).toMatch(/priority.*CHECK.*IN.*low.*medium.*high.*urgent/i);
    });

    it('should have CHECK constraint for completion_percentage (0-100)', () => {
      const result = db.prepare(`
        SELECT sql FROM sqlite_master
        WHERE type='table' AND name='projects'
      `).first();

      expect(result.sql).toMatch(/completion_percentage.*CHECK.*>=.*0.*<=.*100/i);
    });

    it('should have foreign key to organizational_units (branch_id)', () => {
      const result = db.prepare(`
        PRAGMA foreign_key_list(projects)
      `).all();

      const fkToBranch = result.results.find(fk => fk.from === 'branch_id');
      expect(fkToBranch).toBeTruthy();
      expect(fkToBranch.table).toBe('organizational_units');
    });

    it('should have foreign key to users (project_manager_id)', () => {
      const result = db.prepare(`
        PRAGMA foreign_key_list(projects)
      `).all();

      const fkToManager = result.results.find(fk => fk.from === 'project_manager_id');
      expect(fkToManager).toBeTruthy();
      expect(fkToManager.table).toBe('users');
    });
  });

  describe('Project Tasks Table', () => {
    it('should exist with correct name (project_tasks, not tasks)', () => {
      const result = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='project_tasks'
      `).first();

      expect(result).toBeTruthy();
      expect(result.name).toBe('project_tasks');
    });

    it('should have is_active column (not deleted_at)', () => {
      const result = db.prepare(`
        PRAGMA table_info(project_tasks)
      `).all();

      const columns = result.results.map(col => col.name);

      expect(columns).toContain('is_active');
      expect(columns).not.toContain('deleted_at');
    });

    it('should have all required columns', () => {
      const result = db.prepare(`
        PRAGMA table_info(project_tasks)
      `).all();

      const columns = result.results.map(col => col.name);
      const requiredColumns = [
        'id',
        'project_id',
        'title',
        'description',
        'status',
        'priority',
        'assigned_to',
        'start_date',
        'due_date',
        'estimated_hours',
        'actual_hours',
        'is_active',
        'created_at',
        'updated_at',
      ];

      for (const col of requiredColumns) {
        expect(columns, `Missing column: ${col}`).toContain(col);
      }
    });

    it('should have CHECK constraint for status', () => {
      const result = db.prepare(`
        SELECT sql FROM sqlite_master
        WHERE type='table' AND name='project_tasks'
      `).first();

      expect(result.sql).toMatch(/status.*CHECK.*IN.*planning.*in progress.*on hold.*completed.*cancelled/i);
    });

    it('should have CHECK constraint for priority', () => {
      const result = db.prepare(`
        SELECT sql FROM sqlite_master
        WHERE type='table' AND name='project_tasks'
      `).first();

      expect(result.sql).toMatch(/priority.*CHECK.*IN.*low.*medium.*high.*urgent/i);
    });

    it('should have foreign key to projects', () => {
      const result = db.prepare(`
        PRAGMA foreign_key_list(project_tasks)
      `).all();

      const fkToProject = result.results.find(fk => fk.from === 'project_id');
      expect(fkToProject).toBeTruthy();
      expect(fkToProject.table).toBe('projects');
      expect(fkToProject.on_delete).toBe('CASCADE');
    });
  });

  describe('Project Materials Table', () => {
    it('should exist', () => {
      const result = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='project_materials'
      `).first();

      expect(result).toBeTruthy();
    });

    it('should have CHECK constraint for status', () => {
      const result = db.prepare(`
        SELECT sql FROM sqlite_master
        WHERE type='table' AND name='project_materials'
      `).first();

      expect(result.sql).toMatch(/status.*CHECK.*IN.*not_ordered.*ordered.*received.*in_use/i);
    });

    it('should have foreign key to projects with CASCADE delete', () => {
      const result = db.prepare(`
        PRAGMA foreign_key_list(project_materials)
      `).all();

      const fkToProject = result.results.find(fk => fk.from === 'project_id');
      expect(fkToProject).toBeTruthy();
      expect(fkToProject.table).toBe('projects');
      expect(fkToProject.on_delete).toBe('CASCADE');
    });
  });

  describe('Task Dependencies Table', () => {
    it('should exist', () => {
      const result = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='project_task_dependencies'
      `).first();

      expect(result).toBeTruthy();
    });

    it('should have CHECK constraint for dependency_type', () => {
      const result = db.prepare(`
        SELECT sql FROM sqlite_master
        WHERE type='table' AND name='project_task_dependencies'
      `).first();

      expect(result.sql).toMatch(/dependency_type.*CHECK.*IN.*finish_to_start.*start_to_start.*finish_to_finish/i);
    });

    it('should have foreign keys to project_tasks with CASCADE delete', () => {
      const result = db.prepare(`
        PRAGMA foreign_key_list(project_task_dependencies)
      `).all();

      const fkToTask = result.results.find(fk => fk.from === 'task_id');
      const fkToDependsOn = result.results.find(fk => fk.from === 'depends_on_task_id');

      expect(fkToTask).toBeTruthy();
      expect(fkToTask.table).toBe('project_tasks');
      expect(fkToTask.on_delete).toBe('CASCADE');

      expect(fkToDependsOn).toBeTruthy();
      expect(fkToDependsOn.table).toBe('project_tasks');
      expect(fkToDependsOn.on_delete).toBe('CASCADE');
    });
  });

  describe('Project Members Table', () => {
    it('should exist', () => {
      const result = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='project_members'
      `).first();

      expect(result).toBeTruthy();
    });

    it('should have foreign keys with appropriate delete actions', () => {
      const result = db.prepare(`
        PRAGMA foreign_key_list(project_members)
      `).all();

      const fkToProject = result.results.find(fk => fk.from === 'project_id');
      const fkToUser = result.results.find(fk => fk.from === 'user_id');

      expect(fkToProject).toBeTruthy();
      expect(fkToProject.table).toBe('projects');
      expect(fkToProject.on_delete).toBe('CASCADE');

      expect(fkToUser).toBeTruthy();
      expect(fkToUser.table).toBe('users');
      expect(fkToUser.on_delete).toBe('CASCADE');
    });
  });

  describe('Data Integrity', () => {
    it('should enforce NOT NULL constraints on required fields', () => {
      const result = db.prepare(`
        PRAGMA table_info(projects)
      `).all();

      const nameCol = result.results.find(col => col.name === 'name');
      const statusCol = result.results.find(col => col.name === 'status');
      const priorityCol = result.results.find(col => col.name === 'priority');
      const branchIdCol = result.results.find(col => col.name === 'branch_id');
      const createdByCol = result.results.find(col => col.name === 'created_by');

      expect(nameCol.notnull).toBe(1);
      expect(statusCol.notnull).toBe(1);
      expect(priorityCol.notnull).toBe(1);
      expect(branchIdCol.notnull).toBe(1);
      expect(createdByCol.notnull).toBe(1);
    });

    it('should have default values for status and priority', () => {
      const result = db.prepare(`
        PRAGMA table_info(projects)
      `).all();

      const statusCol = result.results.find(col => col.name === 'status');
      const priorityCol = result.results.find(col => col.name === 'priority');

      expect(statusCol.dflt_value).toBeTruthy();
      expect(priorityCol.dflt_value).toBeTruthy();
    });

    it('should have default value for completion_percentage', () => {
      const result = db.prepare(`
        PRAGMA table_info(projects)
      `).all();

      const completionCol = result.results.find(col => col.name === 'completion_percentage');

      expect(completionCol.dflt_value).toBe('0');
    });

    it('should have default value for is_active', () => {
      const result = db.prepare(`
        PRAGMA table_info(projects)
      `).all();

      const isActiveCol = result.results.find(col => col.name === 'is_active');

      expect(isActiveCol.dflt_value).toBe('1');
    });
  });
});
