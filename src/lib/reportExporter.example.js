/**
 * Report Exporter Usage Examples
 *
 * This file demonstrates how to use the report export utilities
 */

import {
  exportToPDF,
  exportToCSV,
  exportProjectReport,
  exportTasksToCSV,
  exportMaterialsToCSV,
  exportWithLoading,
  batchExport,
} from './reportExporter.js';

// ============================================================================
// Example 1: Export a DOM element to PDF
// ============================================================================

export function handleExportReportToPDF() {
  const elementId = 'report-container'; // ID of the DOM element containing your report
  const filename = 'project-report';

  exportToPDF(elementId, filename, {
    orientation: 'portrait',
    format: 'a4',
  })
    .then(() => {
      console.log('PDF exported successfully');
    })
    .catch((error) => {
      console.error('Failed to export PDF:', error);
    });
}

// ============================================================================
// Example 2: Export data to CSV
// ============================================================================

export function handleExportDataToCSV() {
  const data = [
    { id: 1, name: 'Task 1', status: 'completed', assignee: 'John Doe' },
    { id: 2, name: 'Task 2', status: 'in_progress', assignee: 'Jane Smith' },
    { id: 3, name: 'Task 3', status: 'pending', assignee: 'Bob Johnson' },
  ];

  const headers = [
    { key: 'id', label: 'Task ID' },
    { key: 'name', label: 'Task Name' },
    { key: 'status', label: 'Status' },
    { key: 'assignee', label: 'Assigned To' },
  ];

  exportToCSV(data, 'tasks-list', headers);
}

// ============================================================================
// Example 3: Export comprehensive project report
// ============================================================================

export async function handleExportProjectReport(project, tasks, materials) {
  try {
    // Export as PDF
    await exportProjectReport(project, tasks, materials, 'pdf');
    console.log('Project report exported as PDF');

    // Or export as CSV (creates multiple CSV files)
    // await exportProjectReport(project, tasks, materials, 'csv');
  } catch (error) {
    console.error('Failed to export project report:', error);
  }
}

// ============================================================================
// Example 4: Export tasks to CSV
// ============================================================================

export function handleExportTasksList(tasks) {
  try {
    exportTasksToCSV(tasks, 'project-tasks');
    console.log('Tasks exported successfully');
  } catch (error) {
    console.error('Failed to export tasks:', error);
  }
}

// ============================================================================
// Example 5: Export materials to CSV
// ============================================================================

export function handleExportMaterialsList(materials) {
  try {
    exportMaterialsToCSV(materials, 'project-materials');
    console.log('Materials exported successfully');
  } catch (error) {
    console.error('Failed to export materials:', error);
  }
}

// ============================================================================
// Example 6: Export with loading state and toast notifications
// ============================================================================

export function ExportButtonWithLoading({ project, tasks, materials }) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    await exportWithLoading(
      () => exportProjectReport(project, tasks, materials, 'pdf'),
      setIsExporting,
      (toast) => {
        // Using sonner toast library (already in dependencies)
        if (toast.variant === 'success') {
          console.log('Success:', toast.description);
        } else {
          console.error('Error:', toast.description);
        }
      }
    );
  };

  return (
    <button onClick={handleExport} disabled={isExporting}>
      {isExporting ? 'Exporting...' : 'Export Report'}
    </button>
  );
}

// ============================================================================
// Example 7: Batch export multiple reports
// ============================================================================

export async function handleBatchExport(projects) {
  const exportJobs = projects.map((project) => ({
    name: `Project ${project.id}`,
    exportFn: async () => {
      const tasks = await fetchProjectTasks(project.id);
      const materials = await fetchProjectMaterials(project.id);
      return exportProjectReport(project, tasks, materials, 'csv');
    },
  }));

  const results = await batchExport(exportJobs);

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`Batch export complete: ${successful} succeeded, ${failed} failed`);

  return results;
}

// ============================================================================
// Example 8: React Component with Export Button
// ============================================================================

export function ProjectReportExportButton({ projectId }) {
  const [isExporting, setIsExporting] = React.useState(false);
  const [project, setProject] = React.useState(null);
  const [tasks, setTasks] = React.useState([]);
  const [materials, setMaterials] = React.useState([]);

  // Load data
  React.useEffect(() => {
    async function loadData() {
      // Fetch project data from your API
      const projectData = await fetch(`/api/projects/${projectId}`).then((r) => r.json());
      const tasksData = await fetch(`/api/projects/${projectId}/tasks`).then((r) => r.json());
      const materialsData = await fetch(`/api/projects/${projectId}/materials`).then((r) =>
        r.json()
      );

      setProject(projectData);
      setTasks(tasksData);
      setMaterials(materialsData);
    }

    loadData();
  }, [projectId]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportProjectReport(project, tasks, materials, 'pdf');
      alert('Report exported successfully!');
    } catch (error) {
      alert(`Failed to export report: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await exportProjectReport(project, tasks, materials, 'csv');
      alert('Report exported successfully!');
    } catch (error) {
      alert(`Failed to export report: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <button onClick={handleExportPDF} disabled={isExporting || !project}>
        {isExporting ? 'Exporting...' : 'Export as PDF'}
      </button>
      <button onClick={handleExportCSV} disabled={isExporting || !project}>
        {isExporting ? 'Exporting...' : 'Export as CSV'}
      </button>
    </div>
  );
}

// ============================================================================
// Example 9: Export current page/view
// ============================================================================

export function handleExportCurrentView() {
  // This will export whatever is currently visible in the #main-content element
  const elementId = 'main-content';
  const filename = `view-export-${new Date().toISOString().split('T')[0]}`;

  exportToPDF(elementId, filename, {
    orientation: 'landscape', // Good for wide dashboards
    format: 'a4',
  })
    .then(() => {
      console.log('Current view exported successfully');
    })
    .catch((error) => {
      console.error('Failed to export view:', error);
    });
}

// ============================================================================
// Helper functions (you would implement these based on your API)
// ============================================================================

async function fetchProjectTasks(projectId) {
  const response = await fetch(`/api/projects/${projectId}/tasks`);
  return response.json();
}

async function fetchProjectMaterials(projectId) {
  const response = await fetch(`/api/projects/${projectId}/materials`);
  return response.json();
}
