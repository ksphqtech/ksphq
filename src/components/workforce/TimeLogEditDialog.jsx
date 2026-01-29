import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DynamicFieldGroup } from './DynamicFieldGroup';
import { HourMinuteSelector } from './HourMinuteSelector';
import { validateFormData } from '@/lib/workforceSettings';

/**
 * Time Log Edit Dialog Component
 * Modal for editing manual time entries
 */
export function TimeLogEditDialog({ entry, open, onClose, onSave }) {
  const [formData, setFormData] = useState({
    client: '',
    activity: '',
    project: '',
    notes: '',
    hours: 0,
    minutes: 0
  });
  const [errors, setErrors] = useState({});

  // Initialize form data when entry changes
  useEffect(() => {
    if (entry) {
      // Parse duration (e.g., "2h 30m" -> hours: 2, minutes: 30)
      const durationMatch = entry.duration.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
      const hours = durationMatch?.[1] ? parseInt(durationMatch[1]) : 0;
      const minutes = durationMatch?.[2] ? parseInt(durationMatch[2]) : 0;

      setFormData({
        client: entry.clientId || '',
        activity: entry.activityId || '',
        project: entry.projectId || '',
        notes: entry.notes || '',
        hours,
        minutes
      });
      setErrors({});
    }
  }, [entry]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleHoursChange = (value) => {
    handleFieldChange('hours', parseInt(value));
  };

  const handleMinutesChange = (value) => {
    handleFieldChange('minutes', parseInt(value));
  };

  const handleSave = () => {
    // Validate form data
    const validation = validateFormData(formData);

    // Check minimum time (at least 15 minutes)
    const totalMinutes = (formData.hours * 60) + formData.minutes;
    if (totalMinutes < 15) {
      setErrors({ ...validation.errors, duration: 'Minimum duration is 15 minutes' });
      return;
    }

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Format duration
    const durationParts = [];
    if (formData.hours > 0) durationParts.push(`${formData.hours}h`);
    if (formData.minutes > 0) durationParts.push(`${formData.minutes}m`);
    const duration = durationParts.join(' ') || '0m';

    // Create updated entry
    const updatedEntry = {
      ...entry,
      clientId: formData.client,
      activityId: formData.activity,
      projectId: formData.project,
      notes: formData.notes,
      duration,
      updatedAt: new Date().toISOString()
    };

    onSave(updatedEntry);
    onClose();
  };

  const handleCancel = () => {
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Time Entry</DialogTitle>
          <DialogDescription>
            Update the details of this manual time entry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Duration Selector */}
          <HourMinuteSelector
            hours={formData.hours}
            minutes={formData.minutes}
            onHoursChange={handleHoursChange}
            onMinutesChange={handleMinutesChange}
            label="Duration"
          />
          {errors.duration && (
            <p className="text-sm text-destructive">{errors.duration}</p>
          )}

          {/* Dynamic Fields */}
          <DynamicFieldGroup
            formData={formData}
            onFieldChange={handleFieldChange}
            disabled={false}
            errors={errors}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
