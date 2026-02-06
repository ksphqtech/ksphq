/**
 * Project Validation Schemas
 * Zod schemas for project, task, and material validation
 */

import { z } from 'zod';

/**
 * Valid project statuses from database CHECK constraint
 */
const PROJECT_STATUSES = ['planning', 'in progress', 'on hold', 'completed', 'cancelled'];

/**
 * Valid project priorities from database CHECK constraint
 */
const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * Valid task statuses from database CHECK constraint
 */
const TASK_STATUSES = ['planning', 'in progress', 'on hold', 'completed', 'cancelled'];

/**
 * Valid task priorities from database CHECK constraint
 */
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * Valid material statuses from database CHECK constraint
 */
const MATERIAL_STATUSES = ['not_ordered', 'ordered', 'received', 'in_use'];

/**
 * ISO date string validation helper
 */
const isoDateString = z.string().refine(
  (val) => {
    try {
      const date = new Date(val);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  },
  { message: 'Invalid date format. Must be a valid ISO date string' }
);

/**
 * Positive decimal validation helper (for currency)
 */
const positiveDecimal = z.number()
  .nonnegative('Amount must be positive')
  .max(999999999.99, 'Amount exceeds maximum allowed value');

/**
 * Create project schema
 */
export const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(200, 'Project name cannot exceed 200 characters')
    .transform(val => val.trim()),

  description: z.string()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional()
    .nullable()
    .transform(val => val ? val.trim() : val),

  status: z.enum(PROJECT_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${PROJECT_STATUSES.join(', ')}` })
  }).default('planning'),

  priority: z.enum(PROJECT_PRIORITIES, {
    errorMap: () => ({ message: `Priority must be one of: ${PROJECT_PRIORITIES.join(', ')}` })
  }).default('medium'),

  start_date: isoDateString.optional().nullable(),
  end_date: isoDateString.optional().nullable(),
  actual_start_date: isoDateString.optional().nullable(),
  actual_end_date: isoDateString.optional().nullable(),

  completion_percentage: z.number()
    .int('Completion percentage must be an integer')
    .min(0, 'Completion percentage cannot be negative')
    .max(100, 'Completion percentage cannot exceed 100')
    .default(0),

  budget_amount: positiveDecimal.optional().nullable(),
  actual_cost: positiveDecimal.optional().nullable(),

  project_manager_id: z.string()
    .min(1, 'Project manager is required')
    .uuid('Invalid project manager ID format'),

  branch_id: z.string()
    .min(1, 'Branch is required')
    .uuid('Invalid branch ID format'),
}).refine(
  (data) => {
    // If both dates provided, end_date must be after start_date
    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return end >= start;
    }
    return true;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['end_date'],
  }
).refine(
  (data) => {
    // If actual dates provided, actual_end_date must be after actual_start_date
    if (data.actual_start_date && data.actual_end_date) {
      const start = new Date(data.actual_start_date);
      const end = new Date(data.actual_end_date);
      return end >= start;
    }
    return true;
  },
  {
    message: 'Actual end date must be after or equal to actual start date',
    path: ['actual_end_date'],
  }
);

/**
 * Update project schema
 * All fields optional since this is for partial updates
 */
export const updateProjectSchema = z.object({
  name: z.string()
    .min(1, 'Project name cannot be empty')
    .max(200, 'Project name cannot exceed 200 characters')
    .transform(val => val.trim())
    .optional(),

  description: z.string()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional()
    .nullable()
    .transform(val => val ? val.trim() : val),

  status: z.enum(PROJECT_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${PROJECT_STATUSES.join(', ')}` })
  }).optional(),

  priority: z.enum(PROJECT_PRIORITIES, {
    errorMap: () => ({ message: `Priority must be one of: ${PROJECT_PRIORITIES.join(', ')}` })
  }).optional(),

  start_date: isoDateString.optional().nullable(),
  end_date: isoDateString.optional().nullable(),
  actual_start_date: isoDateString.optional().nullable(),
  actual_end_date: isoDateString.optional().nullable(),

  completion_percentage: z.number()
    .int('Completion percentage must be an integer')
    .min(0, 'Completion percentage cannot be negative')
    .max(100, 'Completion percentage cannot exceed 100')
    .optional(),

  budget_amount: positiveDecimal.optional().nullable(),
  actual_cost: positiveDecimal.optional().nullable(),

  project_manager_id: z.string()
    .uuid('Invalid project manager ID format')
    .optional()
    .nullable(),

  branch_id: z.string()
    .uuid('Invalid branch ID format')
    .optional(),

  is_active: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

/**
 * Create task schema
 */
