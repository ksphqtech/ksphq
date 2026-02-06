/**
 * Project Validation Tests
 * Tests for Zod validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  createProjectSchema,
  updateProjectSchema,
  createTaskSchema,
  updateTaskSchema,
  createMaterialSchema,
  updateMaterialSchema,
  listProjectsQuerySchema,
} from '../../../src/utils/projectValidation.js';

describe('Project Validation Schemas', () => {
  describe('createProjectSchema', () => {
    it('should validate valid project data', () => {
      const validData = {
        name: 'Test Project',
        project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'planning',
        priority: 'medium',
      };

      const result = createProjectSchema.parse(validData);

      expect(result.name).toBe('Test Project');
      expect(result.status).toBe('planning');
      expect(result.priority).toBe('medium');
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });

    it('should reject name exceeding 200 characters', () => {
      const invalidData = {
        name: 'a'.repeat(201),
        project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });

    it('should trim name whitespace', () => {
      const data = {
        name: '  Test Project  ',
        project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      const result = createProjectSchema.parse(data);

      expect(result.name).toBe('Test Project');
    });

    it('should reject invalid status', () => {
      const invalidData = {
        name: 'Test',
        status: 'invalid_status',
        project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });

    it('should accept valid statuses', () => {
      const validStatuses = ['planning', 'in progress', 'on hold', 'completed', 'cancelled'];

      for (const status of validStatuses) {
        const data = {
          name: 'Test',
          status,
          project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
        };

        expect(() => createProjectSchema.parse(data)).not.toThrow();
      }
    });

    it('should reject invalid priority', () => {
      const invalidData = {
        name: 'Test',
        priority: 'critical',
        project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });

    it('should accept valid priorities', () => {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];

      for (const priority of validPriorities) {
        const data = {
          name: 'Test',
          priority,
          project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
        };

        expect(() => createProjectSchema.parse(data)).not.toThrow();
      }
    });

    it('should reject completion_percentage > 100', () => {
      const invalidData = {
        name: 'Test',
        completion_percentage: 150,
        project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });

    it('should reject negative completion_percentage', () => {
      const invalidData = {
        name: 'Test',
        completion_percentage: -10,
        project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });

    it('should reject non-integer completion_percentage', () => {
      const invalidData = {
        name: 'Test',
        completion_percentage: 50.5,
        project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });

    it('should reject negative budget_amount', () => {
      const invalidData = {
        name: 'Test',
        budget_amount: -1000,
        project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });

    it('should reject budget_amount exceeding max', () => {
      const invalidData = {
        name: 'Test',
        budget_amount: 9999999999.99,
        project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });

    it('should reject end_date before start_date', () => {
      const invalidData = {
        name: 'Test',
        start_date: '2024-12-31',
        end_date: '2024-01-01',
        project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });

    it('should accept end_date equal to start_date', () => {
      const data = {
        name: 'Test',
        start_date: '2024-01-01',
        end_date: '2024-01-01',
        project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => createProjectSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid UUID for project_manager_id', () => {
      const invalidData = {
        name: 'Test',
        project_manager_id: 'invalid-uuid',
        branch_id: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid UUID for branch_id', () => {
      const invalidData = {
        name: 'Test',
        project_manager_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_id: 'not-a-uuid',
      };

      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });
  });

  describe('updateProjectSchema', () => {
    it('should validate partial updates', () => {
      const validData = {
        name: 'Updated Name',
      };

      const result = updateProjectSchema.parse(validData);

      expect(result.name).toBe('Updated Name');
    });

    it('should reject empty update object', () => {
      const invalidData = {};

      expect(() => updateProjectSchema.parse(invalidData)).toThrow();
    });

    it('should allow all fields to be optional', () => {
      const data = {
        completion_percentage: 75,
      };

      const result = updateProjectSchema.parse(data);

      expect(result.completion_percentage).toBe(75);
    });
  });

  describe('createTaskSchema', () => {
    it('should validate valid task data', () => {
      const validData = {
        project_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Test Task',
        status: 'planning',
        priority: 'medium',
      };

      const result = createTaskSchema.parse(validData);

      expect(result.title).toBe('Test Task');
      expect(result.status).toBe('planning');
    });

    it('should reject empty title', () => {
      const invalidData = {
        project_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: '',
      };

      expect(() => createTaskSchema.parse(invalidData)).toThrow();
    });

    it('should reject title exceeding 200 characters', () => {
      const invalidData = {
        project_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'a'.repeat(201),
      };

      expect(() => createTaskSchema.parse(invalidData)).toThrow();
    });

    it('should reject negative estimated_hours', () => {
      const invalidData = {
        project_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Test',
        estimated_hours: -5,
      };

      expect(() => createTaskSchema.parse(invalidData)).toThrow();
    });

    it('should reject due_date before start_date', () => {
      const invalidData = {
        project_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Test',
        start_date: '2024-12-31',
        due_date: '2024-01-01',
      };

      expect(() => createTaskSchema.parse(invalidData)).toThrow();
    });
  });

  describe('createMaterialSchema', () => {
    it('should validate valid material data', () => {
      const validData = {
        project_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Test Material',
        quantity: 10,
        unit: 'pieces',
        status: 'not_ordered',
      };

      const result = createMaterialSchema.parse(validData);

      expect(result.name).toBe('Test Material');
      expect(result.quantity).toBe(10);
    });

    it('should reject zero quantity', () => {
      const invalidData = {
        project_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Test',
        quantity: 0,
        unit: 'pieces',
      };

      expect(() => createMaterialSchema.parse(invalidData)).toThrow();
    });

    it('should reject negative quantity', () => {
      const invalidData = {
        project_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Test',
        quantity: -5,
        unit: 'pieces',
      };

      expect(() => createMaterialSchema.parse(invalidData)).toThrow();
    });

    it('should accept valid material statuses', () => {
      const validStatuses = ['not_ordered', 'ordered', 'received', 'in_use'];

      for (const status of validStatuses) {
        const data = {
          project_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          name: 'Test',
          quantity: 1,
          unit: 'pieces',
          status,
        };

        expect(() => createMaterialSchema.parse(data)).not.toThrow();
      }
    });
  });

  describe('listProjectsQuerySchema', () => {
    it('should validate valid query parameters', () => {
      const validQuery = {
        status: 'planning',
        priority: 'high',
        page: '1',
        limit: '25',
      };

      const result = listProjectsQuerySchema.parse(validQuery);

      expect(result.status).toBe('planning');
      expect(result.priority).toBe('high');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(25);
    });

    it('should coerce string numbers to integers', () => {
      const query = {
        page: '2',
        limit: '50',
      };

      const result = listProjectsQuerySchema.parse(query);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should apply default values', () => {
      const query = {};

      const result = listProjectsQuerySchema.parse(query);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    it('should reject invalid sort format', () => {
      const invalidQuery = {
        sort: 'name',
      };

      expect(() => listProjectsQuerySchema.parse(invalidQuery)).toThrow();
    });

    it('should accept valid sort format', () => {
      const query = {
        sort: 'name:asc',
      };

      const result = listProjectsQuerySchema.parse(query);

      expect(result.sort).toBe('name:asc');
    });

    it('should reject limit > 100', () => {
      const invalidQuery = {
        limit: '150',
      };

      expect(() => listProjectsQuerySchema.parse(invalidQuery)).toThrow();
    });

    it('should reject page < 1', () => {
      const invalidQuery = {
        page: '0',
      };

      expect(() => listProjectsQuerySchema.parse(invalidQuery)).toThrow();
    });
  });
});
