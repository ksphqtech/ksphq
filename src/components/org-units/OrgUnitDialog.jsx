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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useCreateOrgUnit, useUpdateOrgUnit, useOrgUnits } from '@/hooks/useOrgUnits';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

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
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    type: '',
    name: '',
    code: '',
    parent_id: '',
    manager_id: '',
    is_multi_branch: false,
    is_active: true,
    metadata: {
      contact_email: '',
      contact_phone: '',
      notes: '',
    },
  });
  const [errors, setErrors] = useState({});

  const allUnits = allUnitsData?.units || [];

  // Fetch eligible managers (users with role_level >= 40)
  const { data: usersData } = useQuery({
    queryKey: ['users', 'managers'],
    queryFn: async () => {
      const response = await get('/api/users?limit=1000');
      return response.data;
    },
    enabled: !!open && (formData.type === 'branch' || formData.type === 'department'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // Don't retry on auth errors
  });

  const eligibleManagers =
    usersData?.users?.filter((u) => u.role_level >= 40 && u.is_active) || [];

  // Find selected manager info
  const selectedManager = eligibleManagers.find((u) => u.id === formData.manager_id);

  // Check if user can create multi-branch departments
  const canCreateMultiBranch = currentUser?.role_level >= 80;

  // Get potential parent units based on type
  const getPotentialParents = () => {
    if (!formData.type) return [];

    // Branches can have no parent or other branches as parent
    if (formData.type === 'branch') {
      return allUnits.filter((u) => u.type === 'branch' && u.id !== unit?.id);
    }
    // Departments can be under branches (if not multi-branch)
    if (formData.type === 'department') {
      if (formData.is_multi_branch) {
        // Multi-branch departments don't need a parent
        return [];
      }
      return allUnits.filter((u) => u.type === 'branch');
    }
    // Teams can be under departments
    if (formData.type === 'team') {
      return allUnits.filter((u) => u.type === 'department');
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
          manager_id: unit.manager_id || '',
          is_multi_branch: unit.is_multi_branch || false,
          is_active: unit.is_active !== false,
          metadata: {
            contact_email: unit.metadata?.contact_email || '',
            contact_phone: unit.metadata?.contact_phone || '',
            notes: unit.metadata?.notes || '',
          },
        });
      } else if (unit?.type) {
        // Creating new unit with pre-set type
        setFormData({
          type: unit.type,
          name: '',
          code: '',
          parent_id: '',
          manager_id: '',
          is_multi_branch: false,
          is_active: true,
          metadata: {
            contact_email: '',
            contact_phone: '',
            notes: '',
          },
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

    // Validate email if provided and no manager
    if (
      formData.type === 'department' &&
      !formData.manager_id &&
      formData.metadata.contact_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.metadata.contact_email)
    ) {
      newErrors.contact_email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const submitData = {
        type: formData.type,
        name: formData.name,
        code: formData.code || null,
        parent_id: formData.parent_id || null,
        manager_id: formData.manager_id || null,
      };

      // Add is_multi_branch for departments
      if (formData.type === 'department') {
        submitData.is_multi_branch = formData.is_multi_branch;
      }

      // Add metadata
      submitData.metadata = {
        notes: formData.metadata.notes || null,
      };

      // Only add contact fields if no manager is set for departments
      if (formData.type === 'department' && !formData.manager_id) {
        submitData.metadata.contact_email = formData.metadata.contact_email || null;
        submitData.metadata.contact_phone = formData.metadata.contact_phone || null;
      }

      if (isEditMode) {
        await updateOrgUnit.mutateAsync({
          unitId: unit.id,
          updates: {
            ...submitData,
            is_active: formData.is_active,
          },
        });
      } else {
        await createOrgUnit.mutateAsync(submitData);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleMetadataChange = (field, value) => {
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        [field]: value,
      },
    });
  };

  const showManagerSelection = formData.type === 'branch' || formData.type === 'department';
  const showMultiBranch = formData.type === 'department' && canCreateMultiBranch;
  const showDepartmentContact = formData.type === 'department';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? `Edit ${TYPE_LABELS[formData.type]}`
              : `Create ${TYPE_LABELS[formData.type]}`}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the organizational unit details'
              : `Add a new ${formData.type} to your organizational structure`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder={`e.g., ${
                formData.type === 'branch'
                  ? 'Headquarters'
                  : formData.type === 'department'
                  ? 'IT Department'
                  : 'Day Shift'
              }`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Code (Optional)</Label>
            <Input
              id="code"
              placeholder="e.g., HQ, IT, DAY"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">Short identifier for reports and displays</p>
          </div>

          {/* Manager/Department Head Selection */}
          {showManagerSelection && (
            <div className="space-y-2">
              <Label htmlFor="manager_id">
                {formData.type === 'branch' ? 'Branch Manager' : 'Department Head'}
              </Label>
              <Select
                value={formData.manager_id || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, manager_id: value === 'none' ? '' : value })
                }
              >
                <SelectTrigger id="manager_id">
                  <SelectValue placeholder="Select a manager (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {eligibleManagers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} - {user.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Assign a user as the {formData.type === 'branch' ? 'branch manager' : 'department head'}{' '}
                (role level 40+)
              </p>
            </div>
          )}

          {/* Multi-Branch Checkbox (Departments only, admins/branch admins only) */}
          {showMultiBranch && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_multi_branch"
                checked={formData.is_multi_branch}
                onCheckedChange={(checked) => {
                  setFormData({
                    ...formData,
                    is_multi_branch: checked,
                    // Clear parent if making multi-branch
                    parent_id: checked ? '' : formData.parent_id,
                  });
                }}
              />
              <Label htmlFor="is_multi_branch" className="cursor-pointer">
                Organization-wide department (not branch-specific)
              </Label>
            </div>
          )}

          {/* Parent Selection */}
          {potentialParents.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parent_id">
                Parent {TYPE_LABELS[potentialParents[0]?.type]}{' '}
                {formData.type === 'department' && !formData.is_multi_branch && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
              <Select
                value={formData.parent_id || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, parent_id: value === 'none' ? '' : value })
                }
              >
                <SelectTrigger id="parent_id">
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {potentialParents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.type === 'department' && !formData.is_multi_branch
                  ? 'Required: Assign to a parent branch'
                  : `Optional: Assign to a parent ${potentialParents[0]?.type}`}
              </p>
            </div>
          )}

          {/* Department Contact Info - Dynamic based on manager */}
          {showDepartmentContact && (
            <>
              {formData.manager_id && selectedManager ? (
                <div className="bg-muted p-3 rounded-md space-y-1">
                  <Label className="text-sm">Department Contact (from Department Head)</Label>
                  <p className="text-sm font-medium">
                    {selectedManager.first_name} {selectedManager.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedManager.email}</p>
                  {selectedManager.phone_number && (
                    <p className="text-sm text-muted-foreground">{selectedManager.phone_number}</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.metadata.contact_email}
                      onChange={(e) => handleMetadataChange('contact_email', e.target.value)}
                      placeholder="department@company.com"
                      className={errors.contact_email ? 'border-destructive' : ''}
                    />
                    {errors.contact_email && (
                      <p className="text-sm text-destructive">{errors.contact_email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={formData.metadata.contact_phone}
                      onChange={(e) => handleMetadataChange('contact_phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.metadata.notes}
              onChange={(e) => handleMetadataChange('notes', e.target.value)}
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          {/* Active Status */}
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
