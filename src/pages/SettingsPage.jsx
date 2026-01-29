import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground text-lg">Coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
