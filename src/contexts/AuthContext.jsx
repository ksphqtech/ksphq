import { createContext, useContext, useState, useEffect } from 'react'
import {
  initializeUsers,
  validateCredentials,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  saveUser,
  findUserByEmail,
  DEFAULT_PERMISSIONS,
  hasPermission,
} from '@/lib/auth'

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  signup: () => {},
  hasPermission: () => false,
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeUsers()
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
    setIsLoading(false)
  }, [])

  const login = (email, password) => {
    const validatedUser = validateCredentials(email, password)
    if (validatedUser) {
      setUser(validatedUser)
      setCurrentUser(validatedUser)
      return { success: true }
    }
    return { success: false, error: 'Invalid email or password' }
  }

  const signup = (email, password, role = 'user') => {
    const existingUser = findUserByEmail(email)
    if (existingUser) {
      return { success: false, error: 'User already exists' }
    }

    const newUser = {
      id: crypto.randomUUID(),
      email,
      password,
      role,
      permissions: DEFAULT_PERMISSIONS[role],
      createdAt: new Date().toISOString(),
    }

    saveUser(newUser)
    setUser(newUser)
    setCurrentUser(newUser)
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    clearCurrentUser()
  }

  const checkPermission = (tool) => {
    return hasPermission(user, tool)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        signup,
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
