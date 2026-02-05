import { useState, useEffect } from 'react'
import { Moon, Sun, LogOut, User, Laptop } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { getBranding, DEFAULT_BRANDING } from '@/lib/businessInfo'
import { BranchSwitcher } from '@/components/branches/BranchSwitcher'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export function Header() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const [branding, setBranding] = useState(DEFAULT_BRANDING)

  // Load branding on mount and listen for changes
  useEffect(() => {
    const loadBranding = () => {
      setBranding(getBranding())
    }

    loadBranding()

    // Listen for storage changes (from other tabs or branding updates)
    window.addEventListener('storage', loadBranding)

    return () => {
      window.removeEventListener('storage', loadBranding)
    }
  }, [])

  const getInitials = (email) => {
    if (!email) return 'U'
    return email
      .split('@')[0]
      .substring(0, 2)
      .toUpperCase()
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'manager':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getThemeIcon = (themeName) => {
    switch (themeName) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'gray':
        return <Laptop className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-16 items-center justify-between pl-14 pr-4 md:px-6">
        <div className="flex items-center gap-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground font-bold"
            style={{ backgroundColor: branding.logoBackgroundColor }}
          >
            {branding.logoText}
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold">{branding.displayName}</h1>
            <p className="text-xs text-muted-foreground">{branding.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <BranchSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
              >
                {getThemeIcon(theme)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('gray')}>
                <Laptop className="mr-2 h-4 w-4" />
                Gray Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark Mode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">
                    {user ? getInitials(user.email) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block text-sm">
                  {user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <Badge variant={getRoleBadgeVariant(user?.role)} className="w-fit">
                    {user?.role?.toUpperCase() || 'USER'}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
