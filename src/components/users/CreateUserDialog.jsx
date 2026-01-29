/**
 * Create User Dialog
 * Tabbed form for creating new users with Personal Info, Work Details, and Account Settings
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { PersonalInfoFields, WorkDetailsFields, AccountSettingsFields } from './UserFormFields';
import { useCreateUser, useUsers } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { useOrgUnits } from '@/hooks/useOrgUnits';
import { useToast } from '@/components/ui/use-toast';

export function CreateUserDialog({ open, onOpenChange }) {
  const { toast } = useToast();
  const createUser = useCreateUser();
  const { data: rolesData } = useRoles();
  const { data: orgUnitsData } = useOrgUnits();
  const { data: usersData } = useUsers(); // For manager selection

  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    employee_id: '',
    title: '',
    role_id: '',
    branch_id: '',
    department_id: '',
    shift_id: '',
    team_id: '',
    group_id: '',
    manager_id: '',
    password_option: 'auto',
    password: '',
    is_active: true,
    idle_timeout_minutes: 60,
    account_expires_at: '',
  });
  const [errors, setErrors] = useState({});
  const [generatedPassword, setGeneratedPassword] = useState(null);

  // Extract org units by type
  const branches = orgUnitsData?.units?.filter(u => u.type === 'branch') || [];
  const departments = orgUnitsData?.units?.filter(u => u.type === 'department') || [];
  const shifts = orgUnitsData?.units?.filter(u => u.type === 'shift') || [];
  const teams = orgUnitsData?.units?.filter(u => u.type === 'team') || [];
  const groups = orgUnitsData?.units?.filter(u => u.type === 'group') || [];
  const roles = rolesData?.roles || [];
  const users = usersData?.users || [];

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        employee_id: '',
        title: '',
        role_id: '',
        branch_id: '',
        department_id: '',
        shift_id: '',
        team_id: '',
        group_id: '',
        manager_id: '',
        password_option: 'auto',
        password: '',
        is_active: true,
        idle_timeout_minutes: 60,
        account_expires_at: '',
      });
      setErrors({});
      setGeneratedPassword(null);
      setActiveTab('personal');
    }
  }, [open]);

  const validateForm = () => {
    const newErrors = {};

    // Personal info validation
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

    // Account settings validation
    if (!formData.role_id) {
      newErrors.role_id = 'Role is required';
    }
    if (formData.password_option === 'manual' && !formData.password) {
      newErrors.password = 'Password is required when using manual option';
    }
    if (formData.password_option === 'manual' && formData.password && formData.password.length < 12) {
      newErrors.password = 'Password must be at least 12 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Find first tab with errors and switch to it
      if (errors.first_name || errors.last_name || errors.email || errors.phone_number) {
        setActiveTab('personal');
      } else if (errors.role_id || errors.password) {
        setActiveTab('account');
      }
      return;
    }

    try {
      const result = await createUser.mutateAsync(formData);

      // Show generated password if available
      if (result.user?.generatedPassword) {
        setGeneratedPassword(result.user.generatedPassword);
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      // Error handling is done by the hook
      console.error('Create user error:', error);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({
      title: 'Copied!',
      description: 'Password copied to clipboard',
    });
  };

  const handleClose = () => {
    setGeneratedPassword(null);
    onOpenChange(false);
  };

  // Show success screen with generated password
  if (generatedPassword) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <DialogTitle>User Created Successfully!</DialogTitle>
            </div>
            <DialogDescription>
              Copy the generated password and share it securely with the user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This password will only be shown once. Make sure to copy it before closing this dialog.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="text-sm font-medium">Generated Password:</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-sm break-all">
                  {generatedPassword}
                </code>
                <Button size="sm" variant="outline" onClick={handleCopyPassword}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-muted p-3 rounded text-sm">
              <p className="font-medium mb-1">User Details:</p>
              <p>Name: {formData.first_name} {formData.last_name}</p>
              <p>Email: {formData.email}</p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Fill in the information below to create a new user account.
          </DialogDescription>
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
              {(errors.role_id || errors.password) && (
                <span className="ml-1 text-destructive">*</span>
              )}
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
              showPasswordOptions={true}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createUser.isPending}
          >
            {createUser.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