export const createTaskSchema = z.object({
  project_id: z.string()
    .min(1, 'Project ID is required')
    .uuid('Invalid project ID format'),

  title: z.string()
    .min(1, 'Task title is required')
    .max(200, 'Task title cannot exceed 200 characters')
    .transform(val => val.trim()),

  description: z.string()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional()
    .nullable()
    .transform(val => val ? val.trim() : val),

  status: z.enum(TASK_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${TASK_STATUSES.join(', ')}` })
  }).default('planning'),

  priority: z.enum(TASK_PRIORITIES, {
    errorMap: () => ({ message: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}` })
  }).default('medium'),

  assigned_to: z.string()
    .uuid('Invalid assignee ID format')
    .optional()
    .nullable(),

  start_date: isoDateString.optional().nullable(),
  due_date: isoDateString.optional().nullable(),

  estimated_hours: z.number()
    .nonnegative('Estimated hours cannot be negative')
    .max(999999, 'Estimated hours exceeds maximum')
    .optional()
    .nullable(),

  actual_hours: z.number()
    .nonnegative('Actual hours cannot be negative')
    .max(999999, 'Actual hours exceeds maximum')
    .optional()
    .nullable(),

  order_index: z.number()
    .int('Order index must be an integer')
    .nonnegative('Order index cannot be negative')
    .optional(),

  parent_task_id: z.string()
    .uuid('Invalid parent task ID format')
    .optional()
    .nullable(),
}).refine(
  (data) => {
    // If both dates provided, due_date must be after start_date
    if (data.start_date && data.due_date) {
      const start = new Date(data.start_date);
      const due = new Date(data.due_date);
      return due >= start;
    }
    return true;
  },
  {
    message: 'Due date must be after or equal to start date',
    path: ['due_date'],
  }
);

/**
 * Update task schema
 */
export const updateTaskSchema = z.object({
  title: z.string()
    .min(1, 'Task title cannot be empty')
    .max(200, 'Task title cannot exceed 200 characters')
    .transform(val => val.trim())
    .optional(),

  description: z.string()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional()
    .nullable()
    .transform(val => val ? val.trim() : val),

  status: z.enum(TASK_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${TASK_STATUSES.join(', ')}` })
  }).optional(),

  priority: z.enum(TASK_PRIORITIES, {
    errorMap: () => ({ message: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}` })
  }).optional(),

  assigned_to: z.string()
    .uuid('Invalid assignee ID format')
    .optional()
    .nullable(),

  start_date: isoDateString.optional().nullable(),
  due_date: isoDateString.optional().nullable(),

  estimated_hours: z.number()
    .nonnegative('Estimated hours cannot be negative')
    .max(999999, 'Estimated hours exceeds maximum')
    .optional()
    .nullable(),

  actual_hours: z.number()
    .nonnegative('Actual hours cannot be negative')
    .max(999999, 'Actual hours exceeds maximum')
    .optional()
    .nullable(),

  order_index: z.number()
    .int('Order index must be an integer')
    .nonnegative('Order index cannot be negative')
    .optional(),

  parent_task_id: z.string()
    .uuid('Invalid parent task ID format')
    .optional()
    .nullable(),

  is_active: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

/**
 * Create material schema
 */
export const createMaterialSchema = z.object({
  project_id: z.string()
    .min(1, 'Project ID is required')
    .uuid('Invalid project ID format'),

  name: z.string()
    .min(1, 'Material name is required')
    .max(200, 'Material name cannot exceed 200 characters')
    .transform(val => val.trim()),

  quantity: z.number()
    .positive('Quantity must be greater than zero')
    .max(999999, 'Quantity exceeds maximum'),

  unit: z.string()
    .min(1, 'Unit is required')
    .max(50, 'Unit cannot exceed 50 characters')
    .transform(val => val.trim()),

  unit_cost: positiveDecimal.optional().nullable(),

  status: z.enum(MATERIAL_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${MATERIAL_STATUSES.join(', ')}` })
  }).default('not_ordered'),

  notes: z.string()
    .max(5000, 'Notes cannot exceed 5000 characters')
    .optional()
    .nullable()
    .transform(val => val ? val.trim() : val),
});

/**
 * Update material schema
 */
export const updateMaterialSchema = z.object({
  name: z.string()
    .min(1, 'Material name cannot be empty')
    .max(200, 'Material name cannot exceed 200 characters')
    .transform(val => val.trim())
    .optional(),

  quantity: z.number()
    .positive('Quantity must be greater than zero')
    .max(999999, 'Quantity exceeds maximum')
    .optional(),

  unit: z.string()
    .min(1, 'Unit cannot be empty')
    .max(50, 'Unit cannot exceed 50 characters')
    .transform(val => val.trim())
    .optional(),

  unit_cost: positiveDecimal.optional().nullable(),

  status: z.enum(MATERIAL_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${MATERIAL_STATUSES.join(', ')}` })
  }).optional(),

  notes: z.string()
    .max(5000, 'Notes cannot exceed 5000 characters')
    .optional()
    .nullable()
    .transform(val => val ? val.trim() : val),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

/**
 * Task dependency schema
 */
export const taskDependencySchema = z.object({
  task_id: z.string().uuid('Invalid task ID format'),
  depends_on_task_id: z.string().uuid('Invalid dependency task ID format'),
  dependency_type: z.enum(['finish_to_start', 'start_to_start', 'finish_to_finish']).default('finish_to_start'),
});

/**
 * List projects query schema
 */
export const listProjectsQuerySchema = z.object({
  branch_id: z.string().uuid().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  priority: z.enum(PROJECT_PRIORITIES).optional(),
  project_manager_id: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  sort: z.string()
    .regex(/^(name|status|priority|start_date|end_date|completion_percentage|created_at):(asc|desc)$/i)
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Export constants for use in frontend
 */
export const VALIDATION_CONSTANTS = {
  PROJECT_NAME_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 5000,
  BUDGET_MAX: 999999999.99,
  PERCENTAGE_MIN: 0,
  PERCENTAGE_MAX: 100,
  HOURS_MAX: 999999,
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  MATERIAL_STATUSES,
};
