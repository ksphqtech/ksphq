import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function EditUserDialog({ user, onSave, onCancel }) {
  const [role, setRole] = useState(user.role)

  const handleSave = () => {
    onSave(user.id, { role })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Edit User Role</CardTitle>
          <CardDescription>
            Change the role for {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm font-medium mb-2">Current Role</p>
            <Badge>{user.role.toUpperCase()}</Badge>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select New Role</label>
            <div className="grid gap-2">
              {['admin', 'manager', 'user'].map((roleOption) => (
                <label
                  key={roleOption}
                  className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                    role === roleOption
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={roleOption}
                    checked={role === roleOption}
                    onChange={(e) => setRole(e.target.value)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}</p>
                    <p className="text-xs text-muted-foreground">
                      {roleOption === 'admin' && 'Full access to all features'}
                      {roleOption === 'manager' && 'Access to tools and view users'}
                      {roleOption === 'user' && 'Limited access based on permissions'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
