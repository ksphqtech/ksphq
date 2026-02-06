/**
 * Create Project Dialog
 * Form for creating new projects with validation
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useCreateProject } from '@/hooks/useProjects';
import { useOrgUnits } from '@/hooks/useOrgUnits';
import { useUsers } from '@/hooks/useUsers';
import { PROJECT_STATUSES, PRIORITIES, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/projectConstants';

export function CreateProjectDialog({ open, onOpenChange }) {
  const createProject = useCreateProject();
  const { data: orgUnitsData } = useOrgUnits();
  const { data: usersData } = useUsers();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    end_date: '',
    project_manager_id: '',
    branch_id: '',
  });
  const [errors, setErrors] = useState({});

  // Extract org units and users
  const units = Array.isArray(orgUnitsData?.organizational_units) ? orgUnitsData.organizational_units : [];
  const branches = units.filter(u => u.type === 'branch');
  const managers = usersData?.users?.filter(u => u.is_active) || [];

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        start_date: '',
        end_date: '',
        project_manager_id: '',
        branch_id: '',
      });
      setErrors({});
    }
  }, [open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.project_manager_id) {
      newErrors.project_manager_id = 'Project manager is required';
    }

    // Validate dates if both are provided
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate < startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Send required and optional fields
      const projectData = {
        name: formData.name.trim(),
        project_manager_id: formData.project_manager_id,
        status: formData.status,
        priority: formData.priority,
      };

      if (formData.description?.trim()) {
        projectData.description = formData.description.trim();
      }
      if (formData.start_date) {
        projectData.start_date = formData.start_date;
      }
      if (formData.end_date) {
        projectData.end_date = formData.end_date;
      }
      if (formData.branch_id) {
        projectData.branch_id = formData.branch_id;
      }

      await createProject.mutateAsync(projectData);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter project name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Project description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Project Manager */}
          <div className="space-y-2">
            <Label htmlFor="project_manager_id">
              Project Manager <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.project_manager_id}
              onValueChange={(value) => setFormData({ ...formData, project_manager_id: value })}
            >
              <SelectTrigger id="project_manager_id" className={errors.project_manager_id ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select project manager" />
              </SelectTrigger>
              <SelectContent>
                {usersData?.users?.filter(u => u.is_active).map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.project_manager_id && (
              <p className="text-sm text-destructive">{errors.project_manager_id}</p>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {PRIORITY_LABELS[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className={errors.end_date ? 'border-destructive' : ''}
              />
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <Label htmlFor="branch_id">Branch</Label>
            <Select
              value={formData.branch_id}
              onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
            >
              <SelectTrigger id="branch_id">
                <SelectValue placeholder="Select branch (optional)" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
                {branches.length === 0 && (
                  <SelectItem value="none" disabled>
                    No branches available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Fields marked with <span className="text-destructive">*</span> are required.
              All other fields are optional and can be set later.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createProject.isPending}
          >
            {createProject.isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
