# KSPHQ Authentication API

Production-ready authentication system using Cloudflare Workers and D1 database.

## Features

- JWT authentication with httpOnly cookies
- Password hashing with bcrypt (12 rounds)
- Token refresh mechanism
- Idle timeout management
- Audit logging
- Rate limiting
- CORS protection

## Production Database

**Database Name**: `ksphq-auth-db`
**Database ID**: `3997db28-748b-4f85-a4d4-303e1baa9e12`

The production D1 database is already configured in `wrangler.toml`.

## Deployment Workflow

This project uses a production-only deployment workflow. Changes are deployed directly to production.

### 1. Make Code Changes
Edit files in the `ksphq-auth-api` directory as needed.

### 2. Deploy to Production

```bash
cd ksphq-auth-api
wrangler deploy
```

The API will be available at: https://ksphq-auth-api.joshua-klimek.workers.dev

### 3. Database Migrations

Execute migrations against the production database:

```bash
# Run a migration file
wrangler d1 execute ksphq-auth-db --file=./src/db/migrations/FILENAME.sql

# Execute a single command
wrangler d1 execute ksphq-auth-db --command="SELECT * FROM users LIMIT 5"
```

### 4. Secrets Management

Secrets are already configured in production. If you need to update them:

```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update secret in production
wrangler secret put JWT_SECRET
wrangler secret put REFRESH_TOKEN_SECRET
```

## API Endpoints

### Public Endpoints

- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login with credentials
- `POST /auth/refresh` - Refresh access token

### Protected Endpoints (require authentication)

- `GET /auth/user` - Get current user
- `PATCH /auth/user` - Update user profile
- `PATCH /auth/user/password` - Change password
- `POST /auth/logout` - Logout and revoke tokens
- `POST /auth/activity` - Track user activity

### Health Check

- `GET /health` - API health status

## Default Admin Account

```
Email: admin@ksphq.com
Password: admin123
```

**IMPORTANT:** Change this password immediately after first login!

## Testing

Test endpoints in production with curl:

```bash
# Signup
curl -X POST https://ksphq-auth-api.joshua-klimek.workers.dev/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}' \
  -c cookies.txt

# Login
curl -X POST https://ksphq-auth-api.joshua-klimek.workers.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ksphq.com","password":"admin123"}' \
  -c cookies.txt

# Get user (with cookies)
curl https://ksphq-auth-api.joshua-klimek.workers.dev/auth/user -b cookies.txt

# Logout
curl -X POST https://ksphq-auth-api.joshua-klimek.workers.dev/auth/logout -b cookies.txt
```

Or test directly on the live frontend at: https://ksphq.pages.dev

## Database Management

```bash
# Query users
wrangler d1 execute ksphq-auth-db \
  --command="SELECT id, email, role FROM users"

# Query audit logs
wrangler d1 execute ksphq-auth-db \
  --command="SELECT user_id, action, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10"

# View database info
wrangler d1 info ksphq-auth-db
```

## Security Notes

- All passwords are hashed with bcrypt (12 rounds)
- JWT tokens stored in httpOnly cookies (XSS-proof)
- CORS restricted to frontend domain
- Rate limiting on authentication endpoints
- All database queries use prepared statements
- Audit logging for all authentication events

## Monitoring

```bash
# View live logs
wrangler tail ksphq-auth-api

# View deployment history
wrangler deployments list
```

## Troubleshooting

### Deployment fails
Check that you're authenticated: `wrangler whoami`
If not authenticated: `wrangler login`

### Secrets not set
Run `wrangler secret put JWT_SECRET` and `wrangler secret put REFRESH_TOKEN_SECRET`.

### CORS errors
Check that `FRONTEND_URL` in `wrangler.toml` is set to `https://ksphq.pages.dev`.
