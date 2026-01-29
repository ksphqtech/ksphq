import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { RateLimitCountdown } from './RateLimitCountdown'
import { LoadingOverlay } from '@/components/ui/loading-overlay'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Don't submit if rate limited
    if (rateLimitInfo) {
      toast.error('Please wait for the countdown to finish')
      return
    }

    setIsLoading(true)

    try {
      const result = await login(email, password)

      if (result.success) {
        // Check if password change is required
        if (result.requiresPasswordChange) {
          toast.info('Password change required')
          navigate('/force-password-change')
        } else {
          toast.success('Welcome back!')
          navigate('/dashboard')
        }
      } else {
        // Check if error is rate limiting (429)
        if (result.statusCode === 429 && result.retryAfter) {
          setRateLimitInfo({ retryAfter: result.retryAfter })
          // Don't show toast - countdown component will display the message
        } else {
          toast.error(result.error || 'Login failed')
        }
      }
    } catch (error) {
      toast.error('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCountdownExpired = () => {
    setRateLimitInfo(null)
    toast.success('You can try logging in again now')
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to KSP HQ</CardTitle>
          <CardDescription>
            Enter your credentials to access your dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Rate limit countdown */}
            {rateLimitInfo && (
              <RateLimitCountdown
                retryAfter={rateLimitInfo.retryAfter}
                onExpired={handleCountdownExpired}
              />
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || rateLimitInfo}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || rateLimitInfo}
              />
            </div>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <p className="font-semibold mb-1">Default Admin Account:</p>
              <p>Email: admin@ksphq.com</p>
              <p>Password: admin123</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || rateLimitInfo}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      <LoadingOverlay isOpen={isLoading} message="Logging in..." />
    </>
  )
}
