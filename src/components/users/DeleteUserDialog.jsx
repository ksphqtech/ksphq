import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function DeleteUserDialog({ user, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Delete User</CardTitle>
          <CardDescription>
            Are you sure you want to delete this user? This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm font-medium">User: {user.email}</p>
            <p className="text-sm text-muted-foreground">Role: {user.role}</p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete User
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
