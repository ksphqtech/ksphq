import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ToolTile } from '@/components/dashboard/ToolTile'
import { useAuth } from '@/contexts/AuthContext'
import { useToolsList } from '@/hooks/useNavigation'
import { getIconComponent } from '@/lib/icons'

export function DashboardPage() {
  const { user } = useAuth()
  const toolsConfig = useToolsList()

  // Validate toolsConfig is an array before mapping
  if (!Array.isArray(toolsConfig)) {
    console.warn('DashboardPage: toolsConfig is not an array:', toolsConfig)
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground">Loading tools...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Convert tools config to format expected by ToolTile
  const tools = toolsConfig.map(tool => ({
    title: tool.title,
    description: tool.description,
    icon: getIconComponent(tool.icon),
    href: tool.path,
    permission: tool.permission,
  }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            Select a tool below to get started
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {tools.map((tool) => (
            <ToolTile key={tool.href} {...tool} />
          ))}
        </div>

        {user?.role === 'user' && (
          <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
            Some tools may be locked based on your permissions. Contact an admin to request access.
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
