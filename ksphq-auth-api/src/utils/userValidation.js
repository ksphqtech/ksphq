/**
 * User Validation Schemas
 * Zod schemas for request validation
 */

import { z } from 'zod';

/**
 * Create user schema
 */
export const createUserSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Invalid email address'),
  phone_number: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  employee_id: z.string().max(50, 'Employee ID too long').optional().nullable(),
  title: z.string().max(100, 'Title too long').optional().nullable(),

  // Organizational
  role_id: z.string().min(1, 'Role is required'),
  branch_id: z.string().optional().nullable(),
  department_id: z.string().optional().nullable(),
  shift_id: z.string().optional().nullable(),
  team_id: z.string().optional().nullable(),
  group_id: z.string().optional().nullable(),
  manager_id: z.string().optional().nullable(),

  // Password handling
  password_option: z.enum(['auto', 'manual', 'email']).default('auto'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),

  // Account settings
  idle_timeout_minutes: z
    .number()
    .int()
    .min(5, 'Timeout must be at least 5 minutes')
    .max(480, 'Timeout cannot exceed 8 hours')
    .default(60),
  account_expires_at: z.string().datetime().optional().nullable(),
}).refine(
  (data) => {
    // If password_option is 'manual', password must be provided
    if (data.password_option === 'manual') {
      return data.password && data.password.length >= 8;
    }
    return true;
  },
  {
    message: 'Password is required when password option is "manual"',
    path: ['password'],
  }
);

/**
 * Update user schema
 */
export const updateUserSchema = z
  .object({
    first_name: z.string().min(1).max(50).optional(),
    last_name: z.string().min(1).max(50).optional(),
    email: z.string().email().optional(),
    phone_number: z
      .string()
      .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
      .optional()
      .nullable(),
    employee_id: z.string().max(50).optional().nullable(),
    title: z.string().max(100).optional().nullable(),
    role_id: z.string().optional(),
    branch_id: z.string().optional().nullable(),
    department_id: z.string().optional().nullable(),
    shift_id: z.string().optional().nullable(),
    team_id: z.string().optional().nullable(),
    group_id: z.string().optional().nullable(),
    manager_id: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
    idle_timeout_minutes: z.number().int().min(5).max(480).optional(),
    account_expires_at: z.string().datetime().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * List users query schema
 */
export const listUsersQuerySchema = z.object({
  role_id: z.string().optional(),
  branch_id: z.string().optional(),
  department_id: z.string().optional(),
  team_id: z.string().optional(),
  shift_id: z.string().optional(),
  group_id: z.string().optional(),
  is_active: z
    .enum(['0', '1', 'true', 'false'])
    .transform((val) => val === '1' || val === 'true')
    .optional(),
  include_deleted: z
    .enum(['0', '1', 'true', 'false'])
    .transform((val) => val === '1' || val === 'true')
    .optional(),
  search: z.string().max(100).optional(),
  sort: z
    .string()
    .regex(/^(created_at|first_name|last_name|email|last_login_at):(asc|desc)$/i)
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
  password_option: z.enum(['auto', 'manual']).default('auto'),
  password: z.string().min(8).optional(),
  require_change: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.password_option === 'manual') {
      return data.password && data.password.length >= 8;
    }
    return true;
  },
  {
    message: 'Password is required when password option is "manual"',
    path: ['password'],
  }
);

/**
 * Bulk deactivate schema
 */
export const bulkDeactivateSchema = z.object({
  user_ids: z.array(z.string()).min(1, 'At least one user ID required'),
});

/**
 * Create role schema
 */
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Name too long'),
  level: z
    .number()
    .int()
    .min(1, 'Level must be at least 1')
    .max(100, 'Level cannot exceed 100'),
  description: z.string().max(500).optional().nullable(),
  permissions: z.object({
    all: z.boolean().optional(),
    workforce: z.boolean().optional(),
    docks: z.boolean().optional(),
    projects: z.boolean().optional(),
    tickets: z.boolean().optional(),
    user_management: z
      .enum(['none', 'view_self', 'view_team', 'team', 'department', 'branch', 'full'])
      .optional(),
  }),
});

/**
 * Update role schema
 */
export const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  level: z.number().int().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  permissions: z
    .object({
      all: z.boolean().optional(),
      workforce: z.boolean().optional(),
      docks: z.boolean().optional(),
      projects: z.boolean().optional(),
      tickets: z.boolean().optional(),
      user_management: z
        .enum(['none', 'view_self', 'view_team', 'team', 'department', 'branch', 'full'])
        .optional(),
    })
    .optional(),
  is_active: z.boolean().optional(),
});

/**
 * Create org unit schema
 */
export const createOrgUnitSchema = z.object({
  type: z.enum(['branch', 'department', 'shift', 'team', 'group'], {
    errorMap: () => ({ message: 'Invalid organizational unit type' }),
  }),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  code: z.string().max(20).optional().nullable(),
  parent_id: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
});

/**
 * Update org unit schema
 */
export const updateOrgUnitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().max(20).optional().nullable(),
  parent_id: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  is_active: z.boolean().optional(),
});
