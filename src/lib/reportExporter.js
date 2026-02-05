/**
 * Report Export Utilities
 * Provides functions for exporting reports to PDF and CSV formats
 *
 * Dependencies Required:
 * npm install jspdf html2canvas
 */

// Import will fail until dependencies are installed
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';

/**
 * Export a DOM element to PDF
 * @param {string} elementId - ID of the DOM element to export
 * @param {string} filename - Name of the PDF file (without extension)
 * @param {Object} options - Additional options
 * @param {string} options.orientation - 'portrait' or 'landscape' (default: 'portrait')
 * @param {string} options.format - Page format like 'a4', 'letter' (default: 'a4')
 * @returns {Promise<void>}
 * @throws {Error} If element not found or export fails
 */
export async function exportToPDF(elementId, filename, options = {}) {
  try {
    // Dynamic import to handle missing dependencies gracefully
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf').catch(() => {
        throw new Error('jspdf is not installed. Please run: npm install jspdf');
      }),
      import('html2canvas').catch(() => {
        throw new Error('html2canvas is not installed. Please run: npm install html2canvas');
      }),
    ]);

    // Get the element
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Default options
    const {
      orientation = 'portrait',
      format = 'a4',
      quality = 0.95,
      scale = 2,
    } = options;

    // Create canvas from element
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Calculate dimensions
    const imgWidth = orientation === 'portrait' ? 210 : 297; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
      compress: true,
    });

    // Add image to PDF
    const imgData = canvas.toDataURL('image/jpeg', quality);
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

    // Save the PDF
    pdf.save(`${filename}.pdf`);

    return { success: true, message: 'PDF exported successfully' };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error(`Failed to export PDF: ${error.message}`);
  }
}

/**
 * Export data array to CSV file
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} filename - Name of the CSV file (without extension)
 * @param {Array<Object>} headers - Optional custom headers
 * @param {string} headers[].key - Object key to extract
 * @param {string} headers[].label - Column header label
 * @returns {void}
 * @throws {Error} If export fails
 */
export function exportToCSV(data, filename, headers = null) {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Generate headers
    let csvHeaders;
    let keys;

    if (headers && Array.isArray(headers)) {
      // Use custom headers
      csvHeaders = headers.map(h => h.label || h.key);
      keys = headers.map(h => h.key);
    } else {
      // Auto-generate from first object
      keys = Object.keys(data[0]);
      csvHeaders = keys.map(key =>
        key.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      );
    }

    // Helper function to escape CSV values
    const escapeCSVValue = (value) => {
      if (value === null || value === undefined) {
        return '';
      }

      const stringValue = String(value);

      // If value contains comma, newline, or quotes, wrap in quotes and escape quotes
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    };

    // Build CSV content
    const csvRows = [];

    // Add header row
    csvRows.push(csvHeaders.map(escapeCSVValue).join(','));

    // Add data rows
    data.forEach(row => {
      const values = keys.map(key => {
        const value = row[key];
        return escapeCSVValue(value);
      });
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      // Create download link
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);
    }

    return { success: true, message: 'CSV exported successfully' };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error(`Failed to export CSV: ${error.message}`);
  }
}

/**
 * Export comprehensive project report with tasks and materials
 * @param {Object} project - Project object
 * @param {Array<Object>} tasks - Array of tasks
 * @param {Array<Object>} materials - Array of materials
 * @param {string} format - Export format: 'pdf' or 'csv' (default: 'pdf')
 * @returns {Promise<void>}
 * @throws {Error} If export fails
 */
