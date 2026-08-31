---
purpose: Step-by-step guide to deploy or add a new deployment environment
status: active
last-verified: 2026-08-25
type: guide
---

# Deployment Guide

**Last Updated:** August 25, 2026
**Purpose:** Step-by-step guide to deploy or add a new deployment environment
**Audience:** DevOps engineers and developers managing deployments

> **Prerequisites:**
>
> - [Infrastructure Overview](./infrastructure.md) — how the system services work together
> - [Environment Setup](../getting-started/environment-setup.md) — env var catalog and details

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Deployment Targets](#deployment-targets)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Preview (Staging) Deployment](#preview-staging-deployment)
5. [Production Deployment](#production-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback](#rollback)
8. [Troubleshooting](#troubleshooting)

---

## Deployment Overview

### Architecture (Current)

- **Frontend**: Vite React application → Vercel
- **Backend**: NestJS 11 API server (`node dist/nest/main.js`) → Railway
- **Database**: PostgreSQL → Neon PostgreSQL
- **Cache**: Redis → Upstash Redis
- **Storage**: Google Cloud Storage (TTS audio, examples)
- **External APIs**: Google TTS, Gemini AI

> This is the **current** deployment. Each component can be swapped independently — see [Infrastructure Overview](./infrastructure.md#current-concrete-implementation) for swappability notes.

### Deployment Environments

| Environment    | Frontend URL                        | Backend URL                                        | Purpose                        |
| -------------- | ----------------------------------- | -------------------------------------------------- | ------------------------------ |
| **Local Dev**  | `http://localhost:5173`             | `http://localhost:3001`                            | Development                    |
| **Preview**    | `*.vercel.app` (auto-generated)     | `*.up.railway.app` (preview branches)              | Testing, QA, stakeholder demos |
| **Production** | `mandarin-vite-react-ts.vercel.app` | `mandarin-vite-react-ts-production.up.railway.app` | Live user traffic              |

---

## Deployment Targets

### Frontend (Vercel)

**Repository:** GitHub repository connected to Vercel

**Build Settings:**

```bash
# Build Command
npm run build:frontend

# Output Directory
apps/frontend/dist

# Install Command
npm install
```

**Environment Variables (Vercel Dashboard):**

```env
VITE_API_URL=https://mandarin-vite-react-ts-production.up.railway.app  # Production
VITE_API_URL=https://your-backend-preview.up.railway.app  # Preview
```

For the full list of frontend env vars, see [Environment Setup](../getting-started/environment-setup.md).

**Automatic Deployments:**

- **Production:** Deploys on merge to `main` branch
- **Preview:** Deploys on pull request creation/update

### Backend (Railway)

**Repository:** GitHub repository connected to Railway

**Build Configuration:**

See the actual config in [`apps/backend/railway.toml`](../../../apps/backend/railway.toml) and [`apps/backend/Procfile`](../../../apps/backend/Procfile):

```toml
# railway.toml (current)
[build]
builder = "RAILPACK"
buildCommand = "npm install --include=dev && npx prisma generate --schema=apps/backend/prisma/schema.prisma && npm run build --workspace=@mandarin/shared-utils && npm run build --workspace=@mandarin/backend"

[deploy]
preDeployCommand = ["npm run db:migrate:deploy --workspace=@mandarin/backend"]
startCommand = "npm run start --workspace=@mandarin/backend"
healthcheckPath = "/api/v1/health"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
```

```procfile
# Procfile
web: npm run start
```

> **Notes on the current config:**
>
> - Railway (RAILPACK) runs the build command with cwd = the **repository root** (not `apps/backend`), so `npm install` runs at the root and the root `postinstall` builds `@mandarin/shared-utils` first.
> - `npm install --include=dev` guarantees `typescript`/`tsx` (devDependencies) are present even though `NODE_ENV=production` is set at build time — required by the `tsc` build steps (the Railway log confirms `tsc` runs during the root `postinstall`).
> - `npx prisma generate --schema=apps/backend/prisma/schema.prisma` — the root-relative `--schema` path is required because the build cwd is the repo root; a bare `npx prisma generate` there fails with `Could not find Prisma Schema`. The schema resolves via `apps/backend/prisma.config.ts` only when run from `apps/backend`.
> - `@mandarin/shared-utils` is built **before** the backend because the backend imports it at runtime (it ships compiled `dist/`, not raw `.ts`).
> - Prisma migrations run automatically on every deploy via `[deploy] preDeployCommand` — `npm run db:migrate:deploy --workspace=@mandarin/backend` (this replaces the former Procfile `release` phase). The workspace form is required because the deploy cwd is the repo root: npm workspace semantics run the script from `apps/backend`, where `prisma.config.ts` resolves the schema — a bare `npx prisma migrate deploy` at the root fails with `Could not find Prisma Schema`. If a migration fails, the deployment is blocked.
> - Database **seeding** is a one-time manual step (see the infrastructure runbook), **not** run on every deploy.

**Environment Variables (Railway Dashboard):**
Set all variables listed in [Environment Setup](../getting-started/environment-setup.md). `REDIS_URL` is set from Upstash in the Railway Dashboard. **`DATABASE_URL` must be set manually** pointing to your Neon PostgreSQL instance.

**Automatic Deployments:**

- **Production:** Deploys on merge to `main` branch
- **Preview:** Deploys on pull request creation (if enabled in Railway settings)

---

## Adapting to a Different Platform

The deployment is not locked to Railway. To deploy to a different platform:

### What to port

| Railway Feature               | What it maps to                                     | How to replicate elsewhere                                                                    |
| ----------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `railway.toml` build          | Install deps + build shared-utils + generate Prisma | Translate to platform's build config (e.g. `Dockerfile`, `app.yaml`)                          |
| `preDeployCommand`            | Pre-deploy migration step                           | Run `npm run db:migrate:deploy --workspace=@mandarin/backend` before starting the web process |
| `Procfile` web / startCommand | Start the server                                    | Run `node dist/nest/main.js` from `apps/backend/` (NestJS 11 production entry)                |
| PostgreSQL plugin             | `DATABASE_URL` injection                            | Set `DATABASE_URL` env var to your managed PostgreSQL                                         |
| Redis plugin                  | `REDIS_URL` injection                               | Set `REDIS_URL` env var to your managed Redis                                                 |
| Auto-injected `PORT`          | Runtime port assignment                             | Most platforms inject `PORT` — the server reads it from config                                |

### Example: Docker-based deployment

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY . .
RUN npm install && npx prisma generate --schema=apps/backend/prisma/schema.prisma
CMD ["node", "apps/backend/dist/nest/main.js"]
```

With a separate migration step:

```bash
# Run before starting the container
npm run db:migrate:deploy --workspace=@mandarin/backend
```

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing locally: `npm test`
- [ ] Type checking clean: frontend `npm run build` (`tsc -b`); backend `npm run typecheck --workspace=@mandarin/backend`
- [ ] Linting clean: `npm run lint` (frontend)
- [ ] No console errors in local dev environment
- [ ] No critical security vulnerabilities: `npm audit`

### Documentation

- [ ] README updated with new features/changes
- [ ] API documentation updated (if endpoints changed)
- [ ] Environment variable changes documented in `.env.example`
- [ ] Migration guide created (if breaking changes)

### Database

- [ ] Prisma migrations created: `npx prisma migrate dev`
- [ ] Migration tested locally
- [ ] Migration plan for production (if data-sensitive)
- [ ] Backup plan in place (for critical migrations)

### Feature Flags

- [ ] New features behind feature flags (if applicable)
- [ ] Feature flag configuration documented
- [ ] Rollback plan if feature causes issues

### External Services

- [ ] Google Cloud credentials updated (if changed)
- [ ] Redis connection tested
- [ ] Database connection tested
- [ ] GCS bucket permissions verified

---

## Preview (Staging) Deployment

### Purpose

Preview deployments allow testing changes in a production-like environment before merging to main.

### Trigger Preview Deployment

**Frontend (Vercel):**

1. Create pull request on GitHub
2. Vercel automatically builds and deploys preview
3. Preview URL appears in PR comments: `https://mandarin-vite-react-ts-<hash>.vercel.app`

**Backend (Railway):**

1. Enable PR deployments in Railway dashboard
2. Railway creates preview service for PR branch
3. Preview URL: `https://<project>-pr-<number>.up.railway.app` (see Railway dashboard)

### Update Preview Environment Variables

**Frontend (Vercel):**

- Navigate to Vercel Dashboard → Project → Settings → Environment Variables
- Set preview-specific variables (e.g., `VITE_API_URL` pointing to preview backend)

**Backend (Railway):**

- Navigate to Railway Dashboard → Project → Variables
- Scope variables to "Preview" environment
- Set preview-specific database, Redis, API keys

### Test Preview Deployment

1. **Smoke Test:** Visit preview URL, verify app loads
2. **Feature Test:** Test new feature/changes manually
3. **Integration Test:** Verify frontend ↔ backend communication
4. **External Services:** Test TTS, AI, database connectivity
5. **Performance:** Check response times, no errors in browser console

### Preview Cleanup

- Vercel automatically deletes preview deployments after PR merge/close (configurable)
- Railway preview deployments remain until manually deleted (optional cleanup)

---

## Production Deployment

### Step 1: Merge to Main

```bash
# After PR approval and preview testing
git checkout main
git pull origin main
git merge --no-ff <feature-branch>
git push origin main
```

### Step 2: Monitor Deployments

**Frontend (Vercel):**

1. Go to Vercel Dashboard → Deployments
2. Monitor build logs
3. Wait for "Ready" status
4. Check deployment URL: `https://mandarin-vite-react-ts.vercel.app`

**Backend (Railway):**

1. Go to Railway Dashboard → Deployments
2. Monitor build logs
3. Wait for health check to pass (`/api/v1/health` returns 200)
4. Check deployment URL: `https://mandarin-vite-react-ts-production.up.railway.app`

### Step 3: Run Database Migrations (if needed)

```bash
# Connect to Railway production environment
railway login
railway link <project-id>

# Run migrations
railway run npm run db:migrate:deploy --workspace=@mandarin/backend
```

**Critical Migrations:** For data-sensitive migrations:

1. Create database backup first
2. Test migration on staging database clone
3. Schedule maintenance window
4. Run migration during low-traffic period
5. Monitor for errors

### Backup Gate (before data-sensitive migrations)

The **backup gate** applies before any **data-sensitive migration** (a migration that moves, transforms, or drops data — **not** the additive-only pattern the NestJS release uses):

1. Take a **Neon backup** — console-side, manual (Neon → Branches/Backups), **documented, not automated**.
2. Verify the backup succeeded before running the migration.
3. Record it as a manual release check.

> Documented in [env-isolation](./env-isolation.md) (R6) — doc-only. The Epic 24 migration set (`20260821175536_add_srs_card_state`) is additive-only and does not trigger the backup gate, but the gate still applies to any future data-sensitive migration.

### Step 4: Verify Deployment

See [Post-Deployment Verification](#post-deployment-verification) section below.

---

## Post-Deployment Verification

**Automated post-deploy smoke:** the PR-env smoke script `apps/backend/scripts/pr-smoke.mjs` (invoked by `.github/workflows/preview.yml` on the PR URL) is also the post-rollback/post-deploy verification command against prod — `node apps/backend/scripts/pr-smoke.mjs <BASE_URL>` (see [Backend Rollback (Railway)](#backend-rollback-railway)). It asserts health + service booleans, auth register/login/refresh/me, the guest phase-gate shape, and a 4xx envelope.

### Health Checks

**Backend Health Endpoint:**

```bash
curl https://mandarin-vite-react-ts-production.up.railway.app/api/v1/health
```

Expected response:

```json
{
  "status": "healthy",
  "services": {
    "gemini": true,
    "tts": true
  },
  "cache": {
    "redis": {
      "connected": true
    }
  }
}
```

**Frontend Health:**

- Visit `https://mandarin-vite-react-ts.vercel.app`
- Verify homepage loads
- Check browser console for errors
- Test navigation between pages

### Feature Verification

- [ ] Login/registration works
- [ ] Quiz features functional
- [ ] TTS audio playback works
- [ ] Progress tracking updates correctly
- [ ] AI feedback generates correctly

### Performance Checks

- [ ] Homepage loads in <3 seconds
- [ ] API responses <500ms (p95)
- [ ] No 500 errors in logs
- [ ] Cache hit rate >50% (check health endpoint)

### Monitoring

**Vercel Monitoring:**

- Go to Vercel Dashboard → Analytics
- Check Core Web Vitals (LCP, FID, CLS)
- Monitor error rate

**Railway Monitoring:**

- Go to Railway Dashboard → Metrics
- Check CPU usage (<80%)
- Check memory usage (<80%)
- Monitor response times

**External Monitoring (Optional):**

- UptimeRobot: Ping health endpoint every 5 minutes
- Sentry: Monitor frontend errors
- LogRocket: Session replay for debugging

---

## Rollback

### Frontend Rollback (Vercel)

**Option 1: Instant Rollback (via Vercel Dashboard)**

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "Promote to Production"
4. Confirm rollback

**Option 2: Git Revert**

```bash
git revert <commit-hash>
git push origin main
# Vercel automatically deploys reverted code
```

### Backend Rollback (Railway)

Backend rollback is a **single-page note** (the former two-layer pinned-tag model + `docs/runbooks/backend-rollback.md` were **retired in 24-17**). Two options, no pinned tag, no rehearsal, no trigger table.

**Option 1 — Redeploy the previous Railway release (primary):**

1. Go to the **Railway dashboard → Deployments** for the backend service
2. Find the last known-good release (the one before the bad deploy)
3. Click **Redeploy** that release and confirm

**Option 2 — Git revert (fallback, if the previous release is unavailable or a code fix is preferable):**

```bash
git revert <bad-commit>      # add -m 1 if reverting a merge commit
git push origin main
# Railway automatically redeploys the reverted tree
```

**Retained invariants (always):**

- **Never roll back the migration set** — the Epic 24 migration (`20260821175536_add_srs_card_state`) is **additive-only**; no DDL is ever rolled back, and the schema always moves forward.
- **Verify with the post-rollback smoke against prod** after any rollback: `node apps/backend/scripts/pr-smoke.mjs <BASE_URL>` (see [Post-Deployment Verification](#post-deployment-verification)).

**Triage:** a **red prod smoke** is triaged as **env-diff** (config/secret drift — fix the config + redeploy, **no rollback**) vs **code-regression** (a bad deploy — **revert**), diffing against the green PR smoke from `preview.yml`.

### Database Migration Rollback

> **Note:** the Epic 24 migration set (`20260821175536_add_srs_card_state`) is additive-only and is **never** rolled back (see [Backend Rollback (Railway)](#backend-rollback-railway)); the generic guidance below applies only to a future data-sensitive migration, and is gated by the [backup gate](#backup-gate-before-data-sensitive-migrations).

**WARNING:** Database rollbacks are risky. Always backup first.

```bash
# Connect to Railway
railway link <project-id>

# Rollback last migration
railway run npx prisma migrate resolve --rolled-back <migration-name>

# Apply previous migration
railway run npm run db:migrate:deploy --workspace=@mandarin/backend
```

**Safer Alternative:** Deploy hotfix with migration repair:

1. Create new migration that reverts changes
2. Test on staging database
3. Deploy to production

---

## Environment-Specific Configurations

### Environment Variables

**Frontend (.env.production):**

```env
VITE_API_URL=https://mandarin-vite-react-ts-production.up.railway.app
```

**Backend (Railway Production):**

```env
# Database (Railway auto-injects when PostgreSQL plugin is attached)
DATABASE_URL=postgresql://user:pass@provider:5432/mandarin_prod

# Authentication
JWT_SECRET=<production-secret-32-chars>
JWT_REFRESH_SECRET=<production-refresh-secret-32-chars>

# Redis (from Upstash — set in Railway Dashboard)
REDIS_URL=redis://default:password@provider:6379
# CACHE_ENABLED — deprecated; cache is auto-enabled when REDIS_URL is present

# Server
# PORT — do NOT set; Railway injects 8080 automatically
# PORT=3001
NODE_ENV=production
# APP_ENV — do NOT set on prod (or set exactly `production`). The JwtService env
# claim defaults to `production`; any other value would break all prod token
# verification (issued tokens carry `env: APP_ENV`).
FRONTEND_URL=https://mandarin-vite-react-ts.vercel.app

# Google Cloud (mandatory for TTS/AI/GCS features)
GOOGLE_TTS_CREDENTIALS_RAW='{"type":"service_account","project_id":"..."}'
GEMINI_API_CREDENTIALS_RAW='{"type":"service_account","project_id":"..."}'
GCS_BUCKET_NAME=pinyin-pal-data


# Optional
```

> **Full env var reference:** [Environment Setup Guide](../getting-started/environment-setup.md#environment-variable-catalog)

**Backend (Railway Preview):**

```env
# Same as production but with preview-specific values
DATABASE_URL=<preview-database-url>
FRONTEND_URL=https://mandarin-vite-react-ts-<hash>.vercel.app
NODE_ENV=preview
# APP_ENV=pr-<n> — set per-PR by preview.yml (the JwtService env claim)
```

### Security Best Practices

- [ ] All secrets stored in Railway/Vercel dashboards (never in git)
- [ ] Production secrets different from staging
- [ ] JWT secrets rotated every 90 days
- [ ] Database passwords rotated annually
- [ ] Service account keys rotated annually
- [ ] CORS configured for production domain only
- [ ] HTTPS enforced (Vercel/Railway handle this automatically)

---

## Troubleshooting

### Frontend Issues

**Symptom:** Blank page in production

**Causes & Solutions:**

1. **API URL mismatch:** Verify `VITE_API_URL` points to production backend
2. **Build errors:** Check Vercel build logs for errors
3. **Missing environment variables:** Verify all `VITE_*` variables set in Vercel dashboard

**Symptom:** CORS errors

**Solutions:**

1. Verify backend `FRONTEND_URL` matches production domain
2. Check CORS middleware configuration
3. Ensure `credentials: true` in both frontend and backend

### Backend Issues

**Symptom:** 500 errors on all endpoints

**Causes & Solutions:**

1. **Database connection failed:** Check `DATABASE_URL` in Railway dashboard
2. **Missing environment variables:** Check Railway logs for startup errors
3. **Migration not applied:** Run `railway run npm run db:migrate:deploy --workspace=@mandarin/backend`

**Symptom:** Health check failing

**Solutions:**

1. Check Railway logs for startup errors
2. Verify Prisma client generated: `railway run npx prisma generate --schema=apps/backend/prisma/schema.prisma`
3. Check Redis connection if cache enabled

**Symptom:** Slow response times

**Solutions:**

1. Check Redis connection (cache misses = slow)
2. Verify database connection pooling enabled
3. Check Railway resource usage (may need to upgrade plan)
4. Review slow queries in logs

### Database Issues

**Symptom:** Migration failed

**Solutions:**

1. Check migration SQL for errors
2. Verify database schema state
3. Manually fix schema if needed
4. Mark migration as resolved: `railway run npx prisma migrate resolve --applied <migration-name>`

**Symptom:** Connection pool exhausted

**Solutions:**

1. Use `DIRECT_URL` for migrations
2. Increase connection pool size in PostgreSQL (Railway or other provider)
3. Review connection leaks in code

---

## Additional Resources

- [Backend Development Guide](../setup/backend-development.md) - Backend setup and architecture
- [Environment Setup Guide](../getting-started/environment-setup.md) - Environment variable reference
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Prisma Migrations](https://www.prisma.io/docs/guides/migrate)

---

## Appendix: Story 16.3 Example Caching Deployment

### Feature-Specific Requirements

The Example Caching feature (Story 16.3) requires additional deployment steps:

#### 1. GCS Service Account & Bucket

- Create service account: `examples-service@<project>.iam.gserviceaccount.com`.
- Grant IAM on bucket `pinyin-pal-data`:
  - `roles/storage.objectCreator` (for writes)
  - `roles/storage.objectViewer` (for reads)
- Disable public access and enable uniform bucket-level access.

#### 3. Redis ACL & Connection

- Use dedicated Redis user scoped to `examples:*` keyspace:
  ```
  ACL SETUSER examples_service on ><strong-password> ~examples:* +GET +SET +DEL +PEXPIRE
  ```
- Configure TLS for production Redis connections.

#### 4. Audit Logging

- Create BigQuery dataset: `mandarin_example_audit`
- Create Logging Sink with filter: `resource.type="gcs_bucket" AND logName~="cloudaudit"`
- Grant sink writer identity `roles/bigquery.dataEditor` on dataset.

#### 5. Post-Deploy Manual Checks

- [ ] Bucket `pinyin-pal-data` exists with 30-day lifecycle
- [ ] Service account IAM bindings limited to Creator/Viewer only
- [ ] Logging sink forwarding `cloudaudit` logs to BigQuery
- [ ] Redis connectivity verified with ACLs and TTLs applied

---

**Last Updated:** August 25, 2026
