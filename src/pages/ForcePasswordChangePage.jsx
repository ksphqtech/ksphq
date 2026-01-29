import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Check, X, Eye, EyeOff, AlertCircle } from 'lucide-react'
import authService from '@/services/authService'

export function ForcePasswordChangePage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  // Password validation rules
  const passwordRules = [
    { id: 'length', label: 'At least 12 characters', test: (pwd) => pwd.length >= 12 },
    { id: 'uppercase', label: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', label: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { id: 'number', label: 'One number', test: (pwd) => /\d/.test(pwd) },
    { id: 'special', label: 'One special character', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
  ]

  const isPasswordValid = passwordRules.every(rule => rule.test(formData.newPassword))
  const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword !== ''
  const isDifferentFromCurrent = formData.newPassword !== formData.currentPassword || formData.newPassword === ''

  const canSubmit =
    formData.currentPassword &&
    formData.newPassword &&
    formData.confirmPassword &&
    isPasswordValid &&
    passwordsMatch &&
    isDifferentFromCurrent

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!canSubmit) {
      toast.error('Please fix all validation errors')
      return
    }

    setIsLoading(true)

    try {
      const response = await authService.changePassword(
        formData.currentPassword,
        formData.newPassword
      )

      // Update user context to clear password_reset_required flag
      if (response.user) {
        updateUser(response.user)
      }

      toast.success('Password changed successfully!')
      navigate('/dashboard')
    } catch (error) {
      if (error.status === 400 && error.message?.includes('current password')) {
        toast.error('Current password is incorrect')
      } else if (error.message?.includes('same as')) {
        toast.error('New password must be different from current password')
      } else {
        toast.error(error.message || 'Failed to change password')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Password Change Required</CardTitle>
              <CardDescription className="mt-2">
                Your administrator requires you to set a new password before continuing.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Info */}
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium">{user?.email}</p>
              {user?.first_name && user?.last_name && (
                <p className="text-muted-foreground">
                  {user.first_name} {user.last_name}
                </p>
              )}
            </div>

            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  disabled={isLoading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  disabled={isLoading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Requirements */}
              {formData.newPassword && (
                <div className="space-y-1 mt-2">
                  {passwordRules.map((rule) => {
                    const passes = rule.test(formData.newPassword)
                    return (
                      <div key={rule.id} className="flex items-center gap-2 text-sm">
                        {passes ? (
                          <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 dark:text-red-500" />
                        )}
                        <span className={passes ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}>
                          {rule.label}
                        </span>
                      </div>
                    )
                  })}
                  {formData.currentPassword && !isDifferentFromCurrent && (
                    <div className="flex items-center gap-2 text-sm">
                      <X className="h-4 w-4 text-red-600 dark:text-red-500" />
                      <span className="text-red-600 dark:text-red-500">
                        Must be different from current password
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="flex items-center gap-2 text-sm mt-1">
                  {passwordsMatch ? (
                    <>
                      <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
                      <span className="text-green-600 dark:text-green-500">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-600 dark:text-red-500" />
                      <span className="text-red-600 dark:text-red-500">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={!canSubmit || isLoading}
                className="w-full"
              >
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full"
              >
                Logout Instead
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