export async function exportProjectReport(project, tasks, materials, format = 'pdf') {
  try {
    if (!project) {
      throw new Error('Project data is required');
    }

    const filename = `project-report-${project.id}-${Date.now()}`;

    if (format === 'pdf') {
      // For PDF, we need to create a temporary DOM element with the report
      const reportElement = createProjectReportElement(project, tasks, materials);
      document.body.appendChild(reportElement);

      try {
        await exportToPDF(reportElement.id, filename, {
          orientation: 'portrait',
          format: 'a4',
        });
      } finally {
        // Clean up temporary element
        document.body.removeChild(reportElement);
      }
    } else if (format === 'csv') {
      // Export project summary
      const projectData = [{
        project_id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date,
        branch: project.branch_name || '',
        total_tasks: tasks?.length || 0,
        completed_tasks: tasks?.filter(t => t.status === 'completed').length || 0,
        total_materials: materials?.length || 0,
      }];

      exportToCSV(projectData, `${filename}-summary`);

      // Export tasks if available
      if (tasks && tasks.length > 0) {
        exportTasksToCSV(tasks, `${filename}-tasks`);
      }

      // Export materials if available
      if (materials && materials.length > 0) {
        exportMaterialsToCSV(materials, `${filename}-materials`);
      }
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    return { success: true, message: `Project report exported as ${format.toUpperCase()}` };
  } catch (error) {
    console.error('Error exporting project report:', error);
    throw new Error(`Failed to export project report: ${error.message}`);
  }
}

/**
 * Create a temporary DOM element for PDF export
 * @private
 * @param {Object} project - Project object
 * @param {Array<Object>} tasks - Array of tasks
 * @param {Array<Object>} materials - Array of materials
 * @returns {HTMLElement} - DOM element
 */
function createProjectReportElement(project, tasks, materials) {
  const element = document.createElement('div');
  element.id = `temp-report-${Date.now()}`;
  element.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 800px;
    background: white;
    padding: 40px;
    font-family: Arial, sans-serif;
  `;

  // Build HTML content
  let html = `
    <div style="margin-bottom: 30px;">
      <h1 style="font-size: 24px; margin-bottom: 10px; color: #333;">${project.name}</h1>
      <p style="color: #666; margin-bottom: 20px;">${project.description || ''}</p>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
        <div>
          <strong>Status:</strong> ${project.status || 'N/A'}
        </div>
        <div>
          <strong>Branch:</strong> ${project.branch_name || 'N/A'}
        </div>
        <div>
          <strong>Start Date:</strong> ${formatDate(project.start_date)}
        </div>
        <div>
          <strong>End Date:</strong> ${formatDate(project.end_date)}
        </div>
      </div>
    </div>
  `;

  // Add tasks section
  if (tasks && tasks.length > 0) {
    html += `
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; margin-bottom: 15px; color: #333; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
          Tasks (${tasks.length})
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Task Name</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Status</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Assignee</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(task => `
              <tr>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${task.title || task.name || 'Untitled'}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${task.status || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${task.assignee_name || 'Unassigned'}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${formatDate(task.due_date)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Add materials section
  if (materials && materials.length > 0) {
    html += `
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; margin-bottom: 15px; color: #333; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
          Materials (${materials.length})
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Material Name</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Quantity</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Unit</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Cost</th>
            </tr>
          </thead>
          <tbody>
            ${materials.map(material => `
              <tr>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${material.name || 'Unnamed'}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${material.quantity || 0}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${material.unit || 'N/A'}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(material.cost)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Add footer
  html += `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 10px;">
      <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
  `;

  element.innerHTML = html;
  return element;
}

/**
 * Export tasks list to CSV
 * @param {Array<Object>} tasks - Array of tasks
 * @param {string} filename - Optional custom filename
 * @returns {void}
 * @throws {Error} If export fails
 */
export function exportTasksToCSV(tasks, filename = null) {
  try {
    if (!tasks || tasks.length === 0) {
      throw new Error('No tasks to export');
    }

    const defaultFilename = `tasks-export-${Date.now()}`;
    const headers = [
      { key: 'id', label: 'Task ID' },
      { key: 'title', label: 'Task Name' },
      { key: 'description', label: 'Description' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'assignee_name', label: 'Assignee' },
      { key: 'project_name', label: 'Project' },
      { key: 'start_date', label: 'Start Date' },
      { key: 'due_date', label: 'Due Date' },
      { key: 'completed_at', label: 'Completed At' },
      { key: 'estimated_hours', label: 'Estimated Hours' },
      { key: 'actual_hours', label: 'Actual Hours' },
    ];

    // Format tasks data
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title || task.name || '',
      description: task.description || '',
      status: task.status || '',
      priority: task.priority || '',
      assignee_name: task.assignee_name || 'Unassigned',
      project_name: task.project_name || '',
      start_date: task.start_date || '',
      due_date: task.due_date || '',
      completed_at: task.completed_at || '',
      estimated_hours: task.estimated_hours || '',
      actual_hours: task.actual_hours || '',
    }));

    return exportToCSV(formattedTasks, filename || defaultFilename, headers);
  } catch (error) {
    console.error('Error exporting tasks to CSV:', error);
    throw new Error(`Failed to export tasks: ${error.message}`);
  }
}

/**
 * Export materials list to CSV
 * @param {Array<Object>} materials - Array of materials
 * @param {string} filename - Optional custom filename
 * @returns {void}
 * @throws {Error} If export fails
 */
export function exportMaterialsToCSV(materials, filename = null) {
  try {
    if (!materials || materials.length === 0) {
      throw new Error('No materials to export');
    }

    const defaultFilename = `materials-export-${Date.now()}`;
    const headers = [
      { key: 'id', label: 'Material ID' },
      { key: 'name', label: 'Material Name' },
      { key: 'description', label: 'Description' },
      { key: 'category', label: 'Category' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'unit', label: 'Unit' },
      { key: 'cost', label: 'Unit Cost' },
      { key: 'total_cost', label: 'Total Cost' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'project_name', label: 'Project' },
      { key: 'status', label: 'Status' },
    ];

    // Format materials data
    const formattedMaterials = materials.map(material => ({
      id: material.id,
      name: material.name || '',
      description: material.description || '',
      category: material.category || '',
      quantity: material.quantity || 0,
      unit: material.unit || '',
      cost: material.cost || 0,
      total_cost: (material.quantity || 0) * (material.cost || 0),
      supplier: material.supplier || '',
      project_name: material.project_name || '',
      status: material.status || '',
    }));

    return exportToCSV(formattedMaterials, filename || defaultFilename, headers);
  } catch (error) {
    console.error('Error exporting materials to CSV:', error);
    throw new Error(`Failed to export materials: ${error.message}`);
  }
}

/**
 * Helper function to format dates
 * @private
 * @param {string} date - Date string
 * @returns {string} Formatted date or 'N/A'
 */
function formatDate(date) {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return date;
  }
}

/**
 * Helper function to format currency
 * @private
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0.00';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

/**
 * Export utility with loading state management
 * Wraps export functions with consistent error handling and user feedback
 * @param {Function} exportFn - Export function to execute
 * @param {Function} setLoading - State setter for loading indicator
 * @param {Function} showToast - Toast notification function
 * @returns {Promise<void>}
 */
export async function exportWithLoading(exportFn, setLoading, showToast) {
  try {
    if (setLoading) setLoading(true);

    const result = await exportFn();

    if (showToast) {
      showToast({
        title: 'Export Successful',
        description: result?.message || 'File exported successfully',
        variant: 'success',
      });
    }
  } catch (error) {
    console.error('Export error:', error);

    if (showToast) {
      showToast({
        title: 'Export Failed',
        description: error.message || 'Failed to export file',
        variant: 'destructive',
      });
    }

    throw error;
  } finally {
    if (setLoading) setLoading(false);
  }
}

/**
 * Batch export multiple reports
 * @param {Array<Object>} exportJobs - Array of export job configurations
 * @param {Function} exportJobs[].exportFn - Export function to execute
 * @param {string} exportJobs[].name - Name of the export job
 * @returns {Promise<Array>} Array of results
 */
export async function batchExport(exportJobs) {
  const results = [];

  for (const job of exportJobs) {
    try {
      const result = await job.exportFn();
      results.push({
        name: job.name,
        success: true,
        result,
      });
    } catch (error) {
      console.error(`Batch export failed for ${job.name}:`, error);
      results.push({
        name: job.name,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}
