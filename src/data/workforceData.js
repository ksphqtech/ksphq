// Workforce Mock/Seed Data
// Sample data for clients, activities, and projects

export const clientsData = [
  {
    id: 'client_001',
    name: 'Acme Corporation',
    code: 'ACME',
    status: 'active',
    billable: true,
    contactEmail: 'billing@acme.com',
    createdAt: '2024-01-15T08:00:00.000Z',
    updatedAt: '2024-01-15T08:00:00.000Z'
  },
  {
    id: 'client_002',
    name: 'TechStart Inc',
    code: 'TECH',
    status: 'active',
    billable: true,
    contactEmail: 'accounts@techstart.com',
    createdAt: '2024-02-01T09:30:00.000Z',
    updatedAt: '2024-02-01T09:30:00.000Z'
  },
  {
    id: 'client_003',
    name: 'Global Solutions Ltd',
    code: 'GLBL',
    status: 'active',
    billable: true,
    contactEmail: 'finance@globalsolutions.com',
    createdAt: '2024-02-10T10:00:00.000Z',
    updatedAt: '2024-02-10T10:00:00.000Z'
  },
  {
    id: 'client_004',
    name: 'Internal Operations',
    code: 'INTERNAL',
    status: 'active',
    billable: false,
    contactEmail: 'ops@company.com',
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-01-01T08:00:00.000Z'
  },
  {
    id: 'client_005',
    name: 'Innovate Partners',
    code: 'INNOV',
    status: 'active',
    billable: true,
    contactEmail: 'billing@innovatepartners.com',
    createdAt: '2024-03-01T11:00:00.000Z',
    updatedAt: '2024-03-01T11:00:00.000Z'
  },
  {
    id: 'client_006',
    name: 'Legacy Systems Co',
    code: 'LEGACY',
    status: 'inactive',
    billable: true,
    contactEmail: 'archive@legacysystems.com',
    createdAt: '2023-06-15T08:00:00.000Z',
    updatedAt: '2024-01-30T16:00:00.000Z'
  }
];

export const activitiesData = [
  {
    id: 'activity_001',
    name: 'Development',
    code: 'DEV',
    category: 'Technical',
    billable: true,
    status: 'active',
    description: 'Software development and coding',
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-01-01T08:00:00.000Z'
  },
  {
    id: 'activity_002',
    name: 'Code Review',
    code: 'REVIEW',
    category: 'Technical',
    billable: true,
    status: 'active',
    description: 'Reviewing code and providing feedback',
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-01-01T08:00:00.000Z'
  },
  {
    id: 'activity_003',
    name: 'Meeting',
    code: 'MEET',
    category: 'Administrative',
    billable: true,
    status: 'active',
    description: 'Client meetings and discussions',
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-01-01T08:00:00.000Z'
  },
  {
    id: 'activity_004',
    name: 'Testing',
    code: 'TEST',
    category: 'Technical',
    billable: true,
    status: 'active',
    description: 'Quality assurance and testing',
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-01-01T08:00:00.000Z'
  },
  {
    id: 'activity_005',
    name: 'Documentation',
    code: 'DOCS',
    category: 'Administrative',
    billable: true,
    status: 'active',
    description: 'Writing technical documentation',
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-01-01T08:00:00.000Z'
  },
  {
    id: 'activity_006',
    name: 'Planning',
    code: 'PLAN',
    category: 'Administrative',
    billable: true,
    status: 'active',
    description: 'Project planning and estimation',
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-01-01T08:00:00.000Z'
  },
  {
    id: 'activity_007',
    name: 'Training',
    code: 'TRAIN',
    category: 'Professional Development',
    billable: false,
    status: 'active',
    description: 'Learning and skill development',
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-01-01T08:00:00.000Z'
  },
  {
    id: 'activity_008',
    name: 'Bug Fixing',
    code: 'BUG',
    category: 'Technical',
    billable: true,
    status: 'active',
    description: 'Identifying and fixing bugs',
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-01-01T08:00:00.000Z'
  }
];

