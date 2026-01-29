import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { BrandingEditor } from '../components/customize/BrandingEditor';
import { Card, CardContent } from '../components/ui/card';
import { Lock } from 'lucide-react';

export default function CustomizePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Customize</h1>
          <p className="text-muted-foreground">
            Customize your platform branding and logo
          </p>
        </div>

        {isAdmin ? (
          <BrandingEditor />
        ) : (
          <Card>
            <CardContent className="flex items-center gap-2 pt-6">
              <Lock className="h-4 w-4" />
              <p>You need administrator privileges to customize branding.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
