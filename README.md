# KSP HQ - Business Tools Platform

A modern, full-featured business tools platform built with React 18, Vite, Tailwind CSS, and shadcn/ui. This is a frontend-only development version with mock authentication and localStorage-based data persistence.

## Features

- **Authentication System**: Mock login/signup with localStorage persistence
- **Role-Based Access Control**: Three-tier system (Admin, Manager, User)
- **4 Business Tools**:
  - Workforce Control™ - Employee management
  - Dock Control™ - Dock operations tracking
  - Project Control™ - Project management
  - HQ Tickets™ - Support ticket system
- **Dark/Light Mode**: Fully implemented theme toggle
- **Responsive Design**: Mobile-first with hamburger navigation
- **Professional UI**: Clean, modern interface using shadcn/ui components

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- Lucide Icons
- Sonner (Toast notifications)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Default Admin Account

```
Email: admin@ksphq.com
Password: admin123
```

## Project Structure

```
ksphq/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Layout components (Header, SideNav, etc.)
│   │   ├── auth/            # Authentication forms
│   │   └── dashboard/       # Dashboard components
│   ├── pages/               # Page components
│   │   ├── tools/           # Tool pages
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   └── DashboardPage.jsx
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utility functions
│   ├── data/                # Mock data
│   └── App.jsx
├── public/
└── package.json
```

## User Roles & Permissions

### Admin
- Full access to all tools
- User management capabilities
- Permissions management

### Manager
- Access to all business tools
- Limited user management

### User
- Tool access based on assigned permissions
- No administrative capabilities

## Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## Deployment to Cloudflare Pages

1. Build the project:
```bash
npm run build
```

2. Deploy to Cloudflare Pages:
```bash
npx wrangler pages deploy dist
```

Or connect your Git repository to Cloudflare Pages for automatic deployments.

### Build Configuration for Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 18+

## Future Backend Integration

This frontend is designed to integrate with a Cloudflare Workers backend:

- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Authentication**: Cloudflare Workers with JWT
- **Multi-tenancy**: Tenant isolation at the worker level

## Mock Data

All data is currently stored in:
- `localStorage` - Users and authentication
- `src/data/mockData.js` - Tool sample data

## Development Notes

- This is a frontend-only development version
- Authentication uses plain text passwords (dev only)
- All data is stored in browser localStorage
- No actual backend API calls are made

## License

Proprietary - All rights reserved
