// Auth utility functions

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
}

export const DEFAULT_PERMISSIONS = {
  admin: {
    workforce: true,
    docks: true,
    projects: true,
    tickets: true,
  },
  manager: {
    workforce: true,
    docks: true,
    projects: true,
    tickets: true,
  },
  user: {
    workforce: false,
    docks: false,
    projects: false,
    tickets: false,
  },
}

export const initializeUsers = () => {
  const users = localStorage.getItem('users')
  if (!users) {
    // Create default admin user
    const defaultAdmin = {
      id: crypto.randomUUID(),
      email: 'admin@ksphq.com',
      password: 'admin123',
      role: ROLES.ADMIN,
      permissions: DEFAULT_PERMISSIONS.admin,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('users', JSON.stringify([defaultAdmin]))
  }
}

export const getUsers = () => {
  const users = localStorage.getItem('users')
  return users ? JSON.parse(users) : []
}

export const saveUser = (user) => {
  const users = getUsers()
  users.push(user)
  localStorage.setItem('users', JSON.stringify(users))
}

export const updateUser = (userId, updates) => {
  const users = getUsers()
  const index = users.findIndex(u => u.id === userId)
  if (index !== -1) {
    users[index] = { ...users[index], ...updates }
    localStorage.setItem('users', JSON.stringify(users))
  }
}

export const findUserByEmail = (email) => {
  const users = getUsers()
  return users.find(u => u.email.toLowerCase() === email.toLowerCase())
}

export const validateCredentials = (email, password) => {
  const user = findUserByEmail(email)
  if (user && user.password === password) {
    return user
  }
  return null
}

export const getCurrentUser = () => {
  const currentUser = localStorage.getItem('currentUser')
  return currentUser ? JSON.parse(currentUser) : null
}

export const setCurrentUser = (user) => {
  localStorage.setItem('currentUser', JSON.stringify(user))
}

export const clearCurrentUser = () => {
  localStorage.removeItem('currentUser')
}

export const hasPermission = (user, tool) => {
  if (!user) return false
  if (user.role === ROLES.ADMIN) return true
  if (!user.permissions) return false
  return user.permissions[tool] === true
}
