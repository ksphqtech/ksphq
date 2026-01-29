# Quick Start Guide - Test the Authentication System

Get up and running in 5 minutes to test the new authentication system locally.

## Prerequisites

- Node.js installed
- npm or pnpm installed

## Backend Setup (5 steps)

### 1. Install Wrangler globally

```bash
npm install -g wrangler
```

### 2. Navigate to backend directory

```bash
cd ksphq-auth-api
```

### 3. Install dependencies

```bash
npm install
```

### 4. Create development database (local)

```bash
# Create the database
wrangler d1 create ksphq-auth-db-dev

# Copy the database_id from the output
# Update wrangler.toml with the database_id
```

Edit `wrangler.toml` and replace `dev-database-id` with the ID from the output.

### 5. Run database migration

```bash
wrangler d1 execute ksphq-auth-db-dev --local --file=./src/db/schema.sql
```

This creates the tables and adds the default admin user.

### 6. Generate secrets

```bash
# Generate two random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Create a `.dev.vars` file in the `ksphq-auth-api` directory:

```env
JWT_SECRET=paste_first_secret_here
REFRESH_TOKEN_SECRET=paste_second_secret_here
```

### 7. Start the API server

```bash
npm run dev
```

The API should start at `http://localhost:8787`.

**Leave this terminal running.**

---

## Frontend Setup (2 steps)

Open a **new terminal window**.

### 1. Navigate to project root

```bash
cd ..  # Go back to ksphq directory
```

### 2. Start the frontend

```bash
npm run dev
```

The frontend should start at `http://localhost:5173`.

---

## Test It Out

### 1. Open your browser

Navigate to: `http://localhost:5173`

### 2. Login with default admin

- Email: `admin@ksphq.com`
- Password: `admin123`

### 3. You should see the dashboard

If you're logged in successfully, you'll be redirected to `/dashboard`.

### 4. Test signup

- Click "Sign up" or navigate to `/signup`
- Create a new account with:
  - Email: `test@example.com`
  - Password: `Test1234` (must meet requirements: 8+ chars, uppercase, lowercase, number)
- You should be automatically logged in

### 5. Test logout

- Click your avatar in the top-right
- Click "Logout"
- You should be redirected to `/login`

---

## Verify It's Working

### Check the database

```bash
cd ksphq-auth-api

# See all users
wrangler d1 execute ksphq-auth-db-dev --local \
  --command="SELECT id, email, role FROM users"

# See audit logs
wrangler d1 execute ksphq-auth-db-dev --local \
  --command="SELECT action, user_id, created_at FROM audit_logs ORDER BY created_at DESC"
```

You should see:
- 2 users (admin + your test user)
- Audit log entries for login, signup, logout

### Check the cookies

1. Open browser DevTools (F12)
2. Go to Application tab → Cookies → `http://localhost:5173`
3. You should see:
   - `access_token` (httpOnly: ✓, Secure: ✓)
   - `refresh_token` (httpOnly: ✓, Secure: ✓)

---

## Test Advanced Features

### Token Auto-Refresh

The access token expires in 15 minutes and auto-refreshes at 14 minutes.

1. Login
2. Wait 14+ minutes (or modify code to 1 minute for testing)
3. Check Network tab - you should see a POST to `/auth/refresh`

### Idle Timeout

Default is 60 minutes. To test quickly:

1. Login as admin
2. Go to Settings (once implemented) or modify `idle_timeout_minutes` in database:
   ```bash
   wrangler d1 execute ksphq-auth-db-dev --local \
     --command="UPDATE users SET idle_timeout_minutes = 1 WHERE email = 'admin@ksphq.com'"
   ```
3. Logout and login again
4. Don't interact with the page for 1 minute
5. You should be automatically logged out with a toast notification

### Rate Limiting

Try to login with wrong password 6 times quickly - you should get rate limited.

---

## Troubleshooting

### "Database not found"

Make sure you:
1. Ran `wrangler d1 create`
2. Updated `wrangler.toml` with the correct database ID
3. Ran the migration with `wrangler d1 execute ... --file=./src/db/schema.sql`

### "Cannot read property 'DB' of undefined"

Make sure the backend is running (`npm run dev` in `ksphq-auth-api` directory).

### "Network error" in frontend

1. Check backend is running at `http://localhost:8787`
2. Test with: `curl http://localhost:8787/health`
3. Check `.env.local` has `VITE_API_BASE_URL=http://localhost:8787`

### CORS errors

Make sure `wrangler.toml` has:
```toml
[env.development.vars]
FRONTEND_URL = "http://localhost:5173"
```

### No cookies set

Check browser console for errors. Make sure:
- Backend is running
- `.dev.vars` file exists with secrets
- Migration was run successfully

---

## Next Steps

Once you've verified everything works locally:

1. Read `SETUP_GUIDE.md` for production deployment
2. Change the default admin password
3. Configure your production environment variables
4. Deploy to Cloudflare Workers

---

## Quick Commands Reference

### Backend

```bash
# Start dev server
cd ksphq-auth-api && npm run dev

# Query database
wrangler d1 execute ksphq-auth-db-dev --local --command="SELECT * FROM users"

# View logs
wrangler tail  # (when deployed)
```

### Frontend

```bash
# Start dev server
npm run dev

# Build for production
npm run build
```

### Test API

```bash
# Health check
curl http://localhost:8787/health

# Login
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ksphq.com","password":"admin123"}' \
  -c cookies.txt

# Get user
curl http://localhost:8787/auth/user -b cookies.txt
```

---

**You're all set!** The authentication system is running locally and ready for testing. 🚀
