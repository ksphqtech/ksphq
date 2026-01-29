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

## Setup

### 1. Install Dependencies

```bash
cd ksphq-auth-api
npm install
```

### 2. Create D1 Databases

```bash
# Development database
wrangler d1 create ksphq-auth-db-dev

# Production database
wrangler d1 create ksphq-auth-db
```

Copy the database IDs and update `wrangler.toml`.

### 3. Run Migrations

```bash
# Development
wrangler d1 execute ksphq-auth-db-dev --local --file=./src/db/schema.sql

# Production (when ready to deploy)
wrangler d1 execute ksphq-auth-db --file=./src/db/schema.sql
```

### 4. Set Secrets

Generate random 256-bit secrets:

```bash
# Generate secrets (use output for next commands)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set secrets
wrangler secret put JWT_SECRET
# Paste first generated secret

wrangler secret put REFRESH_TOKEN_SECRET
# Paste second generated secret
```

### 5. Update Configuration

Edit `wrangler.toml`:
- Set your `account_id` (get from `wrangler whoami`)
- Set database IDs from step 2
- Update `FRONTEND_URL` for production

## Development

```bash
# Start local development server
npm run dev

# API will be available at http://localhost:8787
```

## Deployment

```bash
# Deploy to production
npm run deploy
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

Test endpoints with curl:

```bash
# Signup
curl -X POST http://localhost:8787/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}' \
  -c cookies.txt

# Login
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ksphq.com","password":"admin123"}' \
  -c cookies.txt

# Get user (with cookies)
curl http://localhost:8787/auth/user -b cookies.txt

# Logout
curl -X POST http://localhost:8787/auth/logout -b cookies.txt
```

## Database Management

```bash
# Query users
wrangler d1 execute ksphq-auth-db-dev --local \
  --command="SELECT id, email, role FROM users"

# Query audit logs
wrangler d1 execute ksphq-auth-db-dev --local \
  --command="SELECT user_id, action, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10"
```

## Security Notes

- All passwords are hashed with bcrypt (12 rounds)
- JWT tokens stored in httpOnly cookies (XSS-proof)
- CORS restricted to frontend domain
- Rate limiting on authentication endpoints
- All database queries use prepared statements
- Audit logging for all authentication events

## Troubleshooting

### Database not found
Make sure you've created the D1 databases and updated the IDs in `wrangler.toml`.

### Secrets not set
Run `wrangler secret put JWT_SECRET` and `wrangler secret put REFRESH_TOKEN_SECRET`.

### CORS errors
Check that `FRONTEND_URL` in `wrangler.toml` matches your frontend domain.
