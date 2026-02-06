/**
 * Project Queries Tests
 * Tests for CRUD operations and permission scoping
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestDb,
  cleanupTestDb,
  wrapDbForD1,
  createTestUser,
  createTestProject,
} from '../../helpers/testDb.js';
import {
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  listProjects,
} from '../../../src/db/projectQueries.js';

describe('Project Queries', () => {
  let sqliteDb;
  let db;
  let testUser;

  beforeEach(() => {
    sqliteDb = createTestDb();
    db = wrapDbForD1(sqliteDb);
    testUser = createTestUser(db);
  });

  afterEach(() => {
    cleanupTestDb(sqliteDb);
  });

  describe('createProject', () => {
    it('should create a project with required fields', async () => {
      const projectData = {
        name: 'New Project',
        project_manager_id: testUser.id,
        branch_id: 'test-branch-id',
        status: 'planning',
        priority: 'medium',
      };

      const project = await createProject(db, projectData, testUser.id);

      expect(project).toBeTruthy();
      expect(project.id).toBeTruthy();
      expect(project.name).toBe('New Project');
      expect(project.project_manager_id).toBe(testUser.id);
      expect(project.created_by).toBe(testUser.id);
      expect(project.is_active).toBe(1);
      expect(project.completion_percentage).toBe(0);
    });

    it('should create a project with optional fields', async () => {
      const projectData = {
        name: 'Full Project',
        description: 'Detailed description',
        project_manager_id: testUser.id,
        branch_id: 'test-branch-id',
        status: 'in progress',
        priority: 'high',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        budget_amount: 100000,
        completion_percentage: 25,
      };

      const project = await createProject(db, projectData, testUser.id);

      expect(project.description).toBe('Detailed description');
      expect(project.status).toBe('in progress');
      expect(project.priority).toBe('high');
      expect(project.start_date).toBe('2024-01-01');
      expect(project.end_date).toBe('2024-12-31');
      expect(project.budget_amount).toBe(100000);
      expect(project.completion_percentage).toBe(25);
    });

    it('should enforce CHECK constraint for invalid status', async () => {
      const projectData = {
        name: 'Invalid Status Project',
        project_manager_id: testUser.id,
        branch_id: 'test-branch-id',
        status: 'invalid_status', // Invalid
        priority: 'medium',
      };

      await expect(createProject(db, projectData, testUser.id)).rejects.toThrow();
    });

    it('should enforce CHECK constraint for invalid priority', async () => {
      const projectData = {
        name: 'Invalid Priority Project',
        project_manager_id: testUser.id,
        branch_id: 'test-branch-id',
        status: 'planning',
        priority: 'critical', // Invalid
      };

      await expect(createProject(db, projectData, testUser.id)).rejects.toThrow();
    });

    it('should enforce CHECK constraint for completion_percentage > 100', async () => {
      const projectData = {
        name: 'Over 100% Project',
        project_manager_id: testUser.id,
        branch_id: 'test-branch-id',
        status: 'planning',
        priority: 'medium',
        completion_percentage: 150, // Invalid
      };

      await expect(createProject(db, projectData, testUser.id)).rejects.toThrow();
    });

    it('should enforce CHECK constraint for completion_percentage < 0', async () => {
      const projectData = {
        name: 'Negative % Project',
        project_manager_id: testUser.id,
        branch_id: 'test-branch-id',
        status: 'planning',
        priority: 'medium',
        completion_percentage: -10, // Invalid
      };

      await expect(createProject(db, projectData, testUser.id)).rejects.toThrow();
    });
  });

  describe('getProjectById', () => {
    it('should retrieve a project by ID', async () => {
      const created = createTestProject(db, { name: 'Get Test Project' });

      const project = await getProjectById(db, created.id);

      expect(project).toBeTruthy();
      expect(project.id).toBe(created.id);
      expect(project.name).toBe('Get Test Project');
    });

    it('should return project_manager_name (not just manager)', async () => {
      const created = createTestProject(db);

      const project = await getProjectById(db, created.id);

      // The query should join with users and provide project_manager_name
      expect(project).toHaveProperty('project_manager_name');
    });

    it('should return completion_percentage', async () => {
      const created = createTestProject(db, { completion_percentage: 50 });

      const project = await getProjectById(db, created.id);

      expect(project.completion_percentage).toBe(50);
    });

    it('should throw NotFoundError for non-existent project', async () => {
      await expect(getProjectById(db, 'non-existent-id')).rejects.toThrow();
    });

    it('should not return soft-deleted projects', async () => {
      const created = createTestProject(db);

      // Soft delete the project
      await deleteProject(db, created.id, testUser.id);

      // Should throw NotFoundError
      await expect(getProjectById(db, created.id)).rejects.toThrow();
    });
  });

  describe('updateProject', () => {
    it('should update project fields', async () => {
      const created = createTestProject(db);

      const updates = {
        name: 'Updated Name',
        status: 'in progress',
        completion_percentage: 75,
      };

      const updated = await updateProject(db, created.id, updates, testUser.id);

      expect(updated.name).toBe('Updated Name');
      expect(updated.status).toBe('in progress');
      expect(updated.completion_percentage).toBe(75);
      expect(updated.updated_by).toBe(testUser.id);
    });

    it('should not update is_active directly (soft delete only)', async () => {
      const created = createTestProject(db);

      const updates = {
        is_active: 0, // Try to soft delete
      };

      await updateProject(db, created.id, updates, testUser.id);

      const project = await getProjectById(db, created.id);
      // Should still be active (updateProject shouldn't allow is_active changes)
      expect(project.is_active).toBe(1);
    });

    it('should track updated_by user', async () => {
      const created = createTestProject(db);
      const updater = createTestUser(db, { id: 'updater-id' });

      const updates = {
        name: 'Updated by different user',
      };

      const updated = await updateProject(db, created.id, updates, updater.id);

      expect(updated.updated_by).toBe(updater.id);
    });
  });

  describe('deleteProject (soft delete)', () => {
    it('should soft delete a project', async () => {
      const created = createTestProject(db);

      await deleteProject(db, created.id, testUser.id);

      // Should throw NotFoundError when trying to get deleted project
      await expect(getProjectById(db, created.id)).rejects.toThrow();
    });

    it('should set is_active to 0 (not delete row)', async () => {
      const created = createTestProject(db);

      await deleteProject(db, created.id, testUser.id);

      // Query directly to verify row still exists but is_active = 0
      const result = db.prepare(`
        SELECT * FROM projects WHERE id = ?
      `).bind(created.id).first();

      expect(result).toBeTruthy();
      expect(result.is_active).toBe(0);
    });

    it('should track updated_by when soft deleting', async () => {
      const created = createTestProject(db);

      await deleteProject(db, created.id, testUser.id);

      const result = db.prepare(`
        SELECT * FROM projects WHERE id = ?
      `).bind(created.id).first();

      expect(result.updated_by).toBe(testUser.id);
    });
  });

  describe('listProjects', () => {
    beforeEach(() => {
      // Create multiple test projects
      createTestProject(db, {
        name: 'Project Alpha',
        status: 'planning',
        priority: 'high',
      });
      createTestProject(db, {
        name: 'Project Beta',
        status: 'in progress',
        priority: 'medium',
      });
      createTestProject(db, {
        name: 'Project Gamma',
        status: 'completed',
        priority: 'low',
      });
    });

    it('should list all active projects', async () => {
      const currentUser = {
        id: testUser.id,
        role_level: 100, // Admin
        role_permissions: { projects: 'full' },
      };

      const result = await listProjects(db, {}, testUser.id, currentUser);

      expect(result.projects).toBeTruthy();
      expect(result.projects.length).toBe(3);
      expect(result.total).toBe(3);
    });

    it('should filter by status', async () => {
      const currentUser = {
        id: testUser.id,
        role_level: 100,
        role_permissions: { projects: 'full' },
      };

      const result = await listProjects(
        db,
        { status: 'in progress' },
        testUser.id,
        currentUser
      );

      expect(result.projects.length).toBe(1);
      expect(result.projects[0].name).toBe('Project Beta');
    });

    it('should filter by priority', async () => {
      const currentUser = {
        id: testUser.id,
        role_level: 100,
        role_permissions: { projects: 'full' },
      };

      const result = await listProjects(
        db,
        { priority: 'high' },
        testUser.id,
        currentUser
      );

      expect(result.projects.length).toBe(1);
      expect(result.projects[0].name).toBe('Project Alpha');
    });

    it('should return project_manager_name field', async () => {
      const currentUser = {
        id: testUser.id,
        role_level: 100,
        role_permissions: { projects: 'full' },
      };

      const result = await listProjects(db, {}, testUser.id, currentUser);

      expect(result.projects[0]).toHaveProperty('project_manager_name');
    });

    it('should return completion_percentage field', async () => {
      const currentUser = {
        id: testUser.id,
        role_level: 100,
        role_permissions: { projects: 'full' },
      };

      const result = await listProjects(db, {}, testUser.id, currentUser);

      expect(result.projects[0]).toHaveProperty('completion_percentage');
    });

    it('should not include soft-deleted projects by default', async () => {
      const currentUser = {
        id: testUser.id,
        role_level: 100,
        role_permissions: { projects: 'full' },
      };

      // Soft delete one project
      const projects = await listProjects(db, {}, testUser.id, currentUser);
      await deleteProject(db, projects.projects[0].id, testUser.id);

      const result = await listProjects(db, {}, testUser.id, currentUser);

      expect(result.projects.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should support pagination', async () => {
      const currentUser = {
        id: testUser.id,
        role_level: 100,
        role_permissions: { projects: 'full' },
      };

      const result = await listProjects(
        db,
        { page: 1, limit: 2 },
        testUser.id,
        currentUser
      );

      expect(result.projects.length).toBe(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
    });
  });
});
