import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '@/services/authService'
import { hasPermission } from '@/lib/auth'

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAuthenticating: false,
  login: () => {},
  logout: () => {},
  signup: () => {},
  hasPermission: () => false,
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const navigate = useNavigate()

  // Initialize auth on mount - fetch current user from API
  useEffect(() => {
    async function initAuth() {
      try {
        const userData = await authService.getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error('Auth init failed:', error)
        // Don't show error toast on init - user might not be logged in
      } finally {
        setIsLoading(false)
      }
    }
    initAuth()
  }, [])

  // Auto-refresh access token every 14 minutes (before 15min expiry)
  useEffect(() => {
    if (!user) return

    const interval = setInterval(
      async () => {
        try {
          const refreshedUser = await authService.refreshToken()
          setUser(refreshedUser)
        } catch (error) {
          console.error('Token refresh failed:', error)
          // If refresh fails, log user out
          await logout()
        }
      },
      14 * 60 * 1000
    ) // 14 minutes

    return () => clearInterval(interval)
  }, [user])

  // Idle timeout tracking
  useEffect(() => {
    if (!user) return

    const timeoutMinutes = user.idleTimeoutMinutes || 60
    let idleTimer

    function resetIdleTimer() {
      clearTimeout(idleTimer)

      // Track activity with API (debounced)
      // Silently fail on 401 errors (handled by global auth:unauthorized event)
      authService.trackActivity().catch((error) => {
        if (error.status !== 401) {
          console.error('Activity tracking failed:', error)
        }
      })

      idleTimer = setTimeout(
        () => {
          logout()
          toast.info('You were logged out due to inactivity')
        },
        timeoutMinutes * 60 * 1000
      )
    }

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((event) => {
      window.addEventListener(event, resetIdleTimer)
    })

    resetIdleTimer() // Start timer

    return () => {
      clearTimeout(idleTimer)
      events.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer)
      })
    }
  }, [user])

  // Handle 401 globally - redirect to login when unauthorized
  useEffect(() => {
    function handleUnauthorized() {
      setUser(null)
      navigate('/login')
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [navigate])

  const login = async (email, password) => {
    setIsAuthenticating(true)
    try {
      const userData = await authService.login(email, password)
      setUser(userData)

      // Check if password change is required
      if (userData.password_reset_required) {
        return { success: true, requiresPasswordChange: true }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: error.status,
        retryAfter: error.data?.error?.details?.retryAfter
      }
    } finally {
      setIsAuthenticating(false)
    }
  }

  const signup = async (email, password) => {
    setIsAuthenticating(true)
    try {
      const userData = await authService.signup(email, password)
      setUser(userData)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setIsAuthenticating(false)
    }
  }

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }, [])

  const updateUser = (userData) => {
    setUser(userData)
  }

  const checkPermission = (tool) => {
    if (!user) return false
    if (user.role === 'admin') return true
    return user.permissions?.[tool] === true
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthenticating,
        login,
        logout,
        signup,
        updateUser,
        hasPermission: checkPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
