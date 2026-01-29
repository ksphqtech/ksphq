import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getVisibleFields } from '@/lib/workforceSettings';
import { getActiveClients, getActiveActivities, getActiveProjectsByClient } from '@/lib/workforceData';

/**
 * Dynamic Field Group Component
 * Renders Client, Activity, Project, and Notes fields based on configuration
 */
export function DynamicFieldGroup({
  formData,
  onFieldChange,
  disabled = false,
  errors = {},
  settings = null
}) {
  const visibleFields = getVisibleFields(settings);
  const clients = getActiveClients();
  const activities = getActiveActivities();

  // Filter projects by selected client
  const projects = formData.client
    ? getActiveProjectsByClient(formData.client)
    : [];

  // Get tooltip message for disabled state
  const getDisabledTooltip = () => {
    if (!disabled) return null;

    const timing = settings?.clockIn?.fieldEditTiming || 'either';
    if (timing === 'before') {
      return 'Fields can only be edited before clocking in';
    } else if (timing === 'after') {
      return 'Fields can only be edited after clocking in';
    }
    return null;
  };

  const disabledTooltip = getDisabledTooltip();

  const renderField = (field) => {
    const isRequired = field.required;
    const hasError = errors[field.name];

    switch (field.name) {
      case 'client':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor="client">
              Client
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            {disabled && disabledTooltip ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Select
                        value={formData.client || ''}
                        onValueChange={(value) => onFieldChange('client', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger id="client" className={hasError ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{disabledTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Select
                value={formData.client || ''}
                onValueChange={(value) => {
                  onFieldChange('client', value);
                  // Clear project when client changes
                  if (formData.project) {
                    onFieldChange('project', '');
                  }
                }}
                disabled={disabled}
              >
                <SelectTrigger id="client" className={hasError ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.name]}</p>
            )}
          </div>
        );

      case 'activity':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor="activity">
              Activity
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            {disabled && disabledTooltip ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Select
                        value={formData.activity || ''}
                        onValueChange={(value) => onFieldChange('activity', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger id="activity" className={hasError ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select activity" />
                        </SelectTrigger>
                        <SelectContent>
                          {activities.map(activity => (
                            <SelectItem key={activity.id} value={activity.id}>
                              {activity.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{disabledTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Select
                value={formData.activity || ''}
                onValueChange={(value) => onFieldChange('activity', value)}
                disabled={disabled}
              >
                <SelectTrigger id="activity" className={hasError ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map(activity => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.name]}</p>
            )}
          </div>
        );

      case 'project':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor="project">
              Project
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            {disabled && disabledTooltip ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Select
                        value={formData.project || ''}
                        onValueChange={(value) => onFieldChange('project', value)}
                        disabled={disabled || !formData.client}
                      >
                        <SelectTrigger id="project" className={hasError ? 'border-destructive' : ''}>
                          <SelectValue placeholder={formData.client ? "Select project" : "Select client first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map(project => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{disabledTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Select
                value={formData.project || ''}
                onValueChange={(value) => onFieldChange('project', value)}
                disabled={disabled || !formData.client}
              >
                <SelectTrigger id="project" className={hasError ? 'border-destructive' : ''}>
                  <SelectValue placeholder={formData.client ? "Select project" : "Select client first"} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.name]}</p>
            )}
          </div>
        );

      case 'notes':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor="notes">
              Notes
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            {disabled && disabledTooltip ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Textarea
                        id="notes"
                        placeholder="Add notes about your work..."
                        value={formData.notes || ''}
                        onChange={(e) => onFieldChange('notes', e.target.value)}
                        disabled={disabled}
                        rows={3}
                        className={hasError ? 'border-destructive' : ''}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{disabledTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Textarea
                id="notes"
                placeholder="Add notes about your work..."
                value={formData.notes || ''}
                onChange={(e) => onFieldChange('notes', e.target.value)}
                disabled={disabled}
                rows={3}
                className={hasError ? 'border-destructive' : ''}
              />
            )}
            {formData.notes && (
              <p className="text-xs text-muted-foreground">
                {formData.notes.length} / 500 characters
              </p>
            )}
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.name]}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (visibleFields.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-lg">
        No fields configured. Please contact your administrator.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleFields.map(field => renderField(field))}
    </div>
  );
}
