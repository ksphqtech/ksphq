/**
 * Edit User Dialog
 * Tabbed form for editing existing users
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PersonalInfoFields, WorkDetailsFields, AccountSettingsFields } from './UserFormFields';
import { useUpdateUser, useUser, useUsers } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { useOrgUnits } from '@/hooks/useOrgUnits';

export function EditUserDialog({ user, open, onOpenChange }) {
  const updateUserMutation = useUpdateUser();
  const { data: rolesData } = useRoles();
  const { data: orgUnitsData } = useOrgUnits();
  const { data: usersData } = useUsers();

  // Fetch full user details when dialog opens
  const { data: fullUserData, isLoading: isLoadingUser } = useUser(user?.id);
  const fullUser = fullUserData?.user;

  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // Extract org units by type
  const branches = orgUnitsData?.units?.filter(u => u.type === 'branch') || [];
  const departments = orgUnitsData?.units?.filter(u => u.type === 'department') || [];
  const shifts = orgUnitsData?.units?.filter(u => u.type === 'shift') || [];
  const teams = orgUnitsData?.units?.filter(u => u.type === 'team') || [];
  const groups = orgUnitsData?.units?.filter(u => u.type === 'group') || [];
  const roles = rolesData?.roles || [];
  const users = usersData?.users || [];

  // Initialize form data when full user details are loaded
  useEffect(() => {
    if (fullUser && open) {
      setFormData({
        id: fullUser.id,
        first_name: fullUser.first_name || '',
        last_name: fullUser.last_name || '',
        email: fullUser.email || '',
        phone_number: fullUser.phone_number || '',
        employee_id: fullUser.employee_id || '',
        title: fullUser.title || '',
        role_id: fullUser.role_id || '',
        branch_id: fullUser.branch_id || '',
        department_id: fullUser.department_id || '',
        shift_id: fullUser.shift_id || '',
        team_id: fullUser.team_id || '',
        group_id: fullUser.group_id || '',
        manager_id: fullUser.manager_id || '',
        is_active: fullUser.is_active !== false,
        idle_timeout_minutes: fullUser.idle_timeout_minutes || 60,
        account_expires_at: fullUser.account_expires_at || '',
      });
      setErrors({});
      setActiveTab('personal');
    }
  }, [fullUser, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.phone_number && !/^[\d\s\-\+\(\)]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Invalid phone number format';
    }
    if (!formData.role_id) {
      newErrors.role_id = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      if (errors.first_name || errors.last_name || errors.email || errors.phone_number) {
        setActiveTab('personal');
      } else if (errors.role_id) {
        setActiveTab('account');
      }
      return;
    }

    // Only send changed fields
    const updates = {};
    const originalUser = fullUser || user;

    Object.keys(formData).forEach(key => {
      if (key === 'id') return; // Don't send ID

      // Handle null vs empty string comparisons
      const formValue = formData[key] === '' ? null : formData[key];
      const originalValue = originalUser[key] === '' ? null : originalUser[key];

      if (formValue !== originalValue) {
        updates[key] = formData[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      onOpenChange(false);
      return;
    }

    try {
      await updateUserMutation.mutateAsync({ userId: user.id, updates });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || 'U';
  };

  // Show loading state while fetching full user details
  if (open && isLoadingUser) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-3 text-muted-foreground">Loading user details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {getInitials(fullUser?.first_name || user?.first_name, fullUser?.last_name || user?.last_name, fullUser?.email || user?.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and settings
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">
              Personal Info
              {(errors.first_name || errors.last_name || errors.email || errors.phone_number) && (
                <span className="ml-1 text-destructive">*</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="work">Work Details</TabsTrigger>
            <TabsTrigger value="account">
              Account Settings
              {errors.role_id && <span className="ml-1 text-destructive">*</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-4">
            <PersonalInfoFields
              formData={formData}
              setFormData={setFormData}
              errors={errors}
            />
          </TabsContent>

          <TabsContent value="work" className="space-y-4 mt-4">
            <WorkDetailsFields
              formData={formData}
              setFormData={setFormData}
              roles={roles}
              branches={branches}
              departments={departments}
              shifts={shifts}
              teams={teams}
              groups={groups}
              users={users}
              errors={errors}
            />
          </TabsContent>

          <TabsContent value="account" className="space-y-4 mt-4">
            <AccountSettingsFields
              formData={formData}
              setFormData={setFormData}
              roles={roles}
              errors={errors}
              showPasswordOptions={false}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateUserMutation.isPending}>
            {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
