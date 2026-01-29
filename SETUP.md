# KSP HQ - Setup Instructions

Complete setup guide for the KSP HQ Business Tools Platform.

## Repository

Clone from GitHub:
```bash
git clone https://github.com/ksphqtech/ksphq.git
cd ksphq
```

## Quick Start (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser to http://localhost:5173

# 4. Login with default admin account:
#    Email: admin@ksphq.com
#    Password: admin123
```

## Detailed Setup Instructions

### Step 1: Install Node.js

Ensure you have Node.js 18+ installed:

```bash
node --version  # Should show v18.x.x or higher
```

If not installed, download from: https://nodejs.org/

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages:
- React 18 & React DOM
- React Router DOM
- Tailwind CSS & PostCSS
- Radix UI components
- Lucide React icons
- Sonner for toasts
- Vite for development

### Step 3: Run Development Server

```bash
npm run dev
```

The application will start on `http://localhost:5173`

### Step 4: Login

Use the default admin account:
```
Email: admin@ksphq.com
Password: admin123
```

Or create a new user account via the signup page.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Testing Different User Roles

### Admin Account (Full Access)
```
Email: admin@ksphq.com
Password: admin123
```

### Create Manager Account
1. Sign up with a new email
2. User is created with "User" role by default
3. To test Manager/Admin roles, manually edit localStorage:
   - Open browser DevTools > Application > Local Storage
   - Find the "users" key
   - Edit the user's "role" field to "manager" or "admin"
   - Refresh the page

### Testing Permissions
Users with "user" role will see locked tools on the dashboard based on their permissions object.

## Theme Toggle

- Click the sun/moon icon in the header to switch between light and dark modes
- Theme preference persists in localStorage

## Mobile Testing

The application is fully responsive:
- Desktop: Full side navigation visible
- Mobile: Hamburger menu with overlay navigation

Test responsive design:
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select different device sizes

## Browser Support

Modern browsers with ES6+ support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Port Already in Use

If port 5173 is taken:
```bash
npm run dev -- --port 3000
```

### Dependencies Not Installing

Clear npm cache and retry:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

Ensure you're using Node 18+:
```bash
node --version
npm --version
```

### localStorage Not Persisting

Check browser privacy settings - ensure localStorage is enabled and not cleared on exit.

## Data Persistence

All data is stored in browser localStorage:

- `users` - Array of user accounts
- `currentUser` - Currently logged in user
- `theme` - Theme preference (light/dark)

To reset all data:
```javascript
// Run in browser console:
localStorage.clear()
location.reload()
```

## Next Steps

After setup, you can:

1. Explore the 4 business tools
2. Create additional user accounts with different roles
3. Test the responsive design on mobile
4. Customize the theme and styling
5. Prepare for backend integration

## Production Build

To build for production:

```bash
npm run build
```

Output will be in the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

## Cloudflare Pages Deployment

### Option 1: CLI Deployment

```bash
npm run build
npx wrangler pages deploy dist
```

### Option 2: Git Integration (Recommended)

1. Code is hosted at: https://github.com/ksphqtech/ksphq
2. Connect repository to Cloudflare Pages
3. Configure build settings:
   - Build command: `npm run build`
   - Build output: `dist`
   - Node version: 18+

## Development Tips

- Use React DevTools extension for debugging
- Check browser console for any errors
- Use the Network tab to verify no failed requests
- localStorage can be viewed in Application tab

## Support

For issues or questions, refer to:
- React documentation: https://react.dev
- Vite documentation: https://vitejs.dev
- Tailwind CSS: https://tailwindcss.com
- shadcn/ui: https://ui.shadcn.com
