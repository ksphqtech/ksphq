import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getProjects,
  saveProject,
  updateProject,
  deleteProject
} from '@/lib/workforceData';
import { getClients } from '@/lib/workforceData';

export function ProjectManagement() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    clientId: '',
    status: 'active',
    startDate: '',
    endDate: '',
    description: ''
  });

  useEffect(() => {
    loadProjects();
    setClients(getClients());
  }, []);

  const loadProjects = () => {
    setProjects(getProjects());
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown';
  };

  const handleAdd = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      code: '',
      clientId: '',
      status: 'active',
      startDate: '',
      endDate: '',
      description: ''
    });
    setShowDialog(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      code: project.code,
      clientId: project.clientId,
      status: project.status,
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      description: project.description || ''
    });
    setShowDialog(true);
  };

  const handleDelete = (project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      deleteProject(project.id);
      loadProjects();
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.code || !formData.clientId) {
      alert('Name, Code, and Client are required');
      return;
    }

    const dataToSave = {
      ...formData,
      // Convert empty dates to null
      startDate: formData.startDate || null,
      endDate: formData.endDate || null
    };

    if (editingProject) {
      updateProject(editingProject.id, dataToSave);
    } else {
      saveProject(dataToSave);
    }

    loadProjects();
    setShowDialog(false);
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return 'Ongoing';
    if (!endDate) return `${startDate} - Ongoing`;
    return `${startDate} - ${endDate}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Projects</h3>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No projects found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              projects.map(project => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{project.code}</Badge>
                  </TableCell>
                  <TableCell>{getClientName(project.clientId)}</TableCell>
                  <TableCell>
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateRange(project.startDate, project.endDate)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(project)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(project)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Edit Project' : 'Add Project'}
            </DialogTitle>
            <DialogDescription>
              {editingProject
                ? 'Update project information.'
                : 'Add a new project to the system.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Project name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                placeholder="PROJ_CODE"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => handleFieldChange('clientId', value)}
              >
                <SelectTrigger id="clientId">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleFieldChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleFieldChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Project description..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="status">Active</Label>
              <Switch
                id="status"
                checked={formData.status === 'active'}
                onCheckedChange={(checked) =>
                  handleFieldChange('status', checked ? 'active' : 'inactive')
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingProject ? 'Save Changes' : 'Add Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
