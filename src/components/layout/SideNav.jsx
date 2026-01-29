import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  Settings,
  Palette,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'

export function SideNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidenav-collapsed')
    return saved ? JSON.parse(saved) : false
  })
  const location = useLocation()
  const { user } = useAuth()

  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidenav-collapsed', JSON.stringify(newState))
  }

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Business Info',
      href: '/business-info',
      icon: Building2,
    },
    {
      title: 'Users',
      href: '/users',
      icon: Users,
      managerAccess: true, // Managers can view users
    },
    {
      title: 'Permissions',
      href: '/permissions',
      icon: Shield,
      adminOnly: true, // Only admins can manage permissions
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
    },
    {
      title: 'Customize',
      href: '/customize',
      icon: Palette,
    },
  ]

  const isActive = (href) => {
    // Exact match for dashboard root
    if (href === '/dashboard') return location.pathname === href
    // Prefix match for nested routes
    return location.pathname.startsWith(href)
  }

  const NavLink = ({ item }) => {
    // Check role-based access
    const isAdmin = user?.role === 'admin'
    const isManager = user?.role === 'manager'

    let canView = true
    if (item.adminOnly && !isAdmin) {
      canView = false
    } else if (item.managerAccess && !isAdmin && !isManager) {
      canView = false
    }

    if (!canView) return null

    return (
      <Link
        to={item.href}
        onClick={() => setIsOpen(false)}
        className={cn(
          'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
          isActive(item.href)
            ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
          isCollapsed && 'justify-center px-0'
        )}
        title={isCollapsed ? item.title : undefined}
      >
        <item.icon className="h-4 w-4" />
        {!isCollapsed && <span>{item.title}</span>}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed left-4 top-20 z-50"
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
        <div className="flex flex-col gap-1.5 p-4">
          {/* Collapse Toggle Button - Desktop Only */}
          <div className="hidden md:flex justify-end mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              className="h-8 w-8"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {!isCollapsed && (
            <div className="mb-2">
              <h2 className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-2.5 py-1">
                Navigation
              </h2>
            </div>
          )}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          {!isCollapsed && (
            <>
              <Separator className="my-2" />
              <div className="text-xs text-muted-foreground px-3">
                <p className="font-semibold mb-1">Platform Status</p>
                <p>Frontend Only (Dev Mode)</p>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Spacer for desktop */}
      <div className={cn('hidden md:block transition-all', isCollapsed ? 'w-[60px]' : 'w-[240px]')} />
    </>
  )
}
