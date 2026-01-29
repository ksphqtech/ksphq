/**
 * Create Role Dialog
 * Create new custom roles with permissions
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useCreateRole } from '@/hooks/useRoles';

export function CreateRoleDialog({ open, onOpenChange }) {
  const createRole = useCreateRole();

  const [formData, setFormData] = useState({
    name: '',
    level: 50,
    description: '',
    permissions: {
      workforce: false,
      docks: false,
      projects: false,
      tickets: false,
      user_management: 'view_self',
    },
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        level: 50,
        description: '',
        permissions: {
          workforce: false,
          docks: false,
          projects: false,
          tickets: false,
          user_management: 'view_self',
        },
      });
      setErrors({});
    }
  }, [open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Role name is required';
    }
    if (formData.level < 1 || formData.level > 100) {
      newErrors.level = 'Level must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await createRole.mutateAsync(formData);
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const togglePermission = (key) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: !formData.permissions[key],
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Define a custom role with specific permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Role Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Project Manager"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">
              Hierarchy Level <span className="text-destructive">*</span>
            </Label>
            <Input
              id="level"
              type="number"
              min="1"
              max="100"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 50 })}
              className={errors.level ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">
              1-100: Higher numbers = more privileged (Admin: 100, Employee: 10)
            </p>
            {errors.level && (
              <p className="text-sm text-destructive">{errors.level}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this role"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label>Tool Permissions</Label>
            <div className="space-y-2">
              {[
                { key: 'workforce', label: 'Workforce Management' },
                { key: 'docks', label: 'Docks & Loading' },
                { key: 'projects', label: 'Project Management' },
                { key: 'tickets', label: 'Ticketing System' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`perm-${key}`}
                    checked={formData.permissions[key]}
                    onCheckedChange={() => togglePermission(key)}
                  />
                  <Label htmlFor={`perm-${key}`} className="font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              User management permissions are set separately. By default, new roles can only view their own profile.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createRole.isPending}>
            {createRole.isPending ? 'Creating...' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
