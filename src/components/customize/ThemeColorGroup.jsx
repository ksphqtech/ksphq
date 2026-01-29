import React from 'react';
import { hslToHex } from '../../lib/customization';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Palette } from 'lucide-react';

export function ThemeColorGroup({ title, colors, onEditColor }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(colors).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-2 rounded hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-8 h-8 rounded border border-border shrink-0"
                  style={{ backgroundColor: hslToHex(value) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{key}</p>
                  <p className="text-xs text-muted-foreground font-mono">{value}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditColor(key, value)}
              >
                <Palette className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
