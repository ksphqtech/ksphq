/**
 * Reusable User Form Fields
 * Used by both CreateUserDialog and EditUserDialog
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * Personal Information Tab
 */
export function PersonalInfoFields({ formData, setFormData, errors = {}, disabled = false }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="first_name"
            value={formData.first_name || ''}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            disabled={disabled}
            className={errors.first_name ? 'border-destructive' : ''}
          />
          {errors.first_name && (
            <p className="text-sm text-destructive">{errors.first_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="last_name"
            value={formData.last_name || ''}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            disabled={disabled}
            className={errors.last_name ? 'border-destructive' : ''}
          />
          {errors.last_name && (
            <p className="text-sm text-destructive">{errors.last_name}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={disabled}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number</Label>
        <Input
          id="phone_number"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={formData.phone_number || ''}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          disabled={disabled}
          className={errors.phone_number ? 'border-destructive' : ''}
        />
        {errors.phone_number && (
          <p className="text-sm text-destructive">{errors.phone_number}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="employee_id">Employee ID</Label>
        <Input
          id="employee_id"
          placeholder="EMP-12345"
          value={formData.employee_id || ''}
          onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
          disabled={disabled}
          className={errors.employee_id ? 'border-destructive' : ''}
        />
        {errors.employee_id && (
          <p className="text-sm text-destructive">{errors.employee_id}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Work Details Tab
 */
export function WorkDetailsFields({
  formData,
  setFormData,
  roles = [],
  branches = [],
  departments = [],
  shifts = [],
  teams = [],
  groups = [],
  users = [],
  errors = {},
  disabled = false,
}) {
  // Filter out current user from manager list to prevent self-assignment
  const managerOptions = users.filter(u =>
    u.id !== formData.id && !u.deleted_at
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Job Title</Label>
        <Input
          id="title"
          placeholder="Senior Manager"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="branch_id">Branch</Label>
          <Select
            value={formData.branch_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, branch_id: value === 'none' ? null : value })}
            disabled={disabled}
          >
            <SelectTrigger id="branch_id">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {branches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="department_id">Department</Label>
          <Select
            value={formData.department_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, department_id: value === 'none' ? null : value })}
            disabled={disabled}
          >
            <SelectTrigger id="department_id">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="shift_id">Shift</Label>
          <Select
            value={formData.shift_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, shift_id: value === 'none' ? null : value })}
            disabled={disabled}
          >
            <SelectTrigger id="shift_id">
              <SelectValue placeholder="Select shift" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {shifts.map(shift => (
                <SelectItem key={shift.id} value={shift.id}>
                  {shift.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="team_id">Team</Label>
          <Select
            value={formData.team_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, team_id: value === 'none' ? null : value })}
            disabled={disabled}
          >
            <SelectTrigger id="team_id">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="group_id">Group</Label>
        <Select
          value={formData.group_id || 'none'}
          onValueChange={(value) => setFormData({ ...formData, group_id: value === 'none' ? null : value })}
          disabled={disabled}
        >
          <SelectTrigger id="group_id">
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {groups.map(group => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager_id">Reports To (Manager)</Label>
        <Select
          value={formData.manager_id || 'none'}
          onValueChange={(value) => setFormData({ ...formData, manager_id: value === 'none' ? null : value })}
          disabled={disabled}
        >
          <SelectTrigger id="manager_id">
            <SelectValue placeholder="Select manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {managerOptions.map(user => (
              <SelectItem key={user.id} value={user.id}>
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name} (${user.email})`
                  : user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/**
 * Account Settings Tab
 */
export function AccountSettingsFields({
  formData,
  setFormData,
  roles = [],
  errors = {},
  disabled = false,
  showPasswordOptions = false,
}) {
  const selectedRole = roles.find(r => r.id === formData.role_id);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="role_id">
          Role <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.role_id || ''}
          onValueChange={(value) => setFormData({ ...formData, role_id: value })}
          disabled={disabled}
        >
          <SelectTrigger id="role_id" className={errors.role_id ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map(role => (
              <SelectItem key={role.id} value={role.id}>
                {role.name} (Level {role.level})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.role_id && (
          <p className="text-sm text-destructive">{errors.role_id}</p>
        )}
        {selectedRole?.description && (
          <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
        )}
      </div>

      {showPasswordOptions && (
        <div className="space-y-3">
          <Label>Password</Label>
          <RadioGroup
            value={formData.password_option || 'auto'}
            onValueChange={(value) => setFormData({ ...formData, password_option: value })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="auto" id="password-auto" />
              <Label htmlFor="password-auto" className="font-normal">
                Auto-generate secure password (Recommended)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="password-manual" />
              <Label htmlFor="password-manual" className="font-normal">
                Set custom password
              </Label>
            </div>
          </RadioGroup>

          {formData.password_option === 'manual' && (
            <div className="mt-2">
              <Input
                type="password"
                placeholder="Enter password (min 12 characters)"
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Password must be at least 12 characters with uppercase, lowercase, number, and special character.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="is_active">Active Status</Label>
          <p className="text-sm text-muted-foreground">
            User can log in and access the system
          </p>
        </div>
        <Switch
          id="is_active"
          checked={formData.is_active !== false}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="idle_timeout_minutes">Idle Timeout</Label>
        <Select
          value={String(formData.idle_timeout_minutes || 60)}
          onValueChange={(value) => setFormData({ ...formData, idle_timeout_minutes: parseInt(value) })}
          disabled={disabled}
        >
          <SelectTrigger id="idle_timeout_minutes">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 minutes</SelectItem>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="60">1 hour</SelectItem>
            <SelectItem value="120">2 hours</SelectItem>
            <SelectItem value="240">4 hours</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Automatically log out after period of inactivity
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_expires_at">Account Expiry Date (Optional)</Label>
        <Input
          id="account_expires_at"
          type="date"
          value={formData.account_expires_at ? formData.account_expires_at.split('T')[0] : ''}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value).toISOString() : '';
            setFormData({ ...formData, account_expires_at: date });
          }}
          disabled={disabled}
        />
        <p className="text-sm text-muted-foreground">
          For temporary contractors or time-limited accounts
        </p>
      </div>

      {selectedRole?.permissions && (
        <div className="pt-4 border-t">
          <Label className="text-sm font-medium">Tool Permissions (Inherited from Role)</Label>
          <p className="text-sm text-muted-foreground mb-3">
            These permissions are inherited from the selected role
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(selectedRole.permissions).map(([key, value]) => {
              if (key === 'user_management') return null;
              return (
                <div key={key} className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
