# Reports & Analytics Documentation

## Table of Contents

1. [Overview](#overview)
2. [Available Charts and Metrics](#available-charts-and-metrics)
3. [Exporting Reports](#exporting-reports)
4. [Customizing Charts](#customizing-charts)
5. [Adding New Analytics](#adding-new-analytics)
6. [Performance Considerations](#performance-considerations)
7. [Integration with Other Modules](#integration-with-other-modules)
8. [Data Structure Reference](#data-structure-reference)

---

## Overview

The Reports & Analytics module provides comprehensive insights into project performance, team productivity, budget tracking, and timeline management. Built on top of React Query for efficient data fetching and Recharts for visualization, this system enables project managers to make data-driven decisions.

### Key Features

- **Real-time Analytics**: Live data updates using React Query's caching and refetching
- **Multiple Export Formats**: PDF, Excel, and CSV exports for reporting
- **Interactive Charts**: Click, hover, and drill-down capabilities
- **Responsive Design**: Mobile-friendly dashboard and charts
- **Performance Optimized**: Efficient data loading and rendering

### Architecture Overview

```
ProjectReportsTab (Container)
├── Export Controls (PDF/Excel/CSV)
├── Analytics Charts Grid
│   ├── Progress Overview Chart
│   ├── Budget Analysis Chart
│   ├── Timeline & Milestones Chart
│   └── Team Performance Chart
└── Report Summary Cards
```

### Tech Stack

- **React Query**: Data fetching, caching, and state management
- **Recharts** (v3.7.0): Chart library for data visualization
- **Lucide React**: Icon library
- **Tailwind CSS**: Styling and responsive design
- **date-fns** (v4.1.0): Date manipulation and formatting

---

## Available Charts and Metrics

### 1. Progress Overview Chart

**Purpose**: Visualizes task completion rates and overall project progress over time.

**Data Displayed**:
- Total tasks vs. completed tasks
- Progress percentage over time
- Milestone completion status
- Sprint/phase progress breakdown

**Chart Type**: Line chart or stacked area chart

**Recommended Use Cases**:
- Daily standup meetings
- Weekly progress reports
- Executive summaries

**Implementation Example**:

```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function ProgressOverviewChart({ tasks, project }) {
  // Calculate progress data
  const progressData = calculateProgressOverTime(tasks);

  return (
    <LineChart width={600} height={300} data={progressData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="completed" stroke="#8884d8" />
      <Line type="monotone" dataKey="total" stroke="#82ca9d" />
    </LineChart>
  );
}
```

### 2. Budget Analysis Chart

**Purpose**: Tracks spending against allocated budget and forecasts budget utilization.

**Data Displayed**:
- Allocated budget
- Current spending
- Budget remaining
- Burn rate (spending velocity)
- Forecast completion cost

**Chart Type**: Bar chart or pie chart

**Key Metrics**:
- Budget Utilization Rate: `(Spent / Allocated) * 100`
- Estimated Cost at Completion: `Spent + (Remaining Work * Average Cost)`
- Cost Performance Index: `Earned Value / Actual Cost`

**Implementation Example**:

```jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function BudgetAnalysisChart({ project, tasks }) {
  const budgetData = [
    {
      category: 'Budget',
      allocated: project.budget,
      spent: project.spent || 0,
      remaining: project.budget - (project.spent || 0)
    }
  ];

  return (
    <BarChart width={600} height={300} data={budgetData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="category" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="allocated" fill="#8884d8" />
      <Bar dataKey="spent" fill="#ff4444" />
      <Bar dataKey="remaining" fill="#44ff44" />
    </BarChart>
  );
}
```

### 3. Timeline & Milestones Chart

**Purpose**: Displays project schedule, key milestones, and deadline tracking.

**Data Displayed**:
- Project start and end dates
- Milestone dates and completion status
- Task timelines
- Current date indicator
- Schedule variance

**Chart Type**: Gantt chart view or timeline chart

**Key Metrics**:
- Days Remaining: `endDate - currentDate`
- Schedule Performance Index: `(Planned Value / Earned Value)`
- On-time Completion Rate: `(Completed On-Time / Total Completed) * 100`

**Implementation Example**:

```jsx
import { format, differenceInDays } from 'date-fns';

function TimelineChart({ project, milestones }) {
  const today = new Date();
  const endDate = new Date(project.end_date);
  const daysRemaining = differenceInDays(endDate, today);

  const timelineData = milestones.map(milestone => ({
    name: milestone.title,
    date: format(new Date(milestone.due_date), 'MMM dd'),
    status: milestone.completed ? 'Completed' : 'Pending'
  }));

  return (
    <div className="space-y-4">
      <div className="text-2xl font-bold">
        {daysRemaining} days remaining
      </div>
      {/* Timeline visualization */}
    </div>
  );
}
```

### 4. Team Performance Chart

**Purpose**: Analyzes team productivity, resource allocation, and workload distribution.

**Data Displayed**:
- Tasks completed per team member
- Average completion time
- Workload distribution
- Task assignment balance
- Team velocity (tasks completed per sprint)

**Chart Type**: Bar chart or radar chart

**Key Metrics**:
- Team Velocity: `Total Tasks Completed / Number of Sprints`
- Average Task Duration: `Sum(Task Duration) / Number of Tasks`
- Resource Utilization: `(Assigned Tasks / Team Capacity) * 100`

**Implementation Example**:

```jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

function TeamPerformanceChart({ tasks, teamMembers }) {
  // Group tasks by assignee
  const performanceData = teamMembers.map(member => ({
    name: member.name,
    completed: tasks.filter(t =>
      t.assigned_to === member.user_id && t.status === 'Completed'
    ).length,
    inProgress: tasks.filter(t =>
      t.assigned_to === member.user_id && t.status === 'In Progress'
    ).length,
  }));

  return (
    <BarChart width={600} height={300} data={performanceData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="completed" fill="#10b981" />
      <Bar dataKey="inProgress" fill="#f59e0b" />
    </BarChart>
  );
}
```

### 5. Summary Statistics

**Key Performance Indicators (KPIs)**:

| Metric | Calculation | Purpose |
|--------|------------|---------|
| Total Tasks | Count of all tasks | Overall project scope |
| Completed Tasks | Count where status = 'Completed' | Progress tracking |
| Team Members | Count of unique assignees | Resource allocation |
| Days Remaining | end_date - current_date | Timeline awareness |
| Completion Rate | (Completed / Total) * 100 | Success metric |
| Budget Utilization | (Spent / Budget) * 100 | Financial tracking |

---

## Exporting Reports

### Export Formats

The reporting system supports three export formats:

1. **PDF Export**: Professional formatted reports with charts and tables
2. **Excel Export**: Spreadsheet format with raw data and calculations
3. **CSV Export**: Raw data export for external analysis

### PDF Export Implementation

**Libraries Required**:
```bash
npm install jspdf jspdf-autotable html2canvas
```

**Implementation**:

```javascript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'jspdf-autotable';

export async function exportProjectReportPDF(project, tasks, charts) {
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Add title
  pdf.setFontSize(20);
  pdf.text(`Project Report: ${project.name}`, 20, 20);

  // Add project details
  pdf.setFontSize(12);
  pdf.text(`Status: ${project.status}`, 20, 35);
  pdf.text(`Progress: ${project.progress}%`, 20, 42);
  pdf.text(`Budget: $${project.budget}`, 20, 49);

  // Add summary table
  pdf.autoTable({
    startY: 60,
    head: [['Metric', 'Value']],
    body: [
      ['Total Tasks', tasks.length],
      ['Completed', tasks.filter(t => t.status === 'Completed').length],
      ['In Progress', tasks.filter(t => t.status === 'In Progress').length],
      ['Overdue', tasks.filter(t => new Date(t.due_date) < new Date()).length],
    ],
  });

  // Capture and add charts
  for (const chartId of charts) {
    const chartElement = document.getElementById(chartId);
    if (chartElement) {
      const canvas = await html2canvas(chartElement);
      const imgData = canvas.toDataURL('image/png');
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, 10, 190, 100);
    }
  }

  // Save PDF
  pdf.save(`project-report-${project.project_id}-${Date.now()}.pdf`);
}
```

**Usage**:

```jsx
import { exportProjectReportPDF } from '@/lib/exportUtils';

function ProjectReportsTab({ projectId }) {
  const { data: project } = useProject(projectId);
  const { data: tasks } = useTasks(projectId);

  const handleExportPDF = async () => {
    await exportProjectReportPDF(
      project,
      tasks,
      ['progress-chart', 'budget-chart', 'timeline-chart', 'team-chart']
    );
  };

  return (
    <Button onClick={handleExportPDF}>
      <FileText className="mr-2 h-4 w-4" />
      Export PDF
    </Button>
  );
}
```

### Excel Export Implementation

**Libraries Required**:
```bash
npm install xlsx
```

**Implementation**:

```javascript
import * as XLSX from 'xlsx';

export function exportProjectReportExcel(project, tasks, teamMembers) {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Project Summary Sheet
  const summaryData = [
    ['Project Report'],
    ['Project Name', project.name],
    ['Status', project.status],
    ['Progress', `${project.progress}%`],
    ['Budget', `$${project.budget}`],
    ['Start Date', project.start_date],
    ['End Date', project.end_date],
    [],
    ['Summary Metrics'],
    ['Total Tasks', tasks.length],
    ['Completed Tasks', tasks.filter(t => t.status === 'Completed').length],
    ['In Progress', tasks.filter(t => t.status === 'In Progress').length],
    ['Pending', tasks.filter(t => t.status === 'To Do').length],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Tasks Sheet
  const tasksData = tasks.map(task => ({
    'Task ID': task.task_id,
    'Title': task.title,
    'Status': task.status,
    'Priority': task.priority,
    'Assigned To': task.assigned_to,
    'Due Date': task.due_date,
    'Progress': task.progress,
    'Created': task.created_at,
  }));

  const tasksSheet = XLSX.utils.json_to_sheet(tasksData);
  XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');

  // Team Performance Sheet
  const teamData = teamMembers.map(member => ({
    'Team Member': member.name,
    'Assigned Tasks': tasks.filter(t => t.assigned_to === member.user_id).length,
    'Completed': tasks.filter(t =>
      t.assigned_to === member.user_id && t.status === 'Completed'
    ).length,
    'In Progress': tasks.filter(t =>
      t.assigned_to === member.user_id && t.status === 'In Progress'
    ).length,
  }));

  const teamSheet = XLSX.utils.json_to_sheet(teamData);
  XLSX.utils.book_append_sheet(workbook, teamSheet, 'Team Performance');

  // Export file
  XLSX.writeFile(workbook, `project-report-${project.project_id}-${Date.now()}.xlsx`);
}
```

### CSV Export Implementation

**Implementation**:

```javascript
export function exportProjectReportCSV(tasks) {
  // Define headers
  const headers = [
    'Task ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Assigned To',
    'Due Date',
    'Progress',
    'Created At',
    'Updated At'
  ];

  // Convert tasks to CSV rows
  const rows = tasks.map(task => [
    task.task_id,
    `"${task.title}"`, // Wrap in quotes for comma handling
    `"${task.description || ''}"`,
    task.status,
    task.priority,
    task.assigned_to,
    task.due_date,
    task.progress,
    task.created_at,
    task.updated_at
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `tasks-export-${Date.now()}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

---

## Customizing Charts

### Chart Configuration

Recharts provides extensive customization options for styling and behavior.

#### Color Schemes

Define consistent color schemes for your organization:

```javascript
// src/lib/chartThemes.js
export const chartColors = {
  primary: '#3b82f6',      // Blue
  success: '#10b981',      // Green
  warning: '#f59e0b',      // Orange
  danger: '#ef4444',       // Red
  info: '#06b6d4',         // Cyan
  purple: '#8b5cf6',       // Purple
};

export const statusColors = {
  'To Do': '#94a3b8',      // Gray
  'In Progress': '#f59e0b', // Orange
  'Completed': '#10b981',   // Green
  'On Hold': '#ef4444',     // Red
};

export const priorityColors = {
  'High': '#ef4444',       // Red
  'Medium': '#f59e0b',     // Orange
  'Low': '#10b981',        // Green
};
```

#### Custom Tooltip

Create branded tooltips with consistent styling:

```jsx
// src/components/projects/charts/CustomTooltip.jsx
export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;

  return (
    <Card className="p-3 shadow-lg">
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold">{entry.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

**Usage**:

```jsx
<LineChart width={600} height={300} data={data}>
  <Tooltip content={<CustomTooltip />} />
  {/* Other components */}
</LineChart>
```

#### Responsive Charts

Make charts responsive to container size:

```jsx
import { ResponsiveContainer, LineChart, Line } from 'recharts';

function ResponsiveChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

#### Animation Configuration

Control chart animations:

```jsx
<LineChart data={data}>
  <Line
    type="monotone"
    dataKey="value"
    stroke="#8884d8"
    animationDuration={1000}
    animationEasing="ease-in-out"
  />
</LineChart>
```

Disable animations for performance:

```jsx
<LineChart data={data} isAnimationActive={false}>
  {/* Components */}
</LineChart>
```

---

## Adding New Analytics

### Step-by-Step Guide

Follow these steps to add a new analytics chart to the reporting system:

#### Step 1: Define Your Data Requirements

Identify what data you need and where it comes from:

```javascript
// Example: Resource utilization chart
// Data needed:
// - Team members (from project.team)
// - Tasks per member (from tasks API)
// - Member capacity (from user settings)
```

#### Step 2: Create Data Transformation Function

Create a utility function to transform raw data into chart format:

```javascript
// src/lib/analyticsUtils.js
export function calculateResourceUtilization(tasks, teamMembers) {
  return teamMembers.map(member => {
    const assignedTasks = tasks.filter(t => t.assigned_to === member.user_id);
    const capacity = member.capacity || 40; // Default 40 hours/week

    const hoursAllocated = assignedTasks.reduce((sum, task) =>
      sum + (task.estimated_hours || 0), 0
    );

    return {
      name: member.name,
      utilization: (hoursAllocated / capacity) * 100,
      hours: hoursAllocated,
      capacity: capacity,
    };
  });
}
```

#### Step 3: Create Chart Component

Build the chart component using Recharts:

```jsx
// src/components/projects/charts/ResourceUtilizationChart.jsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateResourceUtilization } from '@/lib/analyticsUtils';
import { CustomTooltip } from './CustomTooltip';

export function ResourceUtilizationChart({ tasks, teamMembers }) {
  const data = calculateResourceUtilization(tasks, teamMembers);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }}
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="utilization"
              fill="#3b82f6"
              name="Utilization %"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

#### Step 4: Add to Reports Tab

Integrate the new chart into the reports interface:

```jsx
// src/components/projects/detail/ProjectReportsTab.jsx
import { ResourceUtilizationChart } from '../charts/ResourceUtilizationChart';

export function ProjectReportsTab({ projectId }) {
  const { data: project } = useProject(projectId);
  const { data: tasksData } = useTasks(projectId);
  const tasks = tasksData?.tasks || [];
  const teamMembers = project?.team || [];

  return (
    <div className="space-y-6">
      {/* Existing charts */}

      {/* Add new chart */}
      <ResourceUtilizationChart
        tasks={tasks}
        teamMembers={teamMembers}
      />
    </div>
  );
}
```

#### Step 5: Add Export Support

Update export functions to include the new chart:

```javascript
// Add to exportProjectReportPDF
export async function exportProjectReportPDF(project, tasks, charts) {
  // ... existing code ...

  // Add resource utilization chart
  charts.push('resource-utilization-chart');

  // ... rest of export logic ...
}
```

#### Step 6: Document the New Chart

Update this README with details about the new chart:

```markdown
### 6. Resource Utilization Chart

**Purpose**: Track team member workload and capacity utilization.

**Data Displayed**:
- Hours allocated vs. capacity
- Utilization percentage per team member
- Over-allocated resources

**Key Metrics**:
- Utilization Rate: `(Allocated Hours / Capacity) * 100`
```

---

## Performance Considerations

### Data Fetching Optimization

#### 1. Implement Query Caching

React Query automatically caches data, but configure optimal cache times:

```javascript
// src/hooks/useProjectAnalytics.js
export function useProjectAnalytics(projectId) {
  return useQuery({
    queryKey: ['project-analytics', projectId],
    queryFn: () => fetchProjectAnalytics(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}
```

#### 2. Use Parallel Queries

Fetch multiple data sources in parallel:

```javascript
function ProjectReportsTab({ projectId }) {
  const projectQuery = useProject(projectId);
  const tasksQuery = useTasks(projectId);
  const teamQuery = useTeamMembers(projectId);

  // All queries run in parallel
  const isLoading = projectQuery.isLoading || tasksQuery.isLoading || teamQuery.isLoading;

  if (isLoading) return <LoadingSpinner />;

  // Use data
}
```

#### 3. Implement Pagination for Large Datasets

For projects with many tasks, paginate the data:

```javascript
export function usePaginatedTasks(projectId, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['tasks', projectId, page],
    queryFn: () => taskApi.list({ project_id: projectId, page, limit }),
    keepPreviousData: true, // Keep old data while fetching new
  });
}
```

### Chart Rendering Optimization

#### 1. Memoize Data Transformations

Use `useMemo` to avoid recalculating chart data:

```jsx
function ProgressChart({ tasks }) {
  const chartData = useMemo(() => {
    return calculateProgressOverTime(tasks);
  }, [tasks]);

  return <LineChart data={chartData}>{/* ... */}</LineChart>;
}
```

#### 2. Virtualize Large Lists

For tables with many rows, use virtualization:

```bash
npm install @tanstack/react-virtual
```

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

function TaskTable({ tasks }) {
  const parentRef = React.useRef();

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div key={virtualRow.index} style={{ height: '45px' }}>
            {tasks[virtualRow.index].title}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 3. Lazy Load Charts

Only render charts when they're visible:

```jsx
import { Suspense, lazy } from 'react';

const ProgressChart = lazy(() => import('./charts/ProgressChart'));
const BudgetChart = lazy(() => import('./charts/BudgetChart'));

function ProjectReportsTab() {
  return (
    <div>
      <Suspense fallback={<ChartSkeleton />}>
        <ProgressChart />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <BudgetChart />
      </Suspense>
    </div>
  );
}
```

#### 4. Debounce Filter Changes

Prevent excessive re-renders when users adjust filters:

```jsx
import { useDebouncedValue } from '@/hooks/useDebounce';

function ProjectFilters({ onFilterChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    onFilterChange({ search: debouncedSearch });
  }, [debouncedSearch]);

  return <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />;
}
```

### Memory Management

#### 1. Clean Up Subscriptions

Always clean up event listeners and subscriptions:

```jsx
useEffect(() => {
  const interval = setInterval(() => {
    // Refresh data every 30 seconds
    refetch();
  }, 30000);

  return () => clearInterval(interval);
}, [refetch]);
```

#### 2. Limit Chart Data Points

For time-series data, aggregate to reduce points:

```javascript
function aggregateDataPoints(data, maxPoints = 50) {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}
```

---

## Integration with Other Modules

### Project Management Integration

The reporting system integrates with the core project management features:

#### 1. Task Management

**Data Flow**:
```
Tasks API → React Query Cache → Analytics Calculations → Chart Components
```

**Usage in Reports**:
```javascript
import { useTasks } from '@/hooks/useTasks';

function TaskAnalytics({ projectId }) {
  const { data: tasksData } = useTasks(projectId);
  const tasks = tasksData?.tasks || [];

  // Calculate metrics
  const completionRate = (tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100;

  return <div>Completion Rate: {completionRate}%</div>;
}
```

#### 2. Team Management

**Integration Point**: `/src/components/projects/detail/ProjectTeamTab.jsx`

```javascript
// Fetch team data for analytics
export function useProjectTeam(projectId) {
  const { data: project } = useProject(projectId);
  const { data: tasksData } = useTasks(projectId);

  return {
    team: project?.team || [],
    tasks: tasksData?.tasks || [],
    // Derived metrics
    teamSize: project?.team?.length || 0,
    avgTasksPerMember: (tasksData?.tasks?.length || 0) / (project?.team?.length || 1),
  };
}
```

#### 3. Materials and Budget

**Integration Point**: `/src/components/projects/detail/ProjectMaterialsTab.jsx`

```javascript
import { useMaterials } from '@/hooks/useMaterials';

function BudgetAnalytics({ projectId }) {
  const { data: project } = useProject(projectId);
  const { data: materials } = useMaterials(projectId);

  const materialsCost = materials?.reduce((sum, m) => sum + (m.cost || 0), 0) || 0;
  const totalBudget = project?.budget || 0;
  const budgetRemaining = totalBudget - materialsCost;

  return (
    <Card>
      <CardContent>
        <div>Materials Cost: ${materialsCost}</div>
        <div>Budget Remaining: ${budgetRemaining}</div>
      </CardContent>
    </Card>
  );
}
```

### Gantt Chart Integration

Leverage the Gantt view for timeline analytics:

**Reference**: `/src/components/projects/views/GANTT_README.md`

```javascript
import { ProjectGanttView } from '@/components/projects/views/ProjectGanttView';

// Extract timeline data from Gantt
export function getTimelineMetrics(tasks) {
  const startDate = new Date(Math.min(...tasks.map(t => new Date(t.start_date))));
  const endDate = new Date(Math.max(...tasks.map(t => new Date(t.end_date))));
  const duration = differenceInDays(endDate, startDate);

  return {
    startDate,
    endDate,
    duration,
    criticalPath: calculateCriticalPath(tasks),
  };
}
```

### Kanban Board Integration

Use Kanban data for workflow analytics:

**Reference**: `/src/components/projects/views/KANBAN_README.md`

```javascript
// Calculate workflow metrics from Kanban data
export function getWorkflowMetrics(tasks) {
  const statusGroups = {
    'To Do': tasks.filter(t => t.status === 'To Do'),
    'In Progress': tasks.filter(t => t.status === 'In Progress'),
    'Completed': tasks.filter(t => t.status === 'Completed'),
  };

  return {
    wip: statusGroups['In Progress'].length,
    wipLimit: 10, // Configure per project
    throughput: statusGroups['Completed'].length,
    cycleTime: calculateAverageCycleTime(statusGroups['Completed']),
  };
}
```

### Dashboard Statistics

The analytics feed into the main dashboard:

**Reference**: `/src/components/projects/ProjectStatsCards.jsx`

```javascript
// Aggregate project statistics for dashboard
export function useProjectStats() {
  const { data: projectsData } = useProjects();
  const projects = projectsData?.projects || [];

  return {
    totalProjects: projects.length,
    inProgress: projects.filter(p => p.status === 'In Progress').length,
    completed: projects.filter(p => p.status === 'Completed').length,
    avgCompletion: projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length,
  };
}
```

---

## Data Structure Reference

### Project Object

```typescript
interface Project {
  project_id: string;
  name: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  progress: number; // 0-100
  budget: number;
  spent?: number;
  start_date: string; // ISO date
  end_date: string; // ISO date
  branch_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  team?: TeamMember[];
}
```

### Task Object

```typescript
interface Task {
  task_id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Completed' | 'On Hold';
  priority: 'High' | 'Medium' | 'Low';
  progress: number; // 0-100
  assigned_to: string; // user_id
  due_date: string; // ISO date
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  created_at: string;
  updated_at: string;
  dependencies?: string[]; // task_ids
}
```

### Team Member Object

```typescript
interface TeamMember {
  user_id: string;
  name: string;
  email: string;
  role: string;
  capacity?: number; // hours per week
  avatar_url?: string;
}
```

### Chart Data Format

```typescript
// Time-series data
interface TimeSeriesData {
  date: string; // 'YYYY-MM-DD'
  value: number;
  label?: string;
}

// Category data
interface CategoryData {
  name: string;
  value: number;
  color?: string;
}

// Multi-series data
interface MultiSeriesData {
  name: string;
  [key: string]: string | number; // Dynamic keys for different series
}
```

### Analytics Response

```typescript
interface ProjectAnalytics {
  project_id: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    completionRate: number;
    avgTaskDuration: number;
    teamVelocity: number;
  };
  trends: {
    daily: TimeSeriesData[];
    weekly: TimeSeriesData[];
    monthly: TimeSeriesData[];
  };
  team: {
    member_id: string;
    tasksAssigned: number;
    tasksCompleted: number;
    utilizationRate: number;
  }[];
}
```

---

## Best Practices

### 1. Error Handling

Always handle loading and error states gracefully:

```jsx
function AnalyticsChart({ projectId }) {
  const { data, isLoading, isError, error } = useProjectAnalytics(projectId);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Failed to load analytics: {error.message}
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return <Chart data={data} />;
}
```

### 2. Accessibility

Make charts accessible to all users:

```jsx
<ResponsiveContainer width="100%" height={300} role="img" aria-label="Project progress chart">
  <LineChart data={data}>
    {/* Chart components */}
  </LineChart>
</ResponsiveContainer>
```

### 3. Data Validation

Validate data before rendering:

```javascript
function validateChartData(data) {
  if (!Array.isArray(data)) return [];

  return data.filter(point =>
    point &&
    typeof point.value === 'number' &&
    !isNaN(point.value)
  );
}
```

### 4. Testing

Write tests for data transformations:

```javascript
// analyticsUtils.test.js
import { calculateProgressOverTime } from './analyticsUtils';

describe('calculateProgressOverTime', () => {
  it('should calculate daily progress correctly', () => {
    const tasks = [
      { status: 'Completed', completed_at: '2024-01-01' },
      { status: 'Completed', completed_at: '2024-01-01' },
      { status: 'Completed', completed_at: '2024-01-02' },
    ];

    const result = calculateProgressOverTime(tasks);
    expect(result).toEqual([
      { date: '2024-01-01', completed: 2 },
      { date: '2024-01-02', completed: 1 },
    ]);
  });
});
```

---

## Troubleshooting

### Common Issues

#### Charts Not Rendering

**Problem**: Charts appear blank or don't render.

**Solutions**:
1. Check data format matches chart requirements
2. Verify ResponsiveContainer has a defined height
3. Check browser console for errors
4. Ensure data array is not empty

```jsx
// Debug data
console.log('Chart data:', data);

// Ensure container has height
<div style={{ height: '300px' }}>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>{/* ... */}</LineChart>
  </ResponsiveContainer>
</div>
```

#### Export Functionality Not Working

**Problem**: Export buttons don't download files.

**Solutions**:
1. Check browser console for errors
2. Verify required libraries are installed
3. Check popup blocker settings
4. Ensure data is loaded before export

```javascript
const handleExport = async () => {
  if (!project || !tasks) {
    toast.error('Please wait for data to load');
    return;
  }

  try {
    await exportProjectReportPDF(project, tasks);
    toast.success('Report exported successfully');
  } catch (error) {
    console.error('Export failed:', error);
    toast.error('Failed to export report');
  }
};
```

#### Performance Issues

**Problem**: Charts lag or UI becomes unresponsive.

**Solutions**:
1. Implement data pagination
2. Reduce chart data points
3. Use chart animations sparingly
4. Memoize expensive calculations

```jsx
// Limit data points
const chartData = useMemo(() => {
  const data = calculateChartData(tasks);
  return aggregateDataPoints(data, 100); // Max 100 points
}, [tasks]);
```

---

## Additional Resources

### Related Documentation

- [Gantt Chart View Documentation](/src/components/projects/views/GANTT_README.md)
- [Kanban Board Documentation](/src/components/projects/views/KANBAN_README.md)
- [Project Overview Tab](/src/components/projects/detail/ProjectOverviewTab.jsx)
- [Project Stats Cards](/src/components/projects/ProjectStatsCards.jsx)

### External Libraries

- [Recharts Documentation](https://recharts.org/en-US/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [date-fns Documentation](https://date-fns.org/)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [XLSX Documentation](https://docs.sheetjs.com/)

### Code Examples

Check the following files for implementation examples:

- **Reports Tab**: `/src/components/projects/detail/ProjectReportsTab.jsx`
- **Stats Cards**: `/src/components/projects/ProjectStatsCards.jsx`
- **Project API**: `/src/lib/projectApi.js`
- **Task API**: `/src/lib/taskApi.js`
- **React Query Hooks**: `/src/hooks/useProjects.js`, `/src/hooks/useTasks.js`

---

## Contributing

When adding new analytics features:

1. Follow the existing code structure and naming conventions
2. Add comprehensive JSDoc comments
3. Update this documentation
4. Write unit tests for data transformations
5. Test on multiple screen sizes and browsers
6. Consider accessibility requirements
7. Optimize for performance

---

## Version History

- **v1.0.0** (2024-02-05): Initial documentation created
  - Overview of analytics features
  - Available charts and metrics
  - Export functionality (PDF/Excel/CSV)
  - Customization guide
  - Performance optimization tips
  - Integration documentation

---

## Support

For questions or issues related to the reporting and analytics system:

1. Check this documentation first
2. Review the code examples in referenced files
3. Check the browser console for error messages
4. Contact the development team with specific details about your issue

---

**Last Updated**: February 5, 2024
**Maintained By**: Development Team
**Location**: `/src/components/projects/detail/REPORTS_README.md`
