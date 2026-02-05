# Report Exporter Utilities

Comprehensive export utilities for generating PDF and CSV reports from project data, tasks, and materials.

## Installation

First, install the required dependencies:

```bash
npm install jspdf html2canvas
```

These dependencies are already added to `package.json`. Run the install command to download them.

## Features

- Export DOM elements to PDF files
- Export data arrays to CSV files
- Generate comprehensive project reports (PDF or CSV)
- Export tasks and materials lists
- Loading state management
- Error handling with user feedback
- Batch export capabilities

## Usage

### 1. Export DOM Element to PDF

Export any visible DOM element (like a report, dashboard, or chart) to a PDF file:

```javascript
import { exportToPDF } from '@/lib/reportExporter';

// In your component
const handleExportPDF = async () => {
  try {
    await exportToPDF('report-container', 'my-report', {
      orientation: 'portrait', // or 'landscape'
      format: 'a4', // or 'letter', 'legal', etc.
    });
    console.log('PDF exported successfully!');
  } catch (error) {
    console.error('Failed to export PDF:', error);
  }
};

// In your JSX
<div id="report-container">
  {/* Your report content */}
</div>
<button onClick={handleExportPDF}>Export as PDF</button>
```

### 2. Export Data to CSV

Export any array of objects to a CSV file:

```javascript
import { exportToCSV } from '@/lib/reportExporter';

const data = [
  { id: 1, name: 'Task 1', status: 'completed' },
  { id: 2, name: 'Task 2', status: 'in_progress' },
];

const headers = [
  { key: 'id', label: 'Task ID' },
  { key: 'name', label: 'Task Name' },
  { key: 'status', label: 'Status' },
];

exportToCSV(data, 'tasks-export', headers);
```

### 3. Export Comprehensive Project Report

Export a complete project report including project details, tasks, and materials:

```javascript
import { exportProjectReport } from '@/lib/reportExporter';

const handleExportProject = async () => {
  try {
    // Export as PDF (single file with all sections)
    await exportProjectReport(project, tasks, materials, 'pdf');

    // Or export as CSV (creates 3 files: summary, tasks, materials)
    // await exportProjectReport(project, tasks, materials, 'csv');

    console.log('Project report exported!');
  } catch (error) {
    console.error('Export failed:', error);
  }
};
```

### 4. Export Tasks List

Export a list of tasks to CSV:

```javascript
import { exportTasksToCSV } from '@/lib/reportExporter';

const tasks = [
  {
    id: '1',
    title: 'Design mockups',
    status: 'completed',
    assignee_name: 'John Doe',
    due_date: '2024-02-15',
    estimated_hours: 8,
  },
  // ... more tasks
];

exportTasksToCSV(tasks, 'project-tasks');
```

### 5. Export Materials List

Export a list of materials to CSV:

```javascript
import { exportMaterialsToCSV } from '@/lib/reportExporter';

const materials = [
  {
    id: '1',
    name: 'Concrete',
    quantity: 100,
    unit: 'cubic yards',
    cost: 120.5,
    supplier: 'ABC Supply Co',
  },
  // ... more materials
];

exportMaterialsToCSV(materials, 'project-materials');
```

### 6. Export with Loading State

Use the wrapper function to handle loading states and toast notifications:

```javascript
import { exportWithLoading } from '@/lib/reportExporter';
import { toast } from 'sonner';

function ReportButton({ project, tasks, materials }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    await exportWithLoading(
      () => exportProjectReport(project, tasks, materials, 'pdf'),
      setIsExporting,
      (toastConfig) => {
        if (toastConfig.variant === 'success') {
          toast.success(toastConfig.title, {
            description: toastConfig.description,
          });
        } else {
          toast.error(toastConfig.title, {
            description: toastConfig.description,
          });
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
```

### 7. Batch Export

Export multiple reports at once:

```javascript
import { batchExport } from '@/lib/reportExporter';

const handleBatchExport = async (projects) => {
  const exportJobs = projects.map((project) => ({
    name: project.name,
    exportFn: async () => {
      const tasks = await fetchTasks(project.id);
      const materials = await fetchMaterials(project.id);
      return exportProjectReport(project, tasks, materials, 'csv');
    },
  }));

  const results = await batchExport(exportJobs);

  const successful = results.filter((r) => r.success).length;
  console.log(`Exported ${successful} of ${results.length} projects`);
};
```

## API Reference

### exportToPDF(elementId, filename, options)

Exports a DOM element to a PDF file.

**Parameters:**
- `elementId` (string): ID of the DOM element to export
- `filename` (string): Name of the PDF file (without extension)
- `options` (object):
  - `orientation`: 'portrait' or 'landscape' (default: 'portrait')
  - `format`: 'a4', 'letter', 'legal', etc. (default: 'a4')
  - `quality`: JPEG quality 0-1 (default: 0.95)
  - `scale`: Canvas scale factor (default: 2)

**Returns:** Promise<{ success: boolean, message: string }>

**Throws:** Error if element not found or export fails

### exportToCSV(data, filename, headers)

Exports an array of objects to a CSV file.

**Parameters:**
- `data` (Array<Object>): Array of objects to export
- `filename` (string): Name of the CSV file (without extension)
- `headers` (Array<{ key: string, label: string }>): Optional custom headers

