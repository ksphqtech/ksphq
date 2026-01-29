# KSP HQ - Architecture Documentation

Complete architectural overview of the KSP HQ Business Tools Platform.

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Data Flow](#data-flow)
5. [Authentication Flow](#authentication-flow)
6. [Component Architecture](#component-architecture)
7. [Routing Strategy](#routing-strategy)
8. [State Management](#state-management)
9. [Theming System](#theming-system)
10. [Responsive Design](#responsive-design)

## Overview

KSP HQ is a multi-tenant business tools platform built as a frontend-only development version. It features role-based access control, four business tool modules, and a modern, responsive UI.

### Core Principles

- **Component-based architecture**: Modular, reusable components
- **Context-driven state**: React Context API for global state
- **Mobile-first responsive**: Tailwind breakpoints for all screen sizes
- **Type-safe utilities**: Utility functions with consistent patterns
- **Accessibility**: ARIA labels and keyboard navigation support

## Technology Stack

### Core Framework
- **React 18.3.1**: UI library with hooks and context
- **Vite 5.1.4**: Build tool and dev server
- **React Router 6.22.0**: Client-side routing

### Styling
- **Tailwind CSS 3.4.1**: Utility-first CSS framework
- **PostCSS 8.4.35**: CSS processing
- **class-variance-authority**: Component variant management
- **tailwind-merge**: Tailwind class merging utility

### UI Components
- **@radix-ui**: Accessible component primitives
  - Avatar
  - Dropdown Menu
  - Separator
  - Toast
- **lucide-react 0.344.0**: Icon library
- **sonner 1.4.0**: Toast notifications

### Development Tools
- **@vitejs/plugin-react**: React fast refresh
- **Autoprefixer**: CSS vendor prefixing

## Project Structure

```
ksphq/
├── public/                          # Static assets
├── src/
│   ├── components/
│   │   ├── ui/                      # shadcn/ui base components
│   │   │   ├── avatar.jsx           # User avatar component
│   │   │   ├── badge.jsx            # Status badges
│   │   │   ├── button.jsx           # Button with variants
│   │   │   ├── card.jsx             # Card container
│   │   │   ├── dropdown-menu.jsx    # Dropdown menus
│   │   │   ├── input.jsx            # Form input
│   │   │   ├── separator.jsx        # Visual separator
│   │   │   ├── table.jsx            # Data tables
│   │   │   └── toaster.jsx          # Toast container
│   │   ├── layout/                  # Layout components
│   │   │   ├── Header.jsx           # App header (logo, theme, user menu)
│   │   │   ├── SideNav.jsx          # Navigation sidebar
│   │   │   ├── DashboardLayout.jsx  # Main layout wrapper
│   │   │   └── ToolLayout.jsx       # Tool page layout
│   │   ├── auth/                    # Authentication components
│   │   │   ├── LoginForm.jsx        # Login form
│   │   │   └── SignupForm.jsx       # Signup form
│   │   └── dashboard/               # Dashboard components
│   │       └── ToolTile.jsx         # Tool card on dashboard
│   ├── pages/                       # Page components (routes)
│   │   ├── tools/
│   │   │   ├── WorkforceControl.jsx # Employee management tool
│   │   │   ├── DockControl.jsx      # Dock operations tool
│   │   │   ├── ProjectControl.jsx   # Project management tool
│   │   │   └── HQTickets.jsx        # Support tickets tool
│   │   ├── LoginPage.jsx            # Login page
│   │   ├── SignupPage.jsx           # Signup page
│   │   └── DashboardPage.jsx        # Main dashboard
│   ├── contexts/                    # React Context providers
│   │   ├── AuthContext.jsx          # Authentication state & logic
│   │   └── ThemeContext.jsx         # Theme state & toggle
│   ├── hooks/                       # Custom React hooks
│   │   └── useLocalStorage.js       # localStorage hook
│   ├── lib/                         # Utility libraries
│   │   ├── auth.js                  # Auth utilities & RBAC
│   │   └── utils.js                 # General utilities (cn function)
│   ├── data/                        # Mock data
│   │   └── mockData.js              # Sample data for tools
│   ├── App.jsx                      # Root component with routing
│   ├── main.jsx                     # Application entry point
│   └── index.css                    # Global styles & Tailwind
├── components.json                  # shadcn/ui configuration
├── tailwind.config.js               # Tailwind configuration
├── postcss.config.js                # PostCSS configuration
├── vite.config.js                   # Vite configuration
├── jsconfig.json                    # JavaScript path aliases
├── package.json                     # Dependencies & scripts
├── .gitignore                       # Git ignore rules
├── README.md                        # Project overview
├── SETUP.md                         # Setup instructions
└── ARCHITECTURE.md                  # This file
```

## Data Flow

### Component Data Flow

```
User Action
    ↓
Component (UI)
    ↓
Context (useAuth/useTheme)
    ↓
Utility Functions (lib/auth.js)
    ↓
localStorage
    ↓
Context State Update
    ↓
Re-render Components
```

### Authentication Flow

```
1. User visits site
    ↓
2. AuthProvider checks localStorage for currentUser
    ↓
3a. If found → Set user state → Render protected routes
3b. If not found → Redirect to /login
    ↓
4. User submits login form
    ↓
5. validateCredentials() checks users in localStorage
    ↓
6a. Valid → setCurrentUser() → Navigate to /dashboard
6b. Invalid → Show error toast
```

## Authentication Flow

### User Roles

```javascript
ROLES = {
  ADMIN: 'admin',      // Full access + user management
  MANAGER: 'manager',  // All tools + limited user management
  USER: 'user'         // Tool access based on permissions
}
```

### User Object Structure

```javascript
{
  id: "uuid",
  email: "user@example.com",
  password: "plaintext",  // Dev only - will be hashed in production
  role: "admin" | "manager" | "user",
  permissions: {
    workforce: boolean,
    docks: boolean,
    projects: boolean,
    tickets: boolean
  },
  createdAt: "ISO 8601 timestamp"
}
```

### Permission Check Flow

```javascript
// In components:
const { hasPermission } = useAuth()
const canAccess = hasPermission('workforce')

// Implementation:
hasPermission(tool) {
  if (user.role === 'admin') return true  // Admins have all access
  return user.permissions[tool] === true
}
```

## Component Architecture

### Layout Hierarchy

```
App
├── BrowserRouter
    ├── AuthProvider (provides: user, login, logout, hasPermission)
        ├── ThemeProvider (provides: theme, toggleTheme)
            ├── Routes
            │   ├── PublicRoute (redirects to /dashboard if authenticated)
            │   │   ├── LoginPage
            │   │   └── SignupPage
            │   └── ProtectedRoute (redirects to /login if not authenticated)
            │       ├── DashboardLayout
            │       │   ├── Header
            │       │   ├── SideNav
            │       │   └── DashboardPage
            │       └── ToolLayout
            │           ├── Header
            │           ├── SideNav
            │           └── Tool Pages
            └── Toaster (global toast notifications)
```

### Component Responsibilities

#### Layout Components

**Header.jsx**
- Logo and branding
- Theme toggle button
- User menu dropdown
- Logout functionality

**SideNav.jsx**
- Navigation links
- Hamburger menu for mobile
- Role-based link visibility
- Active route highlighting

**DashboardLayout.jsx**
- Wraps Header + SideNav + children
- Provides consistent page structure

**ToolLayout.jsx**
- Extends DashboardLayout
- Adds "Back to Dashboard" button
- Tool-specific header

#### Page Components

**DashboardPage.jsx**
- Grid of ToolTile components
- Role-based access messaging
- Welcome message

**Tool Pages**
- Statistics cards
- Data tables with sample data
- Consistent layout via ToolLayout
- Badge variants for status/priority

### Component Patterns

#### Composition Pattern
```jsx
<DashboardLayout>
  <Header />
  <SideNav />
  <main>{children}</main>
</DashboardLayout>
```

#### Context Consumer Pattern
```jsx
const { user, hasPermission } = useAuth()
const { theme, toggleTheme } = useTheme()
```

#### Protected Route Pattern
```jsx
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" />
}
```

## Routing Strategy

### Route Structure

```javascript
/ → Navigate to /dashboard
/login → LoginPage (public)
/signup → SignupPage (public)
/dashboard → DashboardPage (protected)
/tools/workforce → WorkforceControl (protected)
/tools/docks → DockControl (protected)
/tools/projects → ProjectControl (protected)
/tools/tickets → HQTickets (protected)
* → Navigate to /dashboard (catch-all)
```

### Route Guards

**PublicRoute**: Redirects authenticated users to dashboard
**ProtectedRoute**: Redirects unauthenticated users to login

### Navigation Methods

```javascript
// Declarative
<Link to="/dashboard">Dashboard</Link>

// Programmatic
const navigate = useNavigate()
navigate('/dashboard')

// With replace
<Navigate to="/login" replace />
```

## State Management

### Context API Usage

#### AuthContext

**State:**
```javascript
{
  user: User | null,
  isAuthenticated: boolean,
  login: (email, password) => { success, error },
  logout: () => void,
  signup: (email, password, role) => { success, error },
  hasPermission: (tool) => boolean
}
```

**Storage:**
- `localStorage.users`: Array of all users
- `localStorage.currentUser`: Currently logged in user

#### ThemeContext

**State:**
```javascript
{
  theme: 'light' | 'dark',
  toggleTheme: () => void
}
```

**Storage:**
- `localStorage.theme`: Current theme preference

### Local State

Components use `useState` for:
- Form inputs
- Loading states
- UI toggles (mobile menu, dropdowns)

## Theming System

### Tailwind Dark Mode

Configuration in `tailwind.config.js`:
```javascript
darkMode: ['class']  // Uses class-based dark mode
```

### CSS Variables

Theme colors defined in `src/index.css`:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... more colors */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... more colors */
}
```

### Theme Toggle Implementation

```javascript
// ThemeContext.jsx
useEffect(() => {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
  localStorage.setItem('theme', theme)
}, [theme])
```

### Using Theme in Components

```jsx
// Automatic with Tailwind variants
<div className="bg-background text-foreground dark:bg-gray-900">

// Access theme context
const { theme, toggleTheme } = useTheme()
```

## Responsive Design

### Breakpoint Strategy

Tailwind breakpoints (mobile-first):
```javascript
sm: '640px'   // Small devices
md: '768px'   // Tablets
lg: '1024px'  // Laptops
xl: '1280px'  // Desktops
2xl: '1536px' // Large screens
```

### Responsive Patterns

#### Side Navigation
```jsx
// Mobile: Hidden by default, overlay when open
<aside className={cn(
  'fixed ... transition-transform md:translate-x-0',
  isOpen ? 'translate-x-0' : '-translate-x-full'
)}>

// Desktop: Always visible
<div className="hidden md:block w-64" />
```

#### Tool Grid
```jsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
  {/* 1 column mobile, 2 columns tablet+ */}
</div>
```

#### Header Elements
```jsx
<span className="hidden md:inline-block">
  {/* Hide on mobile, show on desktop */}
</span>
```

#### Tables
```jsx
<div className="relative w-full overflow-auto">
  {/* Horizontal scroll on small screens */}
  <table />
</div>
```

### Mobile-Specific Features

- Hamburger menu with overlay
- Touch-friendly button sizes (h-10, h-9)
- Compact padding on mobile (p-4 md:p-6 lg:p-8)
- Hidden text labels on small screens

## Future Backend Integration

### Planned Architecture

```
Frontend (Current)
    ↓ API Calls
Cloudflare Workers (API Layer)
    ↓
├── D1 Database (SQLite)
│   ├── users table
│   ├── tenants table
│   └── business data tables
└── R2 Storage (File uploads)
```

### Migration Path

1. **Replace localStorage with API calls**
   - `lib/auth.js` → API service
   - Add fetch/axios calls
   - Handle async state

2. **Add tenant context**
   - Multi-tenant routing
   - Tenant-specific data isolation

3. **Implement JWT authentication**
   - Replace mock auth
   - Token refresh logic
   - Secure password hashing

4. **Environment configuration**
   - API base URLs
   - Feature flags
   - Environment variables

## Performance Considerations

### Code Splitting

Current: All routes loaded upfront
Future: Lazy load route components
```javascript
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
```

### Bundle Size

- Current build size: ~150KB gzipped
- Vite tree-shaking eliminates unused code
- Radix UI components are modular

### Optimization Opportunities

1. Image optimization (add vite-imagetools)
2. Route-based code splitting
3. Memoization for expensive calculations
4. Virtual scrolling for large tables

## Security Considerations

### Current (Dev Mode)

- Plain text passwords (localStorage)
- No CSRF protection
- No rate limiting
- Client-side only validation

### Production Requirements

- Bcrypt password hashing
- JWT with httpOnly cookies
- CSRF tokens
- Server-side validation
- Rate limiting
- Content Security Policy
- HTTPS only

## Testing Strategy (Future)

### Unit Tests
- Component rendering
- Utility functions
- Context logic

### Integration Tests
- Authentication flows
- Navigation
- Form submissions

### E2E Tests
- User journeys
- Tool interactions
- Responsive behavior

## Accessibility

### Current Implementation

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management
- Color contrast compliance

### Radix UI Benefits

- Built-in accessibility
- ARIA attributes
- Keyboard interactions
- Focus trapping

## Browser Compatibility

### Supported Browsers

- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓

### Polyfills Required

None - Modern browsers only

## Deployment

### Build Output

```bash
npm run build
# Output: dist/
# ├── assets/
# │   ├── index-[hash].js
# │   └── index-[hash].css
# └── index.html
```

### Cloudflare Pages Configuration

```yaml
Build command: npm run build
Build output: dist
Node version: 18
Environment variables: (none for frontend-only)
```

## Maintenance

### Adding New Tools

1. Create component in `src/pages/tools/`
2. Add route in `App.jsx`
3. Add tile to `DashboardPage.jsx`
4. Add permission key to auth system
5. Add mock data to `mockData.js`

### Updating UI Components

1. Modify base component in `src/components/ui/`
2. Update variant definitions if needed
3. Test in light and dark themes
4. Verify responsive behavior

### Adding New Roles

1. Update `ROLES` in `lib/auth.js`
2. Add default permissions
3. Update role badges in `Header.jsx`
4. Test RBAC logic

---

**Last Updated**: 2026-01-29
**Version**: 0.1.0
**Status**: Development
