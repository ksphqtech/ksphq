import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getIconComponent } from '@/lib/icons'
import { filterNavItems } from '@/lib/permissions'
import { useAuth } from '@/contexts/AuthContext'

export function UnifiedNav({
  navItems = [],
  type = 'main',  // 'main' or 'tool'
  heading,
  showBackButton = false,
  storageKey = 'sidenav-collapsed'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : false
  })
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem(storageKey, JSON.stringify(newState))
  }

  const isActive = (href) => {
    // Exact match for dashboard root
    if (href === '/dashboard') return location.pathname === href
    // Prefix match for nested routes
    return location.pathname.startsWith(href)
  }

  // Filter items based on user permissions (for main nav)
  const filteredItems = type === 'main' ? filterNavItems(navItems, user) : navItems

  const NavLink = ({ item }) => {
    const IconComponent = typeof item.icon === 'string'
      ? getIconComponent(item.icon)
      : item.icon

    const handleClick = () => {
      setIsOpen(false)
      if (item.onClick) {
        item.onClick()
      } else if (item.href || item.path) {
        const path = item.href || item.path
        navigate(path)
      }
    }

    const linkPath = item.href || item.path

    return (
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all w-full text-left',
          linkPath && isActive(linkPath)
            ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
          isCollapsed && 'justify-center px-0'
        )}
        title={isCollapsed ? item.title : undefined}
      >
        <IconComponent className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && <span>{item.title}</span>}
      </button>
    )
  }

  // Create the default "Back To Dashboard" item for tool pages
  const backToDashboard = showBackButton ? {
    title: 'Back To Dashboard',
    icon: Home,
    onClick: () => navigate('/dashboard')
  } : null

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed left-2 top-3 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-background transition-all md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'w-[60px]' : 'w-[240px]'
        )}
      >
        <div className="flex flex-col h-full gap-1.5 p-4">
          {!isCollapsed && heading && (
            <div className="mb-2">
              <h2 className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-2.5 py-1">
                {heading}
              </h2>
            </div>
          )}

          <nav className="flex flex-col gap-1">
            {/* Show Back To Dashboard for tool pages */}
            {backToDashboard && (
              <>
                <NavLink item={backToDashboard} />
                {filteredItems.length > 0 && <Separator className="my-2" />}
              </>
            )}

            {/* Show navigation items */}
            {(() => {
              // Group items by section
              const groupedItems = filteredItems.reduce((acc, item) => {
                const section = item.section || 'default'
                if (!acc[section]) acc[section] = []
                acc[section].push(item)
                return acc
              }, {})

              // Render with sections
              return Object.entries(groupedItems).map(([section, items], sectionIndex) => (
                <div key={section}>
                  {section !== 'default' && !isCollapsed && (
                    <h3 className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-2.5 py-1 mt-3">
                      {section}
                    </h3>
                  )}
                  {items.map((item, index) => (
                    <NavLink key={item.id || item.href || item.path || index} item={item} />
                  ))}
                  {sectionIndex < Object.entries(groupedItems).length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))
            })()}
          </nav>

          {/* Footer for main nav */}
          {type === 'main' && !isCollapsed && (
            <>
              <Separator className="my-2" />
              <div className="text-xs text-muted-foreground px-3">
                <p className="font-semibold mb-1">Platform Status</p>
                <p>Frontend Only (Dev Mode)</p>
              </div>
            </>
          )}

          {/* Collapse Toggle Button - Desktop Only - Positioned at Bottom */}
          <div className="hidden md:flex mt-auto pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 flex-shrink-0 mr-1.5" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Spacer for desktop */}
      <div className={cn('hidden md:block transition-all', isCollapsed ? 'w-[60px]' : 'w-[240px]')} />
    </>
  )
}
