import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { hexToHsl, hslToHex } from '../../lib/customization';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function ColorPickerDialog({ isOpen, onClose, value, onChange, colorName, defaultValue }) {
  const [hexValue, setHexValue] = useState('');
  const [hslValue, setHslValue] = useState('');

  useEffect(() => {
    if (value) {
      setHslValue(value);
      setHexValue(hslToHex(value));
    }
  }, [value]);

  const handleHexChange = (newHex) => {
    setHexValue(newHex);
    const hsl = hexToHsl(newHex);
    setHslValue(hsl);
  };

  const handleHslInputChange = (e) => {
    const newHsl = e.target.value;
    setHslValue(newHsl);
    try {
      const hex = hslToHex(newHsl);
      setHexValue(hex);
    } catch (err) {
      // Invalid HSL, don't update hex
    }
  };

  const handleSave = () => {
    onChange(hslValue);
    onClose();
  };

  const handleReset = () => {
    setHslValue(defaultValue);
    setHexValue(hslToHex(defaultValue));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {colorName}</DialogTitle>
          <DialogDescription>
            Choose a color using the picker or enter HSL values manually
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Color Picker */}
          <div className="flex justify-center">
            <HexColorPicker color={hexValue} onChange={handleHexChange} />
          </div>

          {/* HEX Input */}
          <div className="space-y-2">
            <Label htmlFor="hex-input">HEX</Label>
            <Input
              id="hex-input"
              value={hexValue}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#000000"
            />
          </div>

          {/* HSL Input */}
          <div className="space-y-2">
            <Label htmlFor="hsl-input">HSL (H S% L%)</Label>
            <Input
              id="hsl-input"
              value={hslValue}
              onChange={handleHslInputChange}
              placeholder="0 0% 0%"
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="w-full h-12 rounded border"
              style={{ backgroundColor: hexValue }}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