**Returns:** { success: boolean, message: string }

**Throws:** Error if data is empty or export fails

### exportProjectReport(project, tasks, materials, format)

Exports a comprehensive project report.

**Parameters:**
- `project` (Object): Project object
- `tasks` (Array<Object>): Array of tasks
- `materials` (Array<Object>): Array of materials
- `format` (string): 'pdf' or 'csv' (default: 'pdf')

**Returns:** Promise<{ success: boolean, message: string }>

**Throws:** Error if export fails

### exportTasksToCSV(tasks, filename)

Exports tasks to CSV with predefined columns.

**Parameters:**
- `tasks` (Array<Object>): Array of task objects
- `filename` (string): Optional custom filename

**Returns:** { success: boolean, message: string }

### exportMaterialsToCSV(materials, filename)

Exports materials to CSV with predefined columns.

**Parameters:**
- `materials` (Array<Object>): Array of material objects
- `filename` (string): Optional custom filename

**Returns:** { success: boolean, message: string }

### exportWithLoading(exportFn, setLoading, showToast)

Wrapper function that handles loading states and user feedback.

**Parameters:**
- `exportFn` (Function): Export function to execute
- `setLoading` (Function): State setter for loading indicator
- `showToast` (Function): Toast notification function

**Returns:** Promise<void>

### batchExport(exportJobs)

Executes multiple export jobs sequentially.

**Parameters:**
- `exportJobs` (Array<{ name: string, exportFn: Function }>): Array of export job configurations

**Returns:** Promise<Array<{ name: string, success: boolean, result?: any, error?: string }>>

## Complete React Component Example

```javascript
import React, { useState, useEffect } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportProjectReport, exportTasksToCSV, exportMaterialsToCSV } from '@/lib/reportExporter';
import { toast } from 'sonner';

export function ProjectExportButton({ projectId }) {
  const [isExporting, setIsExporting] = useState(false);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    // Fetch project data
    async function loadData() {
      try {
        const [projectData, tasksData, materialsData] = await Promise.all([
          fetch(`/api/projects/${projectId}`).then(r => r.json()),
          fetch(`/api/projects/${projectId}/tasks`).then(r => r.json()),
          fetch(`/api/projects/${projectId}/materials`).then(r => r.json()),
        ]);

        setProject(projectData);
        setTasks(tasksData);
        setMaterials(materialsData);
      } catch (error) {
        console.error('Failed to load project data:', error);
      }
    }

    loadData();
  }, [projectId]);

  const handleExport = async (format, type = 'full') => {
    setIsExporting(true);
    try {
      if (type === 'full') {
        await exportProjectReport(project, tasks, materials, format);
        toast.success('Export Successful', {
          description: `Project report exported as ${format.toUpperCase()}`,
        });
      } else if (type === 'tasks') {
        exportTasksToCSV(tasks);
        toast.success('Export Successful', {
          description: 'Tasks exported to CSV',
        });
      } else if (type === 'materials') {
        exportMaterialsToCSV(materials);
        toast.success('Export Successful', {
          description: 'Materials exported to CSV',
        });
      }
    } catch (error) {
      toast.error('Export Failed', {
        description: error.message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting || !project}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf', 'full')}>
          <FileText className="mr-2 h-4 w-4" />
          Full Report (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv', 'full')}>
          <Table className="mr-2 h-4 w-4" />
          Full Report (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv', 'tasks')}>
          <Table className="mr-2 h-4 w-4" />
          Tasks Only (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv', 'materials')}>
          <Table className="mr-2 h-4 w-4" />
          Materials Only (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Error Handling

All export functions include proper error handling:

- **Missing Dependencies**: If jspdf or html2canvas are not installed, a clear error message is shown
- **Missing Data**: If required data is missing or empty, an error is thrown
- **DOM Element Not Found**: If the specified element ID doesn't exist, an error is thrown
- **Export Failures**: Any failures during the export process are caught and reported

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires support for:
  - ES6+ features (async/await, Promises)
  - Blob API
  - Canvas API
  - Dynamic imports

## Performance Considerations

- **PDF Generation**: Large DOM elements may take a few seconds to render
- **CSV Export**: Handles large datasets efficiently (tested with 10,000+ rows)
- **Memory**: PDF generation uses canvas rendering, which can be memory-intensive for large pages
- **Batch Export**: Exports are processed sequentially to avoid memory issues

## Best Practices

1. **Loading States**: Always show loading indicators during export
2. **User Feedback**: Provide toast notifications for success/failure
3. **File Names**: Use descriptive filenames with timestamps
4. **Data Validation**: Validate data before exporting
5. **Error Messages**: Show clear, actionable error messages to users
6. **Mobile**: Consider disabling exports on mobile devices for better UX

## Troubleshooting

### PDF export is blank
- Ensure the element has content rendered
- Check if the element is visible (not `display: none`)
- Verify CSS styles are applied

### CSV file has encoding issues
- The exporter uses UTF-8 encoding by default
- Some Excel versions may require UTF-8 BOM for proper character display

### Export button is disabled
- Check if dependencies are installed
- Verify data is loaded (project, tasks, materials)
- Check browser console for errors

## License

Part of KSPHQ project - Internal use only
