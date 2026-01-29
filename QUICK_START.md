# KSP HQ - Quick Reference Card

## 🚀 Start Development

```bash
npm run dev
```
Open: http://localhost:5173

## 🔐 Default Login

```
Email: admin@ksphq.com
Password: admin123
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main app with routing |
| `src/pages/DashboardPage.jsx` | Dashboard with tool tiles |
| `src/contexts/AuthContext.jsx` | Authentication logic |
| `src/contexts/ThemeContext.jsx` | Theme toggle |
| `src/lib/auth.js` | Auth utilities & RBAC |
| `src/data/mockData.js` | Sample data for tools |

## 🛠️ Available Tools

1. **Workforce Control™** - `/tools/workforce`
2. **Dock Control™** - `/tools/docks`
3. **Project Control™** - `/tools/projects`
4. **HQ Tickets™** - `/tools/tickets`

## 👥 User Roles

| Role | Access |
|------|--------|
| **Admin** | All tools + user/permission management |
| **Manager** | All tools + view users |
| **User** | Tool access based on permissions |

## 🎨 Customization

### Add New Tool
1. Create page in `src/pages/tools/YourTool.jsx`
2. Add route in `src/App.jsx`
3. Add tile to `src/pages/DashboardPage.jsx`
4. Add mock data to `src/data/mockData.js`

### Change Theme Colors
Edit CSS variables in `src/index.css`:
```css
:root {
  --primary: 222.2 47.4% 11.2%;
  /* ... */
}
```

### Update Branding
Edit `src/components/layout/Header.jsx`:
```jsx
<h1 className="text-xl font-bold">Your Company</h1>
```

## 📦 Build for Production

```bash
npm run build    # Creates dist/ folder
npm run preview  # Preview production build
```

## 🌐 Deploy to Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist
```

Or connect Git repo to Cloudflare Pages:
- Build command: `npm run build`
- Output directory: `dist`

## 🔍 Testing Different Roles

### Create Test Users

1. Sign up with email
2. Open DevTools > Application > Local Storage
3. Edit `users` key → change `role` field
4. Refresh page

### Test Permissions

Edit user's `permissions` object:
```json
{
  "workforce": true,
  "docks": false,
  "projects": true,
  "tickets": true
}
```

## 🐛 Common Issues

### Port in Use
```bash
npm run dev -- --port 3000
```

### Clear All Data
Run in browser console:
```javascript
localStorage.clear()
location.reload()
```

### Dependencies Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📱 Responsive Testing

- **Mobile**: < 768px (hamburger menu)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

Use Chrome DevTools (Ctrl+Shift+M) to test.

## 🎯 Next Steps

✅ Run `npm run dev`
✅ Login with admin account
✅ Explore all 4 tools
✅ Toggle dark/light theme
✅ Test mobile responsiveness
✅ Create additional users
✅ Customize branding

## 📚 Documentation

- `README.md` - Project overview
- `SETUP.md` - Detailed setup guide
- `ARCHITECTURE.md` - Technical architecture
- This file - Quick reference

## 💡 Pro Tips

- Use `Ctrl+Shift+I` to open DevTools
- Check localStorage in Application tab
- Console logs show auth state changes
- Dark mode persists across sessions
- All routes are protected by auth guard

## 🔗 Useful Links

- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Vite Docs](https://vitejs.dev)
- [React Router](https://reactrouter.com)

---

**Need Help?** Check SETUP.md for troubleshooting!
