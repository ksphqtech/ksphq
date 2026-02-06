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
import {
  validateProjectName,
  validateDescription,
  validateBudgetAmount,
  validatePercentage,
  validateDateRange,
  sanitizeTextInput,
  FIELD_CONSTRAINTS,
} from '@/lib/validation/projectValidation';

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
    budget_amount: '',
    actual_cost: '',
    completion_percentage: 0,
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
        budget_amount: '',
        actual_cost: '',
        completion_percentage: 0,
      });
      setErrors({});
    }
  }, [open]);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    const nameError = validateProjectName(formData.name);
    if (nameError) newErrors.name = nameError;

    // Description validation
    const descError = validateDescription(formData.description);
    if (descError) newErrors.description = descError;

    // Project manager validation
    if (!formData.project_manager_id) {
      newErrors.project_manager_id = 'Project manager is required';
    }

    // Budget validation
    const budgetError = validateBudgetAmount(formData.budget_amount);
    if (budgetError) newErrors.budget_amount = budgetError;

    const costError = validateBudgetAmount(formData.actual_cost);
    if (costError) newErrors.actual_cost = costError;

    // Completion percentage validation
    const completionError = validatePercentage(formData.completion_percentage);
    if (completionError) newErrors.completion_percentage = completionError;

    // Date range validation
    const dateRangeError = validateDateRange(formData.start_date, formData.end_date);
    if (dateRangeError) newErrors.end_date = dateRangeError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Sanitize and prepare data
      const projectData = {
        name: sanitizeTextInput(formData.name),
        project_manager_id: formData.project_manager_id,
        status: formData.status,
        priority: formData.priority,
        completion_percentage: parseInt(formData.completion_percentage) || 0,
      };

      if (formData.description?.trim()) {
        projectData.description = sanitizeTextInput(formData.description);
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
      if (formData.budget_amount) {
        projectData.budget_amount = parseFloat(formData.budget_amount);
      }
      if (formData.actual_cost) {
        projectData.actual_cost = parseFloat(formData.actual_cost);
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
              onBlur={(e) => {
                // Validate on blur
                const error = validateDescription(e.target.value);
                if (error) {
                  setErrors({ ...errors, description: error });
                } else {
                  const newErrors = { ...errors };
                  delete newErrors.description;
                  setErrors(newErrors);
                }
              }}
              rows={3}
              maxLength={FIELD_CONSTRAINTS.DESCRIPTION_MAX_LENGTH}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/{FIELD_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters
            </p>
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

          {/* Budget and Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget_amount">Budget Amount</Label>
              <Input
                id="budget_amount"
                type="number"
                step="0.01"
                min="0"
                max={FIELD_CONSTRAINTS.BUDGET_MAX}
                placeholder="0.00"
                value={formData.budget_amount}
                onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                onBlur={(e) => {
                  const error = validateBudgetAmount(e.target.value);
                  if (error) {
                    setErrors({ ...errors, budget_amount: error });
                  } else {
                    const newErrors = { ...errors };
                    delete newErrors.budget_amount;
                    setErrors(newErrors);
                  }
                }}
                className={errors.budget_amount ? 'border-destructive' : ''}
              />
              {errors.budget_amount && (
                <p className="text-sm text-destructive">{errors.budget_amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="completion_percentage">Completion %</Label>
              <Input
                id="completion_percentage"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={formData.completion_percentage}
                onChange={(e) => setFormData({ ...formData, completion_percentage: e.target.value })}
                onBlur={(e) => {
                  const error = validatePercentage(e.target.value);
                  if (error) {
                    setErrors({ ...errors, completion_percentage: error });
                  } else {
                    const newErrors = { ...errors };
                    delete newErrors.completion_percentage;
                    setErrors(newErrors);
                  }
                }}
                className={errors.completion_percentage ? 'border-destructive' : ''}
              />
              {errors.completion_percentage && (
                <p className="text-sm text-destructive">{errors.completion_percentage}</p>
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
