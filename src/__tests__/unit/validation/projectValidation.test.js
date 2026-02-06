/**
 * Frontend Project Validation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateProjectName,
  validateDescription,
  validateBudgetAmount,
  validatePercentage,
  validateHours,
  validateDateRange,
  validateStatus,
  validatePriority,
  validateTaskTitle,
  validateQuantity,
  sanitizeTextInput,
  validateProjectForm,
  validateTaskForm,
  FIELD_CONSTRAINTS,
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
} from '../../../lib/validation/projectValidation.js';

describe('Frontend Validation Utilities', () => {
  describe('validateProjectName', () => {
    it('should accept valid project names', () => {
      expect(validateProjectName('Valid Project Name')).toBeNull();
      expect(validateProjectName('A')).toBeNull();
    });

    it('should reject empty names', () => {
      expect(validateProjectName('')).toBeTruthy();
      expect(validateProjectName('   ')).toBeTruthy();
    });

    it('should reject names exceeding max length', () => {
      const longName = 'a'.repeat(FIELD_CONSTRAINTS.PROJECT_NAME_MAX_LENGTH + 1);
      expect(validateProjectName(longName)).toBeTruthy();
    });
  });

  describe('validateDescription', () => {
    it('should accept valid descriptions', () => {
      expect(validateDescription('Valid description')).toBeNull();
      expect(validateDescription('')).toBeNull(); // Optional field
    });

    it('should reject descriptions exceeding max length', () => {
      const longDesc = 'a'.repeat(FIELD_CONSTRAINTS.DESCRIPTION_MAX_LENGTH + 1);
      expect(validateDescription(longDesc)).toBeTruthy();
    });
  });

  describe('validateBudgetAmount', () => {
    it('should accept valid budget amounts', () => {
      expect(validateBudgetAmount(0)).toBeNull();
      expect(validateBudgetAmount(1000)).toBeNull();
      expect(validateBudgetAmount(999999999.99)).toBeNull();
    });

    it('should accept empty/null (optional field)', () => {
      expect(validateBudgetAmount(null)).toBeNull();
      expect(validateBudgetAmount(undefined)).toBeNull();
      expect(validateBudgetAmount('')).toBeNull();
    });

    it('should reject negative amounts', () => {
      expect(validateBudgetAmount(-100)).toBeTruthy();
    });

    it('should reject amounts exceeding max', () => {
      expect(validateBudgetAmount(FIELD_CONSTRAINTS.BUDGET_MAX + 1)).toBeTruthy();
    });

    it('should reject non-numeric values', () => {
      expect(validateBudgetAmount('not a number')).toBeTruthy();
    });

    it('should reject more than 2 decimal places', () => {
      expect(validateBudgetAmount('100.123')).toBeTruthy();
    });

    it('should accept up to 2 decimal places', () => {
      expect(validateBudgetAmount('100.12')).toBeNull();
    });
  });

  describe('validatePercentage', () => {
    it('should accept valid percentages', () => {
      expect(validatePercentage(0)).toBeNull();
      expect(validatePercentage(50)).toBeNull();
      expect(validatePercentage(100)).toBeNull();
    });

    it('should reject negative percentages', () => {
      expect(validatePercentage(-1)).toBeTruthy();
    });

    it('should reject percentages > 100', () => {
      expect(validatePercentage(101)).toBeTruthy();
    });

    it('should reject non-integer percentages', () => {
      expect(validatePercentage(50.5)).toBeTruthy();
    });
  });

  describe('validateHours', () => {
    it('should accept valid hours', () => {
      expect(validateHours(0)).toBeNull();
      expect(validateHours(8.5)).toBeNull();
      expect(validateHours(100)).toBeNull();
    });

    it('should reject negative hours', () => {
      expect(validateHours(-1)).toBeTruthy();
    });

    it('should reject hours exceeding max', () => {
      expect(validateHours(FIELD_CONSTRAINTS.HOURS_MAX + 1)).toBeTruthy();
    });
  });

  describe('validateDateRange', () => {
    it('should accept valid date ranges', () => {
      expect(validateDateRange('2024-01-01', '2024-12-31')).toBeNull();
      expect(validateDateRange('2024-01-01', '2024-01-01')).toBeNull(); // Same day
    });

    it('should reject end date before start date', () => {
      expect(validateDateRange('2024-12-31', '2024-01-01')).toBeTruthy();
    });

    it('should accept partial dates (only one provided)', () => {
      expect(validateDateRange('2024-01-01', null)).toBeNull();
      expect(validateDateRange(null, '2024-12-31')).toBeNull();
    });

    it('should reject invalid date formats', () => {
      expect(validateDateRange('invalid', '2024-12-31')).toBeTruthy();
      expect(validateDateRange('2024-01-01', 'invalid')).toBeTruthy();
    });
  });

  describe('validateStatus', () => {
    it('should accept valid statuses', () => {
      for (const status of PROJECT_STATUSES) {
        expect(validateStatus(status)).toBeNull();
      }
    });

    it('should reject invalid statuses', () => {
      expect(validateStatus('invalid_status')).toBeTruthy();
    });

    it('should reject empty status', () => {
      expect(validateStatus('')).toBeTruthy();
    });
  });

  describe('validatePriority', () => {
    it('should accept valid priorities', () => {
      for (const priority of PROJECT_PRIORITIES) {
        expect(validatePriority(priority)).toBeNull();
      }
    });

    it('should reject invalid priorities', () => {
      expect(validatePriority('critical')).toBeTruthy();
    });
  });

  describe('validateTaskTitle', () => {
    it('should accept valid task titles', () => {
      expect(validateTaskTitle('Valid Task')).toBeNull();
    });

    it('should reject empty titles', () => {
      expect(validateTaskTitle('')).toBeTruthy();
      expect(validateTaskTitle('   ')).toBeTruthy();
    });

    it('should reject titles exceeding max length', () => {
      const longTitle = 'a'.repeat(FIELD_CONSTRAINTS.TASK_TITLE_MAX_LENGTH + 1);
      expect(validateTaskTitle(longTitle)).toBeTruthy();
    });
  });

  describe('validateQuantity', () => {
    it('should accept valid quantities', () => {
      expect(validateQuantity(1)).toBeNull();
      expect(validateQuantity(100.5)).toBeNull();
    });

    it('should reject zero', () => {
      expect(validateQuantity(0)).toBeTruthy();
    });

    it('should reject negative quantities', () => {
      expect(validateQuantity(-5)).toBeTruthy();
    });

    it('should reject empty quantity', () => {
      expect(validateQuantity('')).toBeTruthy();
    });
  });

  describe('sanitizeTextInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeTextInput('  text  ')).toBe('text');
    });

    it('should normalize multiple spaces', () => {
      expect(sanitizeTextInput('text    with    spaces')).toBe('text with spaces');
    });

    it('should handle empty string', () => {
      expect(sanitizeTextInput('')).toBe('');
    });
  });

  describe('validateProjectForm', () => {
    it('should validate complete valid form', () => {
      const data = {
        name: 'Test Project',
        description: 'Description',
        status: 'planning',
        priority: 'medium',
        project_manager_id: 'manager-id',
        branch_id: 'branch-id',
        budget_amount: 10000,
        completion_percentage: 0,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      const result = validateProjectForm(data);

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should collect all errors', () => {
      const data = {
        name: '',
        status: 'invalid_status',
        priority: 'critical',
        budget_amount: -100,
        completion_percentage: 150,
      };

      const result = validateProjectForm(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeTruthy();
      expect(result.errors.status).toBeTruthy();
      expect(result.errors.priority).toBeTruthy();
      expect(result.errors.budget_amount).toBeTruthy();
      expect(result.errors.completion_percentage).toBeTruthy();
    });

    it('should validate date ranges', () => {
      const data = {
        name: 'Test',
        status: 'planning',
        priority: 'medium',
        project_manager_id: 'id',
        branch_id: 'id',
        start_date: '2024-12-31',
        end_date: '2024-01-01', // Invalid
      };

      const result = validateProjectForm(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.end_date).toBeTruthy();
    });
  });

  describe('validateTaskForm', () => {
    it('should validate complete valid task form', () => {
      const data = {
        title: 'Test Task',
        description: 'Description',
        status: 'planning',
        priority: 'medium',
        estimated_hours: 8,
        actual_hours: 6,
        start_date: '2024-01-01',
        due_date: '2024-01-15',
      };

      const result = validateTaskForm(data);

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should collect all task errors', () => {
      const data = {
        title: '',
        status: 'invalid',
        estimated_hours: -5,
        start_date: '2024-12-31',
        due_date: '2024-01-01', // Invalid
      };

      const result = validateTaskForm(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBeTruthy();
      expect(result.errors.status).toBeTruthy();
      expect(result.errors.estimated_hours).toBeTruthy();
      expect(result.errors.due_date).toBeTruthy();
    });
  });
});
