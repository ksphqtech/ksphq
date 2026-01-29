/**
 * Organizational Unit Dialog
 * Create or edit organizational units (branches, departments, etc.)
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateOrgUnit, useUpdateOrgUnit, useOrgUnits } from '@/hooks/useOrgUnits';

const TYPE_LABELS = {
  branch: 'Branch',
  department: 'Department',
  shift: 'Shift',
  team: 'Team',
  group: 'Group',
};

export function OrgUnitDialog({ unit, open, onOpenChange }) {
  const isEditMode = unit?.id;
  const createOrgUnit = useCreateOrgUnit();
  const updateOrgUnit = useUpdateOrgUnit();
  const { data: allUnitsData } = useOrgUnits();

  const [formData, setFormData] = useState({
    type: '',
    name: '',
    code: '',
    parent_id: '',
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  const allUnits = allUnitsData?.units || [];

  // Get potential parent units based on type
  const getPotentialParents = () => {
    if (!formData.type) return [];

    // Branches can have no parent or other branches as parent
    if (formData.type === 'branch') {
      return allUnits.filter(u => u.type === 'branch' && u.id !== unit?.id);
    }
    // Departments can be under branches
    if (formData.type === 'department') {
      return allUnits.filter(u => u.type === 'branch');
    }
    // Teams can be under departments
    if (formData.type === 'team') {
      return allUnits.filter(u => u.type === 'department');
    }
    // Shifts and groups typically don't have parents
    return [];
  };

  const potentialParents = getPotentialParents();

  useEffect(() => {
    if (open) {
      if (isEditMode) {
        setFormData({
          type: unit.type || '',
          name: unit.name || '',
          code: unit.code || '',
          parent_id: unit.parent_id || '',
          is_active: unit.is_active !== false,
        });
      } else if (unit?.type) {
        // Creating new unit with pre-set type
        setFormData({
          type: unit.type,
          name: '',
          code: '',
          parent_id: '',
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [unit, open, isEditMode]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isEditMode) {
        await updateOrgUnit.mutateAsync({
          unitId: unit.id,
          updates: {
            name: formData.name,
            code: formData.code || null,
            parent_id: formData.parent_id || null,
            is_active: formData.is_active,
          },
        });
      } else {
        await createOrgUnit.mutateAsync({
          type: formData.type,
          name: formData.name,
          code: formData.code || null,
          parent_id: formData.parent_id || null,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Edit ${TYPE_LABELS[formData.type]}` : `Create ${TYPE_LABELS[formData.type]}`}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the organizational unit details'
              : `Add a new ${formData.type} to your organizational structure`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder={`e.g., ${formData.type === 'branch' ? 'Headquarters' : formData.type === 'department' ? 'IT Department' : 'Day Shift'}`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code (Optional)</Label>
            <Input
              id="code"
              placeholder="e.g., HQ, IT, DAY"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              Short identifier for reports and displays
            </p>
          </div>

          {potentialParents.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parent_id">Parent {TYPE_LABELS[potentialParents[0]?.type]}</Label>
              <Select
                value={formData.parent_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger id="parent_id">
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {potentialParents.map(parent => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optional: Assign to a parent {potentialParents[0]?.type}
              </p>
            </div>
          )}

          {isEditMode && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive units are hidden from selection
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createOrgUnit.isPending || updateOrgUnit.isPending}
          >
            {createOrgUnit.isPending || updateOrgUnit.isPending
              ? 'Saving...'
              : isEditMode
              ? 'Save Changes'
              : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
