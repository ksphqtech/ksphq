import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { CustomizeProvider } from '@/contexts/CustomizeContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Toaster } from '@/components/ui/toaster'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { BusinessInfoPage } from '@/pages/BusinessInfoPage'
import { UsersPage } from '@/pages/UsersPage'
import { PermissionsPage } from '@/pages/PermissionsPage'
import SettingsPage from '@/pages/SettingsPage'
import CustomizePage from '@/pages/CustomizePage'
import { WorkforceControl } from '@/pages/tools/WorkforceControl'
import { DockControl } from '@/pages/tools/DockControl'
import { ProjectControl } from '@/pages/tools/ProjectControl'
import { HQTickets } from '@/pages/tools/HQTickets'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/business-info"
        element={
          <ProtectedRoute>
            <BusinessInfoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/permissions"
        element={
          <ProtectedRoute>
            <PermissionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customize"
        element={
          <ProtectedRoute>
            <CustomizePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/workforce/*"
        element={
          <ProtectedRoute>
            <WorkforceControl />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/docks"
        element={
          <ProtectedRoute>
            <DockControl />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/projects"
        element={
          <ProtectedRoute>
            <ProjectControl />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/tickets"
        element={
          <ProtectedRoute>
            <HQTickets />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <ThemeProvider>
            <CustomizeProvider>
              <AppRoutes />
              <Toaster />
            </CustomizeProvider>
          </ThemeProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
