---
name: deployment
description: Frontend and backend deployment to Vercel and Railway
status: inferred
source: "docs/architecture.md"
confidence: medium
type: deployment
---

# Deployment Workflow

<scan_confidence>medium</scan_confidence>

## Frontend Deployment (Vercel)

### Steps

1. **Automatic Deployment Trigger**
   - Trigger: Push to `main` branch
   - Build command: `npm run build --workspace=@mandarin/frontend`
   - Platform: Vercel
   <!-- INJECT: step-1-fe -->

2. **Pre-Deployment Verification**
   - All tests must pass: `npm test --workspace=@mandarin/frontend`
   - Type check must pass: `tsc --noEmit`
   - Lint must pass: `npm run lint`
   - Build must succeed locally: `npm run build --workspace=@mandarin/frontend`
   <!-- INJECT: step-2-fe -->

3. **Deployment Configuration**
   - Vercel auto-detects Vite configuration
   - Environment variables are configured in Vercel dashboard
   - Required vars:
     - `VITE_API_URL`: Backend API URL
     <!-- INJECT: step-3-fe -->

4. **Post-Deployment Verification**
   - Verify production site loads
   - Check API connectivity to backend
   - Test critical user flows
   <!-- INJECT: step-4-fe -->

## Backend Deployment (Railway)

### Steps

1. **Automatic Deployment Trigger**
   - Trigger: Push to `main` branch
   - Build command: Inferred from `package.json` and `Procfile`
   - Platform: Railway
   <!-- INJECT: step-1-be -->

2. **Pre-Deployment Verification**
   - All tests must pass: `npm test --workspace=@mandarin/backend`
   - Type check must pass: `tsc --noEmit`
   - Database migrations are current: `npm run db:migrate:deploy`
   - Environment variables are set
   <!-- INJECT: step-2-be -->

3. **Deployment Configuration**
   - Procfile: `web: node src/index.js`
   - Environment variables (in Railway dashboard):
     - `DATABASE_URL`: PostgreSQL connection string (Supabase)
     - `REDIS_URL`: Redis connection string (Upstash)
     - `JWT_SECRET`: Secret key for JWT signing
     - `JWT_REFRESH_SECRET`: Secret key for refresh tokens
     - `GOOGLE_TTS_CREDENTIALS_RAW`: Google Cloud service account JSON
     - `GOOGLE_CLOUD_STORAGE_BUCKET`: GCS bucket name
     - `GEMINI_API_KEY`: API key for Gemini
     - `NODE_ENV`: Set to `production`
     - `API_PORT`: Set to `3001`
     <!-- INJECT: step-3-be -->

4. **Database Migrations**
   - Production migrations auto-run before app starts
   - Command: `npm run db:migrate:deploy --workspace=@mandarin/backend`
   - Verify no data loss: Check schema changes match expected model
   <!-- INJECT: step-4-be -->

5. **Post-Deployment Verification**
   - Verify API is accessible at production URL
   - Check database connectivity
   - Test critical API endpoints
   - Verify Redis cache is operational
   - Monitor logs for errors
   <!-- INJECT: step-5-be -->

## Rollback Procedure

<!-- INJECT: step-6 -->

1. **Frontend Rollback**
   - Revert commit on main: `git revert <commit-hash>`
   - Push to main
   - Vercel auto-deploys previous version

2. **Backend Rollback**
   - Revert commit on main: `git revert <commit-hash>`
   - Push to main
   - Railway auto-deploys previous version
   - **Important**: Verify database migrations are reversible (down migration in Prisma)

<!-- INJECT: append-steps -->

---

## Related Documentation

- [Architecture Overview](../../docs/architecture.md)
- [Backend Setup Guide](../../docs/guides/backend-setup-guide.md)
