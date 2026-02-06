/**
 * Project Control - Standardized Constants
 * Must match database schema CHECK constraints exactly
 */

// Project Status Values
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in progress',
  ON_HOLD: 'on hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Task Status Values (same as project status)
export const TASK_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in progress',
  ON_HOLD: 'on hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Priority Values
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Material Status Values
export const MATERIAL_STATUS = {
  NOT_ORDERED: 'not_ordered',
  ORDERED: 'ordered',
  IN_TRANSIT: 'in_transit',
  RECEIVED: 'received',
  IN_USE: 'in_use',
};

// Dependency Types
export const DEPENDENCY_TYPE = {
  FINISH_TO_START: 'finish_to_start',
  START_TO_START: 'start_to_start',
  FINISH_TO_FINISH: 'finish_to_finish',
  START_TO_FINISH: 'start_to_finish',
};

// Project Member Roles
export const PROJECT_ROLE = {
  OWNER: 'owner',
  MANAGER: 'manager',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

// Arrays for dropdowns/filters
export const PROJECT_STATUSES = Object.values(PROJECT_STATUS);
export const TASK_STATUSES = Object.values(TASK_STATUS);
export const PRIORITIES = Object.values(PRIORITY);
export const MATERIAL_STATUSES = Object.values(MATERIAL_STATUS);
export const DEPENDENCY_TYPES = Object.values(DEPENDENCY_TYPE);
export const PROJECT_ROLES = Object.values(PROJECT_ROLE);

// Display labels for UI
export const STATUS_LABELS = {
  [PROJECT_STATUS.PLANNING]: 'Planning',
  [PROJECT_STATUS.IN_PROGRESS]: 'In Progress',
  [PROJECT_STATUS.ON_HOLD]: 'On Hold',
  [PROJECT_STATUS.COMPLETED]: 'Completed',
  [PROJECT_STATUS.CANCELLED]: 'Cancelled',
};

export const PRIORITY_LABELS = {
  [PRIORITY.LOW]: 'Low',
  [PRIORITY.MEDIUM]: 'Medium',
  [PRIORITY.HIGH]: 'High',
  [PRIORITY.URGENT]: 'Urgent',
};

export const MATERIAL_STATUS_LABELS = {
  [MATERIAL_STATUS.NOT_ORDERED]: 'Not Ordered',
  [MATERIAL_STATUS.ORDERED]: 'Ordered',
  [MATERIAL_STATUS.IN_TRANSIT]: 'In Transit',
  [MATERIAL_STATUS.RECEIVED]: 'Received',
  [MATERIAL_STATUS.IN_USE]: 'In Use',
};

export const DEPENDENCY_TYPE_LABELS = {
  [DEPENDENCY_TYPE.FINISH_TO_START]: 'Finish to Start',
  [DEPENDENCY_TYPE.START_TO_START]: 'Start to Start',
  [DEPENDENCY_TYPE.FINISH_TO_FINISH]: 'Finish to Finish',
  [DEPENDENCY_TYPE.START_TO_FINISH]: 'Start to Finish',
};

export const PROJECT_ROLE_LABELS = {
  [PROJECT_ROLE.OWNER]: 'Owner',
  [PROJECT_ROLE.MANAGER]: 'Manager',
  [PROJECT_ROLE.MEMBER]: 'Member',
  [PROJECT_ROLE.VIEWER]: 'Viewer',
};

// Status badge colors (for UI components)
export const STATUS_COLORS = {
  [PROJECT_STATUS.PLANNING]: 'blue',
  [PROJECT_STATUS.IN_PROGRESS]: 'yellow',
  [PROJECT_STATUS.ON_HOLD]: 'orange',
  [PROJECT_STATUS.COMPLETED]: 'green',
  [PROJECT_STATUS.CANCELLED]: 'gray',
};

export const PRIORITY_COLORS = {
  [PRIORITY.LOW]: 'gray',
  [PRIORITY.MEDIUM]: 'blue',
  [PRIORITY.HIGH]: 'orange',
  [PRIORITY.URGENT]: 'red',
};
