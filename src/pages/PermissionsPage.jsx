import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Shield, Check, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getUsers, updateUser } from '@/lib/auth'
import { toast } from 'sonner'

export function PermissionsPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [hasChanges, setHasChanges] = useState(false)
  const [pendingChanges, setPendingChanges] = useState({})

  const isAdmin = currentUser?.role === 'admin'

  const tools = [
    { key: 'workforce', label: 'Workforce Control' },
    { key: 'docks', label: 'Dock Control' },
    { key: 'projects', label: 'Project Control' },
    { key: 'tickets', label: 'HQ Tickets' },
  ]

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    const allUsers = getUsers()
    // Filter out admins since they have all permissions by default
    const nonAdminUsers = allUsers.filter(u => u.role !== 'admin')
    setUsers(nonAdminUsers)
  }

  const getInitials = (email) => {
    return email.substring(0, 2).toUpperCase()
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'manager':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const hasPermission = (userId, tool) => {
    if (pendingChanges[userId]?.permissions?.[tool] !== undefined) {
      return pendingChanges[userId].permissions[tool]
    }
    const user = users.find(u => u.id === userId)
    return user?.permissions?.[tool] || false
  }

  const togglePermission = (userId, tool) => {
    if (!isAdmin) return

    const currentValue = hasPermission(userId, tool)
    setPendingChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        permissions: {
          ...(prev[userId]?.permissions || users.find(u => u.id === userId)?.permissions || {}),
          [tool]: !currentValue
        }
      }
    }))
    setHasChanges(true)
  }

  const toggleAllForUser = (userId, enable) => {
    if (!isAdmin) return

    const newPermissions = {}
    tools.forEach(tool => {
      newPermissions[tool.key] = enable
    })

    setPendingChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        permissions: newPermissions
      }
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    Object.entries(pendingChanges).forEach(([userId, changes]) => {
      updateUser(userId, changes)
    })

    setPendingChanges({})
    setHasChanges(false)
    loadUsers()
    toast.success('Permissions updated successfully!')
  }

  const handleCancel = () => {
    setPendingChanges({})
    setHasChanges(false)
    toast.info('Changes discarded')
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Shield className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">Only administrators can manage permissions</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Permissions</h1>
            <p className="text-muted-foreground">
              Manage tool access for users and managers
            </p>
          </div>
          {hasChanges && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">About Permissions</p>
                <p className="text-sm text-muted-foreground">
                  Administrators automatically have access to all tools. Use this page to grant or
                  revoke access for managers and regular users. Changes are saved to localStorage
                  and take effect immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Grid */}
        <div className="space-y-4">
          {users.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No non-admin users found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create new users to manage their permissions
                </p>
              </CardContent>
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{user.email}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role.toUpperCase()}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAllForUser(user.id, true)}
                      >
                        Enable All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAllForUser(user.id, false)}
                      >
                        Disable All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {tools.map((tool) => {
                      const hasAccess = hasPermission(user.id, tool.key)
                      return (
                        <button
                          key={tool.key}
                          onClick={() => togglePermission(user.id, tool.key)}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                            hasAccess
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <span className="font-medium">{tool.label}</span>
                          {hasAccess ? (
                            <div className="flex items-center gap-2 text-primary">
                              <Check className="h-5 w-5" />
                              <span className="text-sm font-medium">Enabled</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <X className="h-5 w-5" />
                              <span className="text-sm font-medium">Disabled</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
