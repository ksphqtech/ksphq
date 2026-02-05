/**
 * Branch Location Dialog Component
 * Dialog for creating/editing branch locations
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
import { useCreateLocation, useUpdateLocation } from '@/hooks/useBranchLocations';

export function BranchLocationDialog({ open, onOpenChange, branchId, location = null, onSuccess }) {
  const isEditing = !!location;
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();

  const [formData, setFormData] = useState({
    location_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'USA',
    is_primary: false,
    latitude: '',
    longitude: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Populate form when editing
  useEffect(() => {
    if (location) {
      setFormData({
        location_name: location.location_name || '',
        address_line1: location.address_line1 || '',
        address_line2: location.address_line2 || '',
        city: location.city || '',
        state_province: location.state_province || '',
        postal_code: location.postal_code || '',
        country: location.country || 'USA',
        is_primary: !!location.is_primary,
        latitude: location.latitude || '',
        longitude: location.longitude || '',
        notes: location.notes || '',
      });
    } else {
      setFormData({
        location_name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: 'USA',
        is_primary: false,
        latitude: '',
        longitude: '',
        notes: '',
      });
    }
    setErrors({});
  }, [location, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.location_name.trim()) {
      newErrors.location_name = 'Location name is required';
    }
    if (!formData.address_line1.trim()) {
      newErrors.address_line1 = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    // Validate latitude/longitude if provided
    if (formData.latitude && (isNaN(formData.latitude) || Math.abs(formData.latitude) > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    if (formData.longitude && (isNaN(formData.longitude) || Math.abs(formData.longitude) > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare data with proper types
    const submitData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      address_line2: formData.address_line2 || null,
      state_province: formData.state_province || null,
      postal_code: formData.postal_code || null,
      notes: formData.notes || null,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          locationId: location.id,
          updates: submitData,
        });
      } else {
        await createMutation.mutateAsync({
          branchId,
          locationData: submitData,
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation hooks
      console.error('Failed to save location:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Location' : 'Add New Location'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the details for this branch location.'
                : 'Add a new location for this branch.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Location Name */}
            <div className="space-y-2">
              <Label htmlFor="location_name">
                Location Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location_name"
                value={formData.location_name}
                onChange={(e) => handleChange('location_name', e.target.value)}
                placeholder="e.g., Main Office, Warehouse, etc."
                className={errors.location_name ? 'border-destructive' : ''}
              />
              {errors.location_name && (
                <p className="text-sm text-destructive">{errors.location_name}</p>
              )}
            </div>

            {/* Address Line 1 */}
            <div className="space-y-2">
              <Label htmlFor="address_line1">
                Address Line 1 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => handleChange('address_line1', e.target.value)}
                placeholder="Street address"
                className={errors.address_line1 ? 'border-destructive' : ''}
              />
              {errors.address_line1 && (
                <p className="text-sm text-destructive">{errors.address_line1}</p>
              )}
            </div>

            {/* Address Line 2 */}
            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => handleChange('address_line2', e.target.value)}
                placeholder="Apartment, suite, etc. (optional)"
              />
            </div>

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="City"
                  className={errors.city ? 'border-destructive' : ''}
                />
                {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state_province">State/Province</Label>
                <Input
                  id="state_province"
                  value={formData.state_province}
                  onChange={(e) => handleChange('state_province', e.target.value)}
                  placeholder="State or Province"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  placeholder="ZIP or Postal Code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="Country"
                  className={errors.country ? 'border-destructive' : ''}
                />
                {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
              </div>
            </div>

            {/* Geographic Coordinates (Optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (Optional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => handleChange('latitude', e.target.value)}
                  placeholder="e.g., 40.7128"
                  className={errors.latitude ? 'border-destructive' : ''}
                />
                {errors.latitude && <p className="text-sm text-destructive">{errors.latitude}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (Optional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => handleChange('longitude', e.target.value)}
                  placeholder="e.g., -74.0060"
                  className={errors.longitude ? 'border-destructive' : ''}
                />
                {errors.longitude && <p className="text-sm text-destructive">{errors.longitude}</p>}
              </div>
            </div>

            {/* Primary Location Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_primary"
                checked={formData.is_primary}
                onCheckedChange={(checked) => handleChange('is_primary', checked)}
              />
              <Label htmlFor="is_primary" className="cursor-pointer">
                Set as primary location
              </Label>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about this location"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Location' : 'Create Location'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
