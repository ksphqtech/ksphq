import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { toast } from 'sonner';
import { getBranding, updateBranding as updateBrandingLib, resetBranding as resetBrandingLib } from '../../lib/businessInfo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function BrandingEditor() {
  const [formData, setFormData] = useState({
    logoText: '',
    logoBackgroundColor: '',
    displayName: '',
    subtitle: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    const branding = getBranding();
    setFormData(branding);
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Validate logo text (2-4 characters)
    if (formData.logoText.length < 2 || formData.logoText.length > 4) {
      toast.error('Logo text must be between 2 and 4 characters');
      return;
    }

    updateBrandingLib(formData);
    setHasChanges(false);
    toast.success('Your branding changes have been saved successfully');

    // Trigger a storage event for other components
    window.dispatchEvent(new Event('storage'));
  };

  const handleReset = () => {
    const defaultBranding = resetBrandingLib();
    setFormData(defaultBranding);
    setHasChanges(false);
    toast.success('Branding has been reset to default values');

    // Trigger a storage event for other components
    window.dispatchEvent(new Event('storage'));
  };

  const handleCancel = () => {
    const branding = getBranding();
    setFormData(branding);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Logo Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Logo Settings</CardTitle>
          <CardDescription>
            Customize your platform logo with text initials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Text */}
          <div className="space-y-2">
            <Label htmlFor="logo-text">Logo Text (2-4 characters)</Label>
            <Input
              id="logo-text"
              value={formData.logoText}
              onChange={(e) => handleChange('logoText', e.target.value.toUpperCase())}
              maxLength={4}
              placeholder="KSP"
            />
          </div>

          {/* Logo Background Color */}
          <div className="space-y-2">
            <Label>Logo Background Color</Label>
            <div className="flex gap-3 items-start">
              <div
                className="w-20 h-20 rounded border cursor-pointer"
                style={{ backgroundColor: formData.logoBackgroundColor }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
              <div className="flex-1 space-y-2">
                <Input
                  value={formData.logoBackgroundColor}
                  onChange={(e) => handleChange('logoBackgroundColor', e.target.value)}
                  placeholder="hsl(222.2, 47.4%, 11.2%)"
                />
                {showColorPicker && (
                  <div className="mt-2">
                    <HexColorPicker
                      color={formData.logoBackgroundColor}
                      onChange={(color) => handleChange('logoBackgroundColor', color)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logo Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="inline-flex items-center justify-center text-xl font-bold text-primary-foreground rounded px-3 py-2"
              style={{ backgroundColor: formData.logoBackgroundColor }}
            >
              {formData.logoText}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>
            Customize how your platform name appears in the header
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              placeholder="KSP HQ"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              placeholder="Business Tools Platform"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
