import { Header } from './Header'
import { UnifiedNav } from './UnifiedNav'
import { useSettings } from '@/contexts/SettingsContext'
import { cn } from '@/lib/utils'

export function ToolLayout({ children, navItems = [], toolName }) {
  const { settings } = useSettings()

  const densityClasses = {
    compact: 'p-2 md:p-3 lg:p-4',
    comfortable: 'p-4 md:p-6 lg:p-8',
    spacious: 'p-6 md:p-8 lg:p-12'
  }

  const density = settings?.display?.density || 'comfortable'
  const animations = settings?.display?.animations !== false

  return (
    <div className={cn(
      "min-h-screen bg-background",
      !animations && "[&_*]:transition-none [&_*]:duration-0"
    )}>
      <Header />
      <div className="flex">
        <UnifiedNav
          navItems={navItems}
          type="tool"
          heading={toolName}
          showBackButton={true}
        />
        <main className={cn("flex-1", densityClasses[density])}>
          <div className="space-y-4">
            <div>{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
