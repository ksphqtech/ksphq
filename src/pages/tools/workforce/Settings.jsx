import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, RotateCcw, AlertCircle } from 'lucide-react';
import {
  getWorkforceSettings,
  updateWorkforceSettings,
  DEFAULT_WORKFORCE_SETTINGS
} from '@/lib/workforceSettings';
import { ClientManagement } from '@/components/workforce/ClientManagement';
import { ActivityManagement } from '@/components/workforce/ActivityManagement';
import { ProjectManagement } from '@/components/workforce/ProjectManagement';

export function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const currentSettings = getWorkforceSettings();
    setSettings(currentSettings);
    setHasChanges(false);
  };

  const handleFieldVisibilityChange = (fieldName, visible) => {
    setSettings(prev => ({
      ...prev,
      clockIn: {
        ...prev.clockIn,
        fields: {
          ...prev.clockIn.fields,
          [fieldName]: {
            ...prev.clockIn.fields[fieldName],
            visible,
            // If making field invisible, also make it not required
            required: visible ? prev.clockIn.fields[fieldName].required : false
          }
        }
      }
    }));
    setHasChanges(true);
  };

  const handleFieldRequiredChange = (fieldName, required) => {
    setSettings(prev => ({
      ...prev,
      clockIn: {
        ...prev.clockIn,
        fields: {
          ...prev.clockIn.fields,
          [fieldName]: {
            ...prev.clockIn.fields[fieldName],
            required
          }
        }
      }
    }));
    setHasChanges(true);
  };

  const handleFieldEditTimingChange = (timing) => {
    setSettings(prev => ({
      ...prev,
      clockIn: {
        ...prev.clockIn,
        fieldEditTiming: timing
      }
    }));
    setHasChanges(true);
  };

  const handleTabRoleChange = (tabId, role, enabled) => {
    setSettings(prev => {
      const currentRoles = prev.clockIn.tabs[tabId].roles;
      const newRoles = enabled
        ? [...currentRoles, role]
        : currentRoles.filter(r => r !== role);

      return {
        ...prev,
        clockIn: {
          ...prev.clockIn,
          tabs: {
            ...prev.clockIn.tabs,
            [tabId]: {
              ...prev.clockIn.tabs[tabId],
              roles: newRoles
            }
          }
        }
      };
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    const result = updateWorkforceSettings(settings);
    if (result.success) {
      setHasChanges(false);
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to save settings' });
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      setSettings(DEFAULT_WORKFORCE_SETTINGS);
      setHasChanges(true);
    }
  };

  if (!settings) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading settings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Only administrators can access workforce settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fieldNames = ['client', 'activity', 'project', 'notes'];
  const roles = ['user', 'manager', 'admin'];

  return (
    <div className="space-y-6">
      {/* Header with Save/Reset */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workforce Settings</h2>
          <p className="text-muted-foreground">
            Configure time tracking fields, permissions, and manage workforce data.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <Alert variant={saveMessage.type === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveMessage.text}</AlertDescription>
        </Alert>
      )}

      {/* Has Changes Indicator */}
      {hasChanges && (
        <Alert>
          <AlertDescription>
            You have unsaved changes. Click "Save Changes" to apply them.
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="clock-in" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clock-in">Clock In Configuration</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        {/* Clock In Configuration Tab */}
        <TabsContent value="clock-in" className="space-y-6">
          {/* Field Visibility & Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Field Configuration</CardTitle>
              <CardDescription>
                Control which fields are visible and required for time tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fieldNames.map(fieldName => {
                const field = settings.clockIn.fields[fieldName];
                return (
                  <div key={fieldName} className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-base capitalize">{fieldName}</Label>
                        {!field.visible && (
                          <Badge variant="secondary">Hidden</Badge>
                        )}
                        {field.required && field.visible && (
                          <Badge variant="default">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {fieldName === 'client' && 'Client or customer for time tracking'}
                        {fieldName === 'activity' && 'Type of work being performed'}
                        {fieldName === 'project' && 'Specific project within a client'}
                        {fieldName === 'notes' && 'Additional details about the work'}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${fieldName}-visible`} className="text-sm">Visible</Label>
                        <Switch
                          id={`${fieldName}-visible`}
                          checked={field.visible}
                          onCheckedChange={(checked) => handleFieldVisibilityChange(fieldName, checked)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${fieldName}-required`} className="text-sm">Required</Label>
                        <Switch
                          id={`${fieldName}-required`}
                          checked={field.required}
                          onCheckedChange={(checked) => handleFieldRequiredChange(fieldName, checked)}
                          disabled={!field.visible}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Field Edit Timing */}
          <Card>
            <CardHeader>
              <CardTitle>Field Edit Timing</CardTitle>
              <CardDescription>
                Control when users can edit time tracking fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={settings.clockIn.fieldEditTiming}
                onValueChange={handleFieldEditTimingChange}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <RadioGroupItem value="before" id="before" />
                  <Label htmlFor="before" className="font-normal">
                    Before Clock In - Fields can only be filled before clocking in (locked after)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-3">
                  <RadioGroupItem value="after" id="after" />
                  <Label htmlFor="after" className="font-normal">
                    After Clock In - Fields can only be filled after clocking in (locked before)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="either" id="either" />
                  <Label htmlFor="either" className="font-normal">
                    Either - Fields can be edited before or after clocking in (most flexible)
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Tab Access Control */}
          <Card>
            <CardHeader>
              <CardTitle>Tab Access Control</CardTitle>
              <CardDescription>
                Configure which user roles can access each time tracking mode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Clock In Tab */}
              <div className="space-y-3">
                <Label className="text-base">Clock In Tab</Label>
                <p className="text-sm text-muted-foreground">
                  Real-time clock in/out functionality with elapsed time tracking
                </p>
                <div className="flex gap-4">
                  {roles.map(role => {
                    const isEnabled = settings.clockIn.tabs.clockIn.roles.includes(role);
                    return (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={`clockIn-${role}`}
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleTabRoleChange('clockIn', role, checked)}
                        />
                        <Label htmlFor={`clockIn-${role}`} className="capitalize font-normal">
                          {role}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Log Time Tab */}
              <div className="space-y-3 border-t pt-6">
                <Label className="text-base">Log Time Tab</Label>
                <p className="text-sm text-muted-foreground">
                  Manual time entry for retroactive logging
                </p>
                <div className="flex gap-4">
                  {roles.map(role => {
                    const isEnabled = settings.clockIn.tabs.logTime.roles.includes(role);
                    return (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={`logTime-${role}`}
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleTabRoleChange('logTime', role, checked)}
                        />
                        <Label htmlFor={`logTime-${role}`} className="capitalize font-normal">
                          {role}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Settings</CardTitle>
              <CardDescription>
                Additional validation rules for time tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maximum Notes Length</Label>
                  <p className="text-sm text-muted-foreground">
                    Currently set to {settings.validation.maxNotesLength} characters
                  </p>
                </div>
                <Badge variant="outline">500 chars</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Client for Billable</Label>
                  <p className="text-sm text-muted-foreground">
                    {settings.validation.requireClientForBillable ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <Badge variant={settings.validation.requireClientForBillable ? 'default' : 'secondary'}>
                  {settings.validation.requireClientForBillable ? 'Required' : 'Optional'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients">
          <ClientManagement />
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <ActivityManagement />
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <ProjectManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
