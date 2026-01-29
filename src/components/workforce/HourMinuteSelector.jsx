import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Hour and Minute Selector Component
 * Allows selection of hours (0-24) and minutes (0, 15, 30, 45)
 */
export function HourMinuteSelector({ hours, minutes, onHoursChange, onMinutesChange, label = "Duration" }) {
  // Generate hours array (0-24)
  const hoursOptions = Array.from({ length: 25 }, (_, i) => i);

  // Minutes options (15-minute increments)
  const minutesOptions = [0, 15, 30, 45];

  // Calculate total time display
  const getTotalDisplay = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;

    if (h === 0 && m === 0) {
      return '0m';
    }

    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);

    return parts.join(' ');
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {/* Hours Selector */}
        <div className="flex-1">
          <Select value={hours.toString()} onValueChange={onHoursChange}>
            <SelectTrigger>
              <SelectValue placeholder="Hours" />
            </SelectTrigger>
            <SelectContent>
              {hoursOptions.map(hour => (
                <SelectItem key={hour} value={hour.toString()}>
                  {hour} {hour === 1 ? 'hour' : 'hours'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Separator */}
        <div className="text-2xl font-bold text-muted-foreground">:</div>

        {/* Minutes Selector */}
        <div className="flex-1">
          <Select value={minutes.toString()} onValueChange={onMinutesChange}>
            <SelectTrigger>
              <SelectValue placeholder="Minutes" />
            </SelectTrigger>
            <SelectContent>
              {minutesOptions.map(minute => (
                <SelectItem key={minute} value={minute.toString()}>
                  {minute} {minute === 1 ? 'min' : 'mins'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Total Display */}
      <div className="text-sm text-muted-foreground">
        Total: <span className="font-semibold">{getTotalDisplay()}</span>
      </div>
    </div>
  );
}
