import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { FileDown, FileSpreadsheet, TrendingUp, Users, Target, DollarSign } from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * ProjectReportsTab Component
 * Displays comprehensive analytics and reports for a project
 * Includes progress tracking, task distributions, team workload, and budget analysis
 *
 * @param {Object} project - Project data
 * @param {string} projectId - Project ID
 */
export function ProjectReportsTab({ project, projectId }) {
  // Fetch all tasks for analytics
  const { data: tasksData, isLoading } = useTasks(projectId);
  const tasks = tasksData?.tasks || [];

  // Calculate analytics data
  const analytics = useMemo(() => calculateAnalytics(project, tasks), [project, tasks]);

  // Handle export functions
  const handleExportPDF = () => {
    // TODO: Implement PDF export using jsPDF or similar
    console.log('Exporting to PDF...');
  };

  const handleExportCSV = () => {
    // Generate CSV data
    const csvData = generateCSVData(analytics, tasks);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-${projectId}-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Comprehensive project insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.teamMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active contributors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              Budget Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.budgetUtilization}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.remainingBudget > 0 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid - 2 Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Progress Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Over Time</CardTitle>
            <CardDescription>Project completion trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.progressHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Progress %"
                />
                <Line
                  type="monotone"
                  dataKey="tasksCompleted"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Tasks Done"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
            <CardDescription>Breakdown by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Priority Distribution</CardTitle>
            <CardDescription>Tasks grouped by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.priorityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Workload */}
        <Card>
          <CardHeader>
            <CardTitle>Team Workload</CardTitle>
            <CardDescription>Assigned vs completed tasks per member</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.teamWorkload}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" fill="#3b82f6" name="Assigned" />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget Tracking */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Budget Tracking</CardTitle>
            <CardDescription>Planned vs actual costs breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Planned Budget</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${formatCurrency(analytics.plannedBudget)}
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Actual Spent</span>
                  <span className="text-lg font-bold text-orange-600">
                    ${formatCurrency(analytics.actualSpent)}
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{
                      width: `${Math.min(
                        (analytics.actualSpent / analytics.plannedBudget) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Remaining</span>
                  <span
                    className={`text-lg font-bold ${
                      analytics.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    ${formatCurrency(Math.abs(analytics.remainingBudget))}
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      analytics.remainingBudget >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        Math.abs((analytics.remainingBudget / analytics.plannedBudget) * 100),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Budget Alert */}
            {analytics.budgetUtilization > 90 && (
              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Warning:</strong> Budget utilization is at {analytics.budgetUtilization}%. Consider reviewing expenses.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Project Insights</CardTitle>
          <CardDescription>Key observations and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {generateInsights(analytics).map((insight, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className={`mt-0.5 h-2 w-2 rounded-full ${insight.color}`} />
              <p className="text-sm flex-1">{insight.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate comprehensive analytics from project and tasks data
 */
function calculateAnalytics(project, tasks) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Status distribution
  const statusCounts = tasks.reduce((acc, task) => {
    const status = task.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
    name: formatStatusName(name),
    value,
  }));

  // Priority distribution
  const priorityCounts = tasks.reduce((acc, task) => {
    const priority = task.priority || 'medium';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  const priorityDistribution = Object.entries(priorityCounts).map(([name, value]) => ({
    name: formatPriorityName(name),
    value,
  }));

  // Team workload
  const teamWorkload = calculateTeamWorkload(tasks);
  const teamMembers = teamWorkload.length;

  // Progress history (simulated - in real app, would come from historical data)
  const progressHistory = generateProgressHistory(project, completedTasks, totalTasks);

  // Budget tracking
  const plannedBudget = parseFloat(project.budget || 0);
  const actualSpent = parseFloat(project.spent || 0);
  const remainingBudget = plannedBudget - actualSpent;
  const budgetUtilization = plannedBudget > 0 ? Math.round((actualSpent / plannedBudget) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    completionRate,
    statusDistribution,
    priorityDistribution,
    teamWorkload,
    teamMembers,
    progressHistory,
    plannedBudget,
    actualSpent,
    remainingBudget,
    budgetUtilization,
  };
}

/**
 * Calculate team workload from tasks
 */
function calculateTeamWorkload(tasks) {
  const workload = tasks.reduce((acc, task) => {
    const assignee = task.assigned_to || task.assignee || 'Unassigned';
    if (!acc[assignee]) {
      acc[assignee] = { assigned: 0, completed: 0 };
    }
    acc[assignee].assigned++;
    if (task.status === 'completed') {
      acc[assignee].completed++;
    }
    return acc;
  }, {});

  return Object.entries(workload)
    .map(([name, data]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      assigned: data.assigned,
      completed: data.completed,
    }))
    .sort((a, b) => b.assigned - a.assigned)
    .slice(0, 10); // Top 10 team members
}

/**
 * Generate progress history data
 * In production, this would fetch actual historical data
 */
function generateProgressHistory(project, completedTasks, totalTasks) {
  const startDate = new Date(project.start_date || project.created_at || Date.now());
  const today = new Date();
  const daysDiff = Math.max(Math.floor((today - startDate) / (1000 * 60 * 60 * 24)), 7);

  // Generate data points for the last N days
  const dataPoints = Math.min(daysDiff, 30);
  const history = [];

  for (let i = 0; i <= dataPoints; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor((i / dataPoints) * daysDiff));

    // Simulate progress curve
    const progressFactor = i / dataPoints;
    const progress = Math.round(progressFactor * (project.progress || completedTasks / totalTasks * 100 || 0));
    const tasksCompleted = Math.round(progressFactor * completedTasks);

    history.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      progress,
      tasksCompleted,
    });
  }

  return history;
}

/**
 * Generate insights based on analytics
 */
function generateInsights(analytics) {
  const insights = [];

  // Completion rate insight
  if (analytics.completionRate >= 80) {
    insights.push({
      message: `Excellent progress! ${analytics.completionRate}% of tasks are completed.`,
      color: 'bg-green-500',
    });
  } else if (analytics.completionRate >= 50) {
    insights.push({
      message: `Good progress at ${analytics.completionRate}%. Keep up the momentum!`,
      color: 'bg-blue-500',
    });
  } else {
    insights.push({
      message: `Project is at ${analytics.completionRate}% completion. Consider reviewing timelines.`,
      color: 'bg-orange-500',
    });
  }

  // Budget insight
  if (analytics.budgetUtilization > 100) {
    insights.push({
      message: `Budget exceeded by ${analytics.budgetUtilization - 100}%. Review spending and allocate additional funds if needed.`,
      color: 'bg-red-500',
    });
  } else if (analytics.budgetUtilization > 90) {
    insights.push({
      message: `Budget utilization at ${analytics.budgetUtilization}%. Monitor spending closely.`,
      color: 'bg-orange-500',
    });
  } else {
    insights.push({
      message: `Budget is on track at ${analytics.budgetUtilization}% utilization.`,
      color: 'bg-green-500',
    });
  }

  // Team workload insight
  if (analytics.teamWorkload.length > 0) {
    const avgLoad = analytics.teamWorkload.reduce((sum, member) => sum + member.assigned, 0) / analytics.teamWorkload.length;
    if (avgLoad > 10) {
      insights.push({
        message: `High team workload detected (avg ${Math.round(avgLoad)} tasks/member). Consider redistributing tasks.`,
        color: 'bg-orange-500',
      });
    }
  }

  // Priority insight
  const highPriority = analytics.priorityDistribution.find(p => p.name === 'High')?.value || 0;
  if (highPriority > analytics.totalTasks * 0.3) {
    insights.push({
      message: `${highPriority} high-priority tasks detected. Focus on critical items first.`,
      color: 'bg-red-500',
    });
  }

  return insights;
}

/**
 * Generate CSV data for export
 */
function generateCSVData(analytics, tasks) {
  let csv = 'Project Report\n\n';

  // Summary
  csv += 'Summary\n';
  csv += 'Metric,Value\n';
  csv += `Total Tasks,${analytics.totalTasks}\n`;
  csv += `Completed Tasks,${analytics.completedTasks}\n`;
  csv += `Completion Rate,${analytics.completionRate}%\n`;
  csv += `Team Members,${analytics.teamMembers}\n`;
  csv += `Planned Budget,$${analytics.plannedBudget}\n`;
  csv += `Actual Spent,$${analytics.actualSpent}\n`;
  csv += `Remaining Budget,$${analytics.remainingBudget}\n`;
  csv += '\n';

  // Tasks detail
  csv += 'Tasks Detail\n';
  csv += 'Title,Status,Priority,Assigned To,Due Date\n';
  tasks.forEach(task => {
    csv += `"${task.title}",${task.status},${task.priority},${task.assigned_to || 'Unassigned'},${task.due_date || 'No date'}\n`;
  });

  return csv;
}

/**
 * Custom label renderer for pie charts
 */
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Hide labels for small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/**
 * Format status name for display
 */
function formatStatusName(status) {
  const statusMap = {
    pending: 'Pending',
    in_progress: 'In Progress',
    blocked: 'Blocked',
    completed: 'Completed',
  };
  return statusMap[status] || status;
}

/**
 * Format priority name for display
 */
function formatPriorityName(priority) {
  const priorityMap = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };
  return priorityMap[priority] || priority;
}

/**
 * Format currency values
 */
function formatCurrency(value) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================================================
// Color Schemes
// ============================================================================

const STATUS_COLORS = {
  Pending: '#94a3b8',      // slate-400
  'In Progress': '#3b82f6', // blue-500
  Blocked: '#ef4444',      // red-500
  Completed: '#10b981',    // green-500
};

const PRIORITY_COLORS = {
  Low: '#6ee7b7',          // emerald-300
  Medium: '#fbbf24',       // amber-400
  High: '#f97316',         // orange-500
  Urgent: '#dc2626',       // red-600
};
