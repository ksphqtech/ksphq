# Production Authentication System Setup Guide

This guide will walk you through setting up the complete production authentication system with Cloudflare Workers and D1.

## Overview

The implementation includes:
- **Backend**: Cloudflare Workers API with D1 SQLite database
- **Frontend**: React app with JWT cookie-based authentication
- **Features**: Signup, login, logout, token refresh, password change, audit logging, idle timeout

---

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **pnpm**
3. **Cloudflare account** (free tier works)
4. **Wrangler CLI** (Cloudflare Workers CLI)

---

## Part 1: Backend Setup (Cloudflare Workers)

### Step 1: Install Wrangler

```bash
npm install -g wrangler
```

### Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser to authenticate.

### Step 3: Get Your Account ID

```bash
wrangler whoami
```

Copy the account ID and update it in `ksphq-auth-api/wrangler.toml`:

```toml
account_id = "your-account-id-here"
```

### Step 4: Create D1 Databases

```bash
cd ksphq-auth-api

# Create production database
wrangler d1 create ksphq-auth-db

# Create development database
wrangler d1 create ksphq-auth-db-dev
```

**Copy the database IDs** from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "ksphq-auth-db"
database_id = "YOUR_PROD_DATABASE_ID_HERE"

[[env.development.d1_databases]]
binding = "DB"
database_name = "ksphq-auth-db-dev"
database_id = "YOUR_DEV_DATABASE_ID_HERE"
```

### Step 5: Install Dependencies

```bash
npm install
```

### Step 6: Run Database Migrations

```bash
# Development database (local)
wrangler d1 execute ksphq-auth-db-dev --local --file=./src/db/schema.sql

# Production database (when ready to deploy)
wrangler d1 execute ksphq-auth-db --file=./src/db/schema.sql
```

This creates the tables and seeds the default admin user.

### Step 7: Generate and Set Secrets

Generate two random 256-bit secrets for JWT signing:

```bash
# Generate secrets (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set the secrets in Wrangler:

```bash
# Set JWT_SECRET (paste first generated secret when prompted)
wrangler secret put JWT_SECRET

# Set REFRESH_TOKEN_SECRET (paste second generated secret when prompted)
wrangler secret put REFRESH_TOKEN_SECRET
```

For development environment:

```bash
wrangler secret put JWT_SECRET --env development
wrangler secret put REFRESH_TOKEN_SECRET --env development
```

### Step 8: Test Locally

```bash
npm run dev
```

The API will start at `http://localhost:8787`.

Test with curl:

```bash
# Login with default admin
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ksphq.com","password":"admin123"}' \
  -c cookies.txt

# Get user info
curl http://localhost:8787/auth/user -b cookies.txt
```

### Step 9: Deploy to Production

```bash
npm run deploy
```

Your API will be deployed to `https://ksphq-auth-api.<your-subdomain>.workers.dev`.

**Update the frontend environment variable** with this URL (or set up a custom domain).

---

## Part 2: Frontend Setup

### Step 1: Install Dependencies (if needed)

```bash
cd ..  # Back to ksphq directory
npm install
```

### Step 2: Configure Environment Variables

The `.env.local` file has been created for you:

```env
VITE_API_BASE_URL=http://localhost:8787
```

For production, update `.env.production`:

```env
VITE_API_BASE_URL=https://ksphq-auth-api.<your-subdomain>.workers.dev
```

Or use your custom domain.

### Step 3: Start Development Server

```bash
npm run dev
```

The frontend will start at `http://localhost:5173`.

### Step 4: Test Authentication Flow

1. Open `http://localhost:5173/login`
2. Login with default admin:
   - Email: `admin@ksphq.com`
   - Password: `admin123`
3. You should be redirected to `/dashboard`
4. Try creating a new account via signup
5. Test logout functionality

---

## Part 3: Verification & Testing

### Test Checklist

Run through this checklist to verify everything works:

- [ ] Backend API responds at health endpoint (`curl http://localhost:8787/health`)
- [ ] Can login with default admin credentials
- [ ] Login redirects to dashboard
- [ ] Logout clears session and redirects to login
- [ ] Signup creates new account successfully
- [ ] Duplicate email shows error on signup
- [ ] Invalid credentials show error on login
- [ ] Protected routes redirect to login when not authenticated
- [ ] Refresh page maintains logged-in state
- [ ] Token auto-refreshes (check browser dev tools Network tab after 14 minutes)
- [ ] Idle timeout works (set to 1 minute in settings for testing)
- [ ] User activity resets idle timer

### Database Verification

Check that data is being stored correctly:

```bash
cd ksphq-auth-api

# List users
wrangler d1 execute ksphq-auth-db-dev --local \
  --command="SELECT id, email, role, created_at FROM users"

# Check audit logs
wrangler d1 execute ksphq-auth-db-dev --local \
  --command="SELECT user_id, action, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10"

# Check refresh tokens
wrangler d1 execute ksphq-auth-db-dev --local \
  --command="SELECT user_id, created_at, expires_at, revoked_at FROM refresh_tokens"
```

