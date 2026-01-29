/**
 * Password Reset Dialog
 * Allows admins to reset user passwords with auto-generate or manual options
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle, Copy, CheckCircle2, KeyRound } from 'lucide-react';
import { useResetPassword } from '@/hooks/useUsers';
import { toast } from 'sonner';

export function PasswordResetDialog({ user, open, onOpenChange }) {
  const resetPassword = useResetPassword();

  const [passwordOption, setPasswordOption] = useState('auto');
  const [customPassword, setCustomPassword] = useState('');
  const [requireChange, setRequireChange] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [passwordError, setPasswordError] = useState('');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setPasswordOption('auto');
      setCustomPassword('');
      setRequireChange(true);
      setGeneratedPassword(null);
      setPasswordError('');
    }
  }, [open]);

  const validatePassword = (password) => {
    if (password.length < 12) {
      return 'Password must be at least 12 characters';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleReset = async () => {
    // Validate custom password if manual option selected
    if (passwordOption === 'manual') {
      const error = validatePassword(customPassword);
      if (error) {
        setPasswordError(error);
        return;
      }
    }

    try {
      const result = await resetPassword.mutateAsync({
        userId: user.id,
        options: {
          password_option: passwordOption,
          password: passwordOption === 'manual' ? customPassword : undefined,
          require_change: requireChange,
        },
      });

      // Show generated password if available
      if (result.generatedPassword) {
        setGeneratedPassword(result.generatedPassword);
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleCopyPassword = () => {
    const password = generatedPassword || customPassword;
    navigator.clipboard.writeText(password);
    toast.success('Password copied to clipboard');
  };

  const handleClose = () => {
    setGeneratedPassword(null);
    onOpenChange(false);
  };

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  // Success screen with generated password
  if (generatedPassword) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <DialogTitle>Password Reset Successfully!</DialogTitle>
            </div>
            <DialogDescription>
              Copy the generated password and share it securely with the user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This password will only be shown once. Make sure to copy it before closing this dialog.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="text-sm font-medium">New Password:</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-sm break-all">
                  {generatedPassword}
                </code>
                <Button size="sm" variant="outline" onClick={handleCopyPassword}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {requireChange && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  The user will be required to change their password on next login.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Main reset form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            <DialogTitle>Reset Password</DialogTitle>
          </div>
          <DialogDescription>
            Reset the password for this user account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {getInitials(user?.first_name, user?.last_name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email}
              </p>
              {user?.first_name && user?.last_name && (
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              )}
            </div>
          </div>

          {/* Password Options */}
          <div className="space-y-3">
            <Label>Password Option</Label>
            <RadioGroup value={passwordOption} onValueChange={setPasswordOption}>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="auto" id="auto" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="auto" className="font-normal">
                    Auto-generate secure password
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    A random 12-character password will be generated
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="manual" id="manual" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="manual" className="font-normal">
                    Set custom password
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enter a custom password for the user
                  </p>
                </div>
              </div>
            </RadioGroup>

            {passwordOption === 'manual' && (
              <div className="space-y-2 pl-6">
                <Input
                  type="password"
                  placeholder="Enter password (min 12 characters)"
                  value={customPassword}
                  onChange={(e) => {
                    setCustomPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className={passwordError ? 'border-destructive' : ''}
                />
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Password must be at least 12 characters with uppercase, lowercase, number, and special character.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {/* Require Change Checkbox */}
          <div className="flex items-start space-x-2 p-3 border rounded-lg">
            <Checkbox
              id="require_change"
              checked={requireChange}
              onCheckedChange={setRequireChange}
            />
            <div className="flex-1">
              <Label htmlFor="require_change" className="font-normal cursor-pointer">
                Require password change on next login
              </Label>
              <p className="text-sm text-muted-foreground">
                User will be prompted to set a new password when they log in
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReset}
            disabled={resetPassword.isPending || (passwordOption === 'manual' && !customPassword)}
          >
            {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
