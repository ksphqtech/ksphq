# KSPHQ Development Workflow

## ⚠️ IMPORTANT: Production-Only Deployment

**This project uses production-only deployment - NO local development servers are used.**

All changes are made directly in the repository, committed, and deployed to production. There is no local dev server workflow.

## Deployment Architecture

- **Frontend**: Static site hosted on Cloudflare Pages
  - URL: https://ksphq.pages.dev
  - Auto-deploys on git push to GitHub

- **API**: Cloudflare Worker
  - URL: https://ksphq-auth-api.joshua-klimek.workers.dev
  - Deployed manually via `wrangler deploy`

- **Database**: Cloudflare D1 (Production)
  - Name: `ksphq-auth-db`
  - ID: `3997db28-748b-4f85-a4d4-303e1baa9e12`

## Standard Workflow for Making Changes

### 1. Make Code Changes
Edit files in your local repository as needed.

### 2. Frontend Changes (HTML/CSS/JS/React)
```bash
git add .
git commit -m "Description of changes"
git push origin main
```
Cloudflare Pages will automatically detect the push and deploy the frontend within 1-2 minutes.

### 3. API Changes (ksphq-auth-api)
After pushing code to GitHub:
```bash
cd ksphq-auth-api
wrangler deploy
```

### 4. Database Changes
Execute migrations against the production database:
```bash
wrangler d1 execute ksphq-auth-db --file=./src/db/migrations/FILENAME.sql
```

**Important**: NO `--local` flag - we work directly with production database.

### 5. Test Changes
Open https://ksphq.pages.dev in your browser and test the live site.

## Common Commands Reference

### API Deployment
```bash
cd ksphq-auth-api
wrangler deploy
```

### Database Operations
```bash
# Execute a migration
wrangler d1 execute ksphq-auth-db --file=./path/to/migration.sql

# Execute a single command
wrangler d1 execute ksphq-auth-db --command="SELECT * FROM users LIMIT 5"

# View database info
wrangler d1 info ksphq-auth-db
```

### Testing API Endpoints
```bash
# Example: Test login endpoint
curl -X POST https://ksphq-auth-api.joshua-klimek.workers.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

## What NOT to Do

❌ Do NOT run `npm run dev` - we don't use local dev servers
❌ Do NOT run `wrangler dev --local` - we deploy directly to production
❌ Do NOT use `http://localhost:5173` - use https://ksphq.pages.dev
❌ Do NOT use `http://localhost:8787` - use https://ksphq-auth-api.joshua-klimek.workers.dev
❌ Do NOT use `--local` flag with wrangler commands
❌ Do NOT create or use `.env.local` files

## Environment Configuration

- **Frontend**: Uses `.env.production` during build (handled by Cloudflare Pages)
- **API**: Configuration set in `wrangler.toml`
- **No local environment files needed**

## Typical Development Session

1. Identify what needs to change (frontend, API, or database)
2. Make the code changes locally
3. Commit changes: `git commit -m "descriptive message"`
4. Push to GitHub: `git push origin main`
5. If API changed: `cd ksphq-auth-api && wrangler deploy`
6. If database changed: `wrangler d1 execute ksphq-auth-db --file=./migration.sql`
7. Test on https://ksphq.pages.dev
8. Verify everything works in production

## Rollback Strategy

If a deployment causes issues:

- **Frontend**: Revert the commit and push again (triggers new deployment)
- **API**: Deploy previous version from git history
- **Database**: Migrations are one-way; plan carefully or prepare rollback scripts

## Monitoring & Debugging

- **Frontend logs**: Cloudflare Pages dashboard
- **API logs**: `wrangler tail ksphq-auth-api`
- **Database queries**: Use wrangler CLI to inspect data

## Key Principle

**Production is the development environment.** We work carefully, test thoroughly, and deploy confidently. This approach eliminates local/production environment inconsistencies.