### Security Verification

- [ ] Passwords are hashed in database (not plaintext)
- [ ] Cookies are httpOnly (check browser dev tools)
- [ ] Cookies have Secure flag
- [ ] CORS only allows your frontend domain
- [ ] Rate limiting blocks excessive login attempts (try 6 rapid logins)

---

## Part 4: Production Deployment

### Backend (Cloudflare Workers)

Already deployed via `npm run deploy` in Part 1, Step 9.

### Frontend (Cloudflare Pages)

If deploying to Cloudflare Pages:

1. Push code to GitHub/GitLab
2. Go to Cloudflare Dashboard > Pages
3. Create new project from your repository
4. Set build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Add environment variable:
   - `VITE_API_BASE_URL`: Your Workers API URL
6. Deploy

### Update CORS Settings

After deploying frontend, update `wrangler.toml`:

```toml
[vars]
FRONTEND_URL = "https://your-frontend-domain.pages.dev"
```

Redeploy the Workers API:

```bash
cd ksphq-auth-api
npm run deploy
```

---

## Part 5: Post-Deployment Tasks

### Change Default Admin Password

**CRITICAL**: Change the default admin password immediately!

1. Login as admin
2. Go to Settings
3. Change password to a strong password

Or via API:

```bash
curl -X PATCH https://your-api.workers.dev/auth/user/password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"currentPassword":"admin123","newPassword":"YourNewSecurePassword123"}'
```

### Configure Idle Timeout

Adjust the default idle timeout (currently 60 minutes):

1. Login as admin
2. Go to Settings
3. Update "Idle Timeout" setting

### Monitor Audit Logs

Check audit logs periodically for suspicious activity:

```bash
wrangler d1 execute ksphq-auth-db --command="
  SELECT action, user_id, ip_address, created_at
  FROM audit_logs
  ORDER BY created_at DESC
  LIMIT 50
"
```

---

## Troubleshooting

### "Database not found" error

- Verify database IDs in `wrangler.toml` match the ones from `wrangler d1 create`
- Make sure you ran migrations: `wrangler d1 execute ... --file=./src/db/schema.sql`

### "Invalid or expired token" on every request

- Verify JWT_SECRET is set: `wrangler secret list`
- Regenerate secrets if needed: `wrangler secret put JWT_SECRET`

### CORS errors in browser

- Check `FRONTEND_URL` in `wrangler.toml` matches your frontend domain
- Redeploy after changing: `npm run deploy`

### Cannot login with default admin

- Check database was seeded: `wrangler d1 execute ksphq-auth-db-dev --local --command="SELECT * FROM users"`
- If no users, re-run migration: `wrangler d1 execute ksphq-auth-db-dev --local --file=./src/db/schema.sql`

### Rate limiting blocking legitimate requests

- Rate limits are stored in-memory and reset when Workers restarts
- For production, consider using Cloudflare KV or Durable Objects for persistent rate limiting

---

## API Documentation

Full API documentation is available in the plan document. Quick reference:

### Public Endpoints
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token

### Protected Endpoints (require authentication)
- `GET /auth/user` - Get current user
- `PATCH /auth/user` - Update profile
- `PATCH /auth/user/password` - Change password
- `POST /auth/logout` - Logout
- `POST /auth/activity` - Track activity

---

## Additional Features to Implement

The current implementation covers core authentication. Future enhancements:

1. **Password reset via email** - Requires email service integration
2. **Two-factor authentication (2FA)** - TOTP or SMS verification
3. **Social login** - OAuth with Google, GitHub, etc.
4. **Session management** - View/revoke active sessions
5. **Admin user management API** - Create/update/delete users via API
6. **Email verification** - Verify email addresses on signup

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review backend logs: `wrangler tail` (shows real-time logs)
- Check frontend console for errors
- Verify database state with D1 queries

---

## Security Best Practices

1. **Never commit secrets** - `.env` files are in `.gitignore`
2. **Use strong passwords** - Enforce minimum requirements
3. **Monitor audit logs** - Regular security audits
4. **Keep dependencies updated** - `npm audit` and update packages
5. **Use HTTPS only** - Never deploy without SSL
6. **Rotate JWT secrets** - Periodically generate new secrets
7. **Limit token lifetime** - Current: 15min access, 7d refresh
8. **Implement rate limiting** - Protect against brute force attacks

---

## Success! 🎉

You now have a production-ready authentication system with:
- ✅ Secure JWT authentication with httpOnly cookies
- ✅ Password hashing with bcrypt
- ✅ Token refresh mechanism
- ✅ Idle timeout management
- ✅ Audit logging
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Production-grade database (D1)
- ✅ Edge computing (Cloudflare Workers)

Your application is ready for production use!