export const workforceProjectsData = [
  {
    id: 'project_001',
    name: 'E-Commerce Platform Redesign',
    code: 'ACME-ECOM',
    clientId: 'client_001',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    description: 'Complete overhaul of the e-commerce platform',
    createdAt: '2024-01-15T08:00:00.000Z',
    updatedAt: '2024-01-15T08:00:00.000Z'
  },
  {
    id: 'project_002',
    name: 'Mobile App Development',
    code: 'ACME-MOB',
    clientId: 'client_001',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-08-31',
    description: 'iOS and Android mobile applications',
    createdAt: '2024-02-01T09:00:00.000Z',
    updatedAt: '2024-02-01T09:00:00.000Z'
  },
  {
    id: 'project_003',
    name: 'Cloud Migration',
    code: 'TECH-CLOUD',
    clientId: 'client_002',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-05-31',
    description: 'Migrate legacy systems to AWS',
    createdAt: '2024-02-01T09:30:00.000Z',
    updatedAt: '2024-02-01T09:30:00.000Z'
  },
  {
    id: 'project_004',
    name: 'API Integration',
    code: 'TECH-API',
    clientId: 'client_002',
    status: 'active',
    startDate: '2024-03-01',
    endDate: '2024-04-30',
    description: 'Third-party API integrations',
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2024-03-01T10:00:00.000Z'
  },
  {
    id: 'project_005',
    name: 'CRM Implementation',
    code: 'GLBL-CRM',
    clientId: 'client_003',
    status: 'active',
    startDate: '2024-02-10',
    endDate: '2024-07-31',
    description: 'Salesforce CRM setup and customization',
    createdAt: '2024-02-10T10:00:00.000Z',
    updatedAt: '2024-02-10T10:00:00.000Z'
  },
  {
    id: 'project_006',
    name: 'Data Analytics Dashboard',
    code: 'GLBL-DASH',
    clientId: 'client_003',
    status: 'active',
    startDate: '2024-03-01',
    endDate: '2024-06-30',
    description: 'Business intelligence dashboard',
    createdAt: '2024-03-01T11:00:00.000Z',
    updatedAt: '2024-03-01T11:00:00.000Z'
  },
  {
    id: 'project_007',
    name: 'Internal Tools',
    code: 'INT-TOOLS',
    clientId: 'client_004',
    status: 'active',
    startDate: '2024-01-01',
    endDate: null,
    description: 'Internal productivity tools development',
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-01-01T08:00:00.000Z'
  },
  {
    id: 'project_008',
    name: 'Team Training Program',
    code: 'INT-TRAIN',
    clientId: 'client_004',
    status: 'active',
    startDate: '2024-01-01',
    endDate: null,
    description: 'Ongoing employee training and development',
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-01-01T08:00:00.000Z'
  },
  {
    id: 'project_009',
    name: 'AI Integration',
    code: 'INNOV-AI',
    clientId: 'client_005',
    status: 'active',
    startDate: '2024-03-01',
    endDate: '2024-09-30',
    description: 'Machine learning model integration',
    createdAt: '2024-03-01T11:00:00.000Z',
    updatedAt: '2024-03-01T11:00:00.000Z'
  },
  {
    id: 'project_010',
    name: 'Security Audit',
    code: 'INNOV-SEC',
    clientId: 'client_005',
    status: 'active',
    startDate: '2024-03-15',
    endDate: '2024-04-30',
    description: 'Comprehensive security assessment',
    createdAt: '2024-03-15T09:00:00.000Z',
    updatedAt: '2024-03-15T09:00:00.000Z'
  },
  {
    id: 'project_011',
    name: 'Legacy System Maintenance',
    code: 'LEG-MAINT',
    clientId: 'client_006',
    status: 'completed',
    startDate: '2023-06-15',
    endDate: '2024-01-30',
    description: 'Maintenance and support (completed)',
    createdAt: '2023-06-15T08:00:00.000Z',
    updatedAt: '2024-01-30T16:00:00.000Z'
  }
];

// Default time log examples (for reference, not used in implementation)
export const defaultTimeLogExamples = [
  {
    id: 'log_example_001',
    type: 'clock',
    startTime: '2024-03-20T09:00:00.000Z',
    endTime: '2024-03-20T12:30:00.000Z',
    duration: '3h 30m',
    client: 'Acme Corporation',
    activity: 'Development',
    project: 'E-Commerce Platform Redesign',
    notes: 'Implemented shopping cart functionality'
  },
  {
    id: 'log_example_002',
    type: 'manual',
    startTime: '2024-03-20T13:30:00.000Z',
    endTime: '2024-03-20T15:00:00.000Z',
    duration: '1h 30m',
    client: 'TechStart Inc',
    activity: 'Meeting',
    project: 'Cloud Migration',
    notes: 'Sprint planning meeting with stakeholders'
  }
];
