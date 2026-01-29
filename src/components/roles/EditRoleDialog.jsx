/**
 * Edit Role Dialog
 * Edit existing roles (system roles have restricted fields)
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle } from 'lucide-react';
import { useUpdateRole } from '@/hooks/useRoles';

export function EditRoleDialog({ role, open, onOpenChange }) {
  const updateRole = useUpdateRole();

  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (role && open) {
      setFormData({
        name: role.name || '',
        level: role.level || 50,
        description: role.description || '',
        permissions: role.permissions || {
          workforce: false,
          docks: false,
          projects: false,
          tickets: false,
        },
      });
      setErrors({});
    }
  }, [role, open]);

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
      await updateRole.mutateAsync({ roleId: role.id, updates: formData });
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

  const isSystemRole = role?.is_system_role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <div>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Update role settings and permissions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {isSystemRole && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This is a system role. Name and level cannot be changed, but you can update
                permissions and description.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              Role Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSystemRole}
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
              value={formData.level || 50}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 50 })}
              disabled={isSystemRole}
              className={errors.level ? 'border-destructive' : ''}
            />
            {errors.level && (
              <p className="text-sm text-destructive">{errors.level}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
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
                    checked={formData.permissions?.[key] || false}
                    onCheckedChange={() => togglePermission(key)}
                  />
                  <Label htmlFor={`perm-${key}`} className="font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {role?.user_count > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>{role.user_count}</strong> user{role.user_count !== 1 ? 's are' : ' is'} currently
                assigned to this role. Changes will affect their permissions immediately.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateRole.isPending}>
            {updateRole.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
