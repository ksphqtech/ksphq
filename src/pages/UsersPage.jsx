import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Trash2, Edit, Users as UsersIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getUsers, updateUser } from '@/lib/auth'
import { EditUserDialog } from '@/components/users/EditUserDialog'
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog'
import { toast } from 'sonner'
import { DEFAULT_PERMISSIONS } from '@/lib/auth'

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)

  const isAdmin = currentUser?.role === 'admin'
  const canEdit = isAdmin

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    const allUsers = getUsers()
    setUsers(allUsers)
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEditRole = (userId, updates) => {
    // Update role and default permissions for that role
    const updatedData = {
      ...updates,
      permissions: DEFAULT_PERMISSIONS[updates.role]
    }
    updateUser(userId, updatedData)
    loadUsers()
    setEditingUser(null)
    toast.success('User role updated successfully!')
  }

  const handleDeleteUser = (userId) => {
    if (userId === currentUser.id) {
      toast.error('You cannot delete your own account!')
      return
    }

    const allUsers = getUsers()
    const filtered = allUsers.filter(u => u.id !== userId)
    localStorage.setItem('users', JSON.stringify(filtered))
    loadUsers()
    setDeletingUser(null)
    toast.success('User deleted successfully!')
  }

  const getInitials = (email) => {
    return email.substring(0, 2).toUpperCase()
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground">
              Manage user accounts and roles
            </p>
          </div>
          {!canEdit && (
            <Badge variant="outline">View Only</Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.role === 'admin').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Managers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.role === 'manager').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.role === 'user').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>A list of all registered users</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 5 : 4} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(user.email)}
                            </AvatarFallback>
                          </Avatar>
                          {user.id === currentUser.id && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingUser(user)}
                              disabled={user.id === currentUser.id}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          onSave={handleEditRole}
          onCancel={() => setEditingUser(null)}
        />
      )}

      {/* Delete Dialog */}
      {deletingUser && (
        <DeleteUserDialog
          user={deletingUser}
          onConfirm={() => handleDeleteUser(deletingUser.id)}
          onCancel={() => setDeletingUser(null)}
        />
      )}
    </DashboardLayout>
  )
}
