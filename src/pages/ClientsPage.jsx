import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ClientManagement } from '@/components/workforce/ClientManagement'

export function ClientsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage client information, contacts, and billing details
          </p>
        </div>
        <ClientManagement />
      </div>
    </DashboardLayout>
  )
}
