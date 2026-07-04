# IaC Migration — Phase 1 Deployment Runbook

**Date:** 2026-07-04 | **Repo:** coji831/mandarin-vite-react-ts  
**Author:** AI Agent (Copilot DeepSeek Flash)  
**Status:** Phase 1 complete — all core infrastructure provisioned and verified

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Infrastructure Inventory](#2-infrastructure-inventory)
3. [Provisioning Order](#3-provisioning-order)
4. [Manual Click-Ops Checklist](#4-manual-click-ops-checklist)
5. [Struggles & Resolutions](#5-struggles--resolutions)
6. [Environment Variables Master List](#6-environment-variables-master-list)
7. [Seed Data Pipeline](#7-seed-data-pipeline)
8. [Disaster Recovery — Full Rebuild](#8-disaster-recovery--full-rebuild)
9. [Exit Strategy: Railway → Render](#9-exit-strategy-railway--render)

---

## 1. Architecture Overview

### Option B: Best-of-Breed (Current)

```
                    ┌──────────────────────────┐
                    │     Vercel               │
                    │  mandarin-vite-react-ts   │
                    │  React SPA + CDN         │
                    │  Terraform-managed       │
                    └──────────┬───────────────┘
                               │  VITE_API_URL auto-synced
                               │  via Railway→Vercel integration
                               ▼
                    ┌──────────────────────────┐
                    │      Railway             │
                    │  mandarin-vite-react-ts   │
                    │  Express 5 backend        │
                    │  Click-ops + railway.toml │
                    │  NO Terraform provider!  │
                    └──────────┬───────────────┘
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│      Neon         │ │     Upstash       │ │      GCP         │
│  serverless PG    │ │  Redis cache      │ │  GCS + TTS +     │
│  Terraform-managed│ │  Terraform-managed│ │  Gemini          │
│  ap-southeast-1   │ │  ap-southeast-1   │ │  Terraform-managed│
└──────────────────┘ └──────────────────┘ │  ASIA-SOUTHEAST1   │
                                          └──────────────────┘
```

### Key Design Decisions

| Decision                                            | Rationale                                                                                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Railway NOT in Terraform                            | Railway has no Terraform provider (native IaC is experimental v0, June 2026)                                                           |
| `VITE_API_URL` NOT in Terraform                     | Railway→Vercel integration auto-syncs it; avoids ENV_CONFLICT                                                                          |
| `VITE_API_URL = https://${{RAILWAY_PUBLIC_DOMAIN}}` | Railway reference variable — automatically resolves to correct domain for each environment (prod/preview)                              |
| GCS CORS: `origin: ["*"]`                           | GCS doesn't support `*.vercel.app` wildcard patterns                                                                                   |
| All resources in Singapore                          | Matches user's geographic proximity: Neon (ap-southeast-1), GCS (ASIA-SOUTHEAST1), Railway (asia-southeast1), Upstash (ap-southeast-1) |
| Shared DB across environments                       | Acceptable for single-user app; Neon branching planned for Phase 2                                                                     |

---

## 2. Infrastructure Inventory

### GCP Project: `pinyin-pal-831`

| Resource     | Name                                | Region            | IaC                             | Credentials                            |
| ------------ | ----------------------------------- | ----------------- | ------------------------------- | -------------------------------------- |
| GCS Bucket   | `pinyin-pal-data`                   | `ASIA-SOUTHEAST1` | `terraform/main.tf`             | SA: `gcs-storage-service`              |
| SA: TTS      | `tts-service`                       | Global            | `terraform/service-accounts.tf` | JSON key in `keys/tts-oneline.json`    |
| SA: Gemini   | `gemini-service`                    | Global            | `terraform/service-accounts.tf` | JSON key in `keys/gemini-oneline.json` |
| SA: GCS      | `gcs-storage-service`               | Global            | `terraform/service-accounts.tf` | JSON key in `keys/gcs-oneline.json`    |
| API: TTS     | `texttospeech.googleapis.com`       | —                 | `terraform/apis.tf`             | Enabled                                |
| API: Gemini  | `generativelanguage.googleapis.com` | —                 | `terraform/apis.tf`             | Enabled                                |
| API: Storage | `storage.googleapis.com`            | —                 | `terraform/apis.tf`             | Enabled                                |

### IAM Bindings

| Role                           | Member                    | Resource                                             |
| ------------------------------ | ------------------------- | ---------------------------------------------------- |
| `roles/cloudtexttospeech.user` | `tts-service@...`         | Project-level                                        |
| `roles/aiplatform.user`        | `gemini-service@...`      | Project-level                                        |
| `roles/storage.objectAdmin`    | `gcs-storage-service@...` | Bucket `pinyin-pal-data`                             |
| `roles/storage.objectViewer`   | `allUsers`                | Bucket `pinyin-pal-data` (public read for TTS audio) |

### Neon Project: `withered-king-06089521`

| Resource    | Value                                                               |
| ----------- | ------------------------------------------------------------------- |
| Database    | `neondb`                                                            |
| Host        | `ep-bitter-poetry-aog1282u.c-2.ap-southeast-1.aws.neon.tech`        |
| Pooled host | `ep-bitter-poetry-aog1282u-pooler.c-2.ap-southeast-1.aws.neon.tech` |

### Upstash Database: `pinyin-pal-cache`

| Resource | Value                                   |
| -------- | --------------------------------------- |
| Endpoint | `artistic-cattle-95444.upstash.io:6379` |
| Protocol | `rediss://` (TLS required)              |

### Vercel Project: `mandarin-vite-react-ts`

| Resource       | Value                                       |
| -------------- | ------------------------------------------- |
| Project ID     | `prj_N3G3440X8BvbV86E5E29njYPEF1x`          |
| Production URL | `https://mandarin-vite-react-ts.vercel.app` |

### Railway Project: `83025af1-4232-4ce1-97b9-ae25bf2d8ae2`

| Resource   | URL                                                        |
| ---------- | ---------------------------------------------------------- |
| Production | `https://mandarin-vite-react-ts-production.up.railway.app` |
| Preview    | `https://mandarin-vite-react-ts-preview.up.railway.app`    |

---

## 3. Provisioning Order

```
Step 1: GCP                    [Terraform init + apply]
  ├── Enable APIs (apis.tf)
  ├── Create SAs (service-accounts.tf)
  ├── Bind IAM roles (iam.tf)
  ├── Create GCS bucket (main.tf)
  ├─▶ Run terraform init
  └─▶ Run terraform apply
  └─▶ gcloud iam service-accounts keys create for each SA

Step 2: Upstash                [Terraform apply]
  ├── Create Redis database
  └─▶ Run terraform apply

Step 3: Neon                   [Terraform apply]
  ├── Create PostgreSQL project
  └─▶ Run terraform apply

Step 4: Vercel                 [Terraform apply]
  ├── Import existing project
  ├── Configure build/output/install
  ├── Set git_repository
  └─▶ Run terraform apply

Step 5: Railway                [Manual — click-ops]
  ├── Create project & service (Dashboard)
  ├── Connect GitHub repo
  ├── Set railway.toml (build/start/healthcheck)
  ├── Set all env vars
  ├── Create VITE_API_URL = https://${{RAILWAY_PUBLIC_DOMAIN}}
  ├── Connect Vercel integration (production + preview)
  └─▶ Deploy

Step 6: Railway→Vercel Sync   [Automatic]
  ├── VITE_API_URL auto-syncs to Vercel
  └─▶ Delete stale VITE_API_URL from Vercel Dashboard

Step 7: Seed Data              [Manual commands]
  ├── Prisma migrations (npx prisma migrate deploy)
  ├── Database seed (node prisma/seed.js)
  ├── GCS content upload (node scripts/upload-content-to-gcs.js)
  └─▶ Add test users in dev

Step 8: GCS CORS + Access      [Manual — gcloud]
  ├── gcloud storage buckets update --cors-file
  ├── gcloud storage buckets add-iam-policy-binding allUsers
  └─▶ gcloud storage buckets add-iam-policy-binding SA
```

---

## 4. Manual Click-Ops Checklist

Items that CANNOT be automated via Terraform.

### 4.1 Railway Dashboard

#### Service Settings

| Setting             | Value                                    | Location                    |
| ------------------- | ---------------------------------------- | --------------------------- |
| Service Source      | GitHub: `coji831/mandarin-vite-react-ts` | Service → Settings → Source |
| Branch              | `main`                                   | Service → Settings → Source |
| Root Directory      | `apps/backend`                           | Service → Settings          |
| Region              | `asia-southeast1-eqsg3a` (Singapore)     | Service → Settings → Region |
| Healthcheck Path    | `/api/v1/health`                         | Service → Settings          |
| Healthcheck Timeout | `300`                                    | Service → Settings          |

#### Environment Variables (14 vars)

Add these in **Service → Variables**:

| #   | Variable                     | Source                                             | Notes                             |
| --- | ---------------------------- | -------------------------------------------------- | --------------------------------- |
| 1   | `DATABASE_URL`               | `terraform output -raw neon_database_url_pooler`   | Use POOLED URL (with `-pooler`)   |
| 2   | `REDIS_URL`                  | `terraform output -raw upstash_redis_url`          | Must start with `rediss://`       |
| 3   | `GCS_BUCKET_NAME`            | `pinyin-pal-data`                                  | Hardcoded                         |
| 4   | `GCS_CREDENTIALS_RAW`        | `keys/gcs-oneline.json`                            | One-line JSON, entire file        |
| 5   | `GEMINI_API_CREDENTIALS_RAW` | `keys/gemini-oneline.json`                         | One-line JSON                     |
| 6   | `GOOGLE_TTS_CREDENTIALS_RAW` | `keys/tts-oneline.json`                            | One-line JSON                     |
| 7   | `JWT_SECRET`                 | `node -e "crypto.randomBytes(32).toString('hex')"` | Never reuse dev secrets           |
| 8   | `JWT_REFRESH_SECRET`         | Same command, different output                     | Must differ from JWT_SECRET       |
| 9   | `FRONTEND_URL`               | `https://mandarin-vite-react-ts.vercel.app`        | Hardcoded                         |
| 10  | `NODE_ENV`                   | `production`                                       | Hardcoded                         |
| 11  | `VITE_API_URL`               | `https://${{RAILWAY_PUBLIC_DOMAIN}}`               | **Reference variable** — crucial! |
| 12  | `GEMINI_MODEL`               | `models/gemini-3.1-flash-lite`                     | Optional (has default)            |
| 13  | `GEMINI_ENDPOINT`            | `https://generativelanguage.googleapis.com/v1beta` | Optional (has default)            |
| 14  | `CACHE_TTL_TTS`              | `86400`                                            | Optional (has default)            |

**⚠️ Important:** `PORT` should NOT be set. Railway automatically injects `PORT=8080`. Setting `PORT=3001` in Dashboard caused the 502 error.

#### Vercel Integration

1. Go to **Project → Settings → Integrations → Vercel**
2. Connect Railway project to Vercel project
3. Enable **production** sync
4. Enable **preview** sync (for PR environments)
5. Railway will now auto-sync `VITE_API_URL` (resolved from `${{RAILWAY_PUBLIC_DOMAIN}}`)

#### Project Token

1. Go to **Project → Settings → Tokens**
2. Create a project token scoped to `production` environment
3. Save for GitHub Actions CI/CD

### 4.2 Vercel Dashboard

| Action                             | Location                         | Notes                                      |
| ---------------------------------- | -------------------------------- | ------------------------------------------ |
| ✅ Verify Railway integration sync | Settings → Environment Variables | `VITE_API_URL` should appear automatically |
| ❌ **Delete** stale `VITE_API_URL` | Settings → Environment Variables | If manually set before integration         |
| ✅ Verify `RAILWAY_PUBLIC_DOMAIN`  | Settings → Environment Variables | Should appear in both Prod + Preview       |

### 4.3 GitHub Dashboard

**Settings → Secrets and Variables → Actions:**

| Name                         | Type     | Value                                           |
| ---------------------------- | -------- | ----------------------------------------------- |
| `NEON_API_KEY`               | Secret   | From Neon Dashboard                             |
| `NEON_PROJECT_ID`            | Variable | `withered-king-06089521`                        |
| `RAILWAY_API_TOKEN`          | Secret   | Account token from `railway.com/account/tokens` |
| `RAILWAY_PROJECT_ID`         | Variable | `83025af1-4232-4ce1-97b9-ae25bf2d8ae2`          |
| `RAILWAY_BACKEND_SERVICE_ID` | Variable | From Railway → Service → Settings               |
| `RAILWAY_PROJECT_TOKEN`      | Secret   | Project token from Railway                      |
| `VERCEL_TOKEN`               | Secret   | From `vercel.com/account/tokens`                |
| `VERCEL_PROJECT_ID`          | Variable | `prj_N3G3440X8BvbV86E5E29njYPEF1x`              |
| `UPSTASH_API_KEY`            | Secret   | From Upstash Dashboard                          |
| `UPSTASH_EMAIL`              | Secret   | Upstash login email                             |
| `GCP_SA_KEY`                 | Secret   | GCP service account key JSON (one-line format)  |

---

## 5. Struggles & Resolutions

### 🔴 5.1 Railway 502 Bad Gateway — Domain Target Port Mismatch

**Symptom:** All requests to Railway returned 502 in <5ms. Container logs showed server started correctly.

**Root Cause:** The Railway domain had a **custom target port of 3001** configured, but the app listened on `PORT` (8080, as injected by Railway). When `PORT` was removed from env vars, the domain still routed to port 3001.

**Fix:**

1. In Railway Dashboard → Service → Settings → Domains → edit the domain
2. **Clear the Target Port** (set to blank/auto)
3. OR set `PORT=8080` explicitly in Railway env vars (if you want explicit control)
4. Also added `app.listen(config.port, "0.0.0.0", ...)` per Railway docs requirement

**Prevention:** Never set custom target ports unless you have a specific reason. Railway's proxy + PORT env var should auto-match.

### 🔴 5.2 Railway→Vercel Integration — `VITE_API_URL` Not Syncing

**Symptom:** Railway environment variables were synced to Vercel, but `RAILWAY_PUBLIC_DOMAIN` (a Railway system variable) was not.

**Root Cause:** Railway's Vercel integration only syncs **custom user-defined variables**, not Railway system-provided variables like `RAILWAY_PUBLIC_DOMAIN`.

**Fix:** Create a custom reference variable: `VITE_API_URL = https://${{RAILWAY_PUBLIC_DOMAIN}}`. This is a custom variable that users defined, so it gets synced. The `${{}}` syntax resolves to the Railway-provided domain at runtime.

### 🔴 5.3 GCS CORS — ERR_BLOCKED_BY_ORB on TTS Audio

**Symptom:** Browser blocked TTS audio files from `storage.googleapis.com` with `ERR_BLOCKED_BY_ORB`.

**Root Cause:** The GCS bucket `pinyin-pal-data` had no CORS configuration. The `TtsController.getTtsAudio()` returns a direct GCS public URL (`https://storage.googleapis.com/pinyin-pal-data/tts/{hash}.mp3`), and the browser fetches this URL cross-origin.

**Fix:**

1. Add CORS to the GCS bucket: `origin: ["*"]`, `method: ["GET", "HEAD"]`
2. Note: GCS CORS does NOT support wildcard subdomains (`*.vercel.app`). Must use exact origins or `*`.
3. Added `google_storage_bucket.cors` block in Terraform
4. Applied via `gcloud storage buckets update` immediately

### 🔴 5.4 GCS 403 Forbidden — No Public Read Access

**Symptom:** Even after CORS fix, GCS URLs returned 403.

**Root Cause:** The bucket uses `uniform_bucket_level_access`, and no `allUsers` principal was granted read access. The `getPublicUrl()` method returns a URL that relies on the object being publicly readable.

**Fix:** Added `allUsers` with `roles/storage.objectViewer` on the bucket.

- `gcloud storage buckets add-iam-policy-binding gs://pinyin-pal-data --member=allUsers --role=roles/storage.objectViewer`
- Added `google_storage_bucket_iam_member.public_read` in Terraform

### 🟡 5.5 TTS API 403 — APIS NOT PROVISIONED

**Symptom:** TTS API calls returned 403 on fresh project.

**Root Cause:** The `texttospeech.googleapis.com` API wasn't enabled. Previous version was enabled manually in the old GCP project.

**Fix:** Enable via Terraform (`apis.tf`) or manually:

```
gcloud services enable texttospeech.googleapis.com
```

### 🟡 5.6 express-rate-limit Crashes with ERR_ERL_UNEXPECTED_X_FORWARDED_FOR

**Symptom:** Server logs showed `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` crash.

**Root Cause:** Railway's proxy sets `X-Forwarded-For` header, but Express has `trust proxy` disabled by default.

**Fix:** Added `app.set("trust proxy", 1)` after the Express app creation.

### 🟡 5.7 Database Seed Fails with ECONNREFUSED on Windows

**Symptom:** `node prisma/seed.js` fails with ECONNREFUSED even though the DATABASE_URL is correct. Raw `pg` queries work fine.

**Root Cause:** Incompatibility between pg's ESM export and Node.js on Windows when using `import pg from "pg"` with static ESM imports. The `@prisma/adapter-pg` adapter fails to connect in this scenario.

**Fix:** Use a workaround script that imports pg via `import()` dynamic import or use `import pkg from "pg"; const { Pool } = pkg;` pattern. The seed works correctly on Railway (Linux) without issues.

### 🟡 5.8 Terraform Provider Credentials — Interactive Prompt

**Symptom:** `terraform plan` prompts for `project_id`, `upstash.api_key`, `neon.api_key`, etc.

**Fix:** These must be set as environment variables:

```
TF_VAR_project_id=pinyin-pal-831
NEON_API_KEY=...
UPSTASH_API_KEY=...
VERCEL_API_TOKEN=...
```

Or use a `.tfvars` file (currently not tracked in the repo).

### 🟢 5.9 SPA Deep-Linking Returns 404

**Symptom:** Direct navigation to `/learn/radicals` returns 404 on Vercel.

**Root Cause:** `vercel.json` (which contained SPA rewrite rules) was deleted during the IaC migration as it was redundant with Terraform build config. But the SPA rewrite rules were NOT ported to Terraform.

**Fix:** Restore `vercel.json` with:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 🟢 5.10 Cross-Region Latency ~1s

**Symptom:** Health endpoint took ~1s. GCS calls felt slow.

**Root Cause:** GCS bucket was in `US-CENTRAL1` while all other resources (Neon, Upstash, Railway) were in Singapore (`ap-southeast-1`).

**Fix:** Recreated the bucket in `ASIA-SOUTHEAST1`. Note: GCS bucket names become re-usable almost immediately after deletion (tested successfully within seconds).

---

## 6. Environment Variables Master List

### Backend (14 vars — set in Railway)

| Variable                     | Required | Default                                            | Notes                     |
| ---------------------------- | -------- | -------------------------------------------------- | ------------------------- |
| `DATABASE_URL`               | **Yes**  | —                                                  | Neon pooled URL           |
| `REDIS_URL`                  | No       | —                                                  | Upstash `rediss://`       |
| `JWT_SECRET`                 | **Yes**  | —                                                  | 64-char hex               |
| `JWT_REFRESH_SECRET`         | **Yes**  | —                                                  | 64-char hex               |
| `FRONTEND_URL`               | No       | `http://localhost:5173`                            | For CORS                  |
| `GCS_BUCKET_NAME`            | **Yes**  | —                                                  | `pinyin-pal-data`         |
| `GCS_CREDENTIALS_RAW`        | **Yes**  | —                                                  | SA JSON (one-line)        |
| `GOOGLE_TTS_CREDENTIALS_RAW` | **Yes**  | —                                                  | SA JSON (one-line)        |
| `GEMINI_API_CREDENTIALS_RAW` | **Yes**  | —                                                  | SA JSON (one-line)        |
| `NODE_ENV`                   | No       | `development`                                      | `production` in Railway   |
| `PORT`                       | No       | `3001`                                             | Railway overrides to 8080 |
| `CACHE_TTL_TTS`              | No       | `86400`                                            | 24h                       |
| `GEMINI_MODEL`               | No       | `models/gemini-3.1-flash-lite`                     |                           |
| `GEMINI_ENDPOINT`            | No       | `https://generativelanguage.googleapis.com/v1beta` |                           |

### Frontend (1 var — auto-synced from Railway)

| Variable       | Set In         | Value                                |
| -------------- | -------------- | ------------------------------------ |
| `VITE_API_URL` | Railway→Vercel | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |

### Dead Variables (Removed)

The following variables existed in the old architecture and were removed:
`GCS_ENABLED`, `ENABLE_METRICS`, `ENABLE_DETAILED_LOGS`, `EXAMPLES_CACHE_HMAC_KEY`, `EXAMPLES_CACHE_HMAC_KEY_PREVIOUS`, `CONVERSATION_MODE`

---

## 7. Seed Data Pipeline

### 7.1 Database Seeding

```
Script: apps/backend/prisma/seed.js
Config: prisma.config.ts → prisma/schema.prisma
Run:    npx prisma db seed  (from apps/backend)
   OR:  node prisma/seed.js (with DATABASE_URL set)
```

**Seeds:**

- `ContentItem` — 38 rows from `content/manifest.json`
- `PinyinCombination` — 16 rows (hardcoded samples)
- `CharacterRadical` — 10 rows (hardcoded mappings)
- `User` — 2 dev users (`test@example.com`, `demo@example.com`) — skipped in production

**Cleanup:** Consolidated from 3 scripts → 1 (`seed.js`). Deleted `enable-phase2.js`, `seed-content-pipeline.js`, `seed-content-index.js`.

### 7.2 GCS Content Upload

```
Script: scripts/upload-content-to-gcs.js
Run:    node scripts/upload-content-to-gcs.js
Vars:   GCS_BUCKET_NAME, GCS_CREDENTIALS_RAW (from .env.local)
```

**Uploads 40 files:**

| Directory                        | Files          |
| -------------------------------- | -------------- |
| `characters/`                    | 3              |
| `pinyin/`                        | 10             |
| `radicals/`                      | 20             |
| `references/`                    | 2              |
| `tones/`                         | 5              |
| `chengyu/`, `grammar/`, `words/` | Empty (future) |

### 7.3 Prisma Migrations (10 applied)

```
npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma
```

Run via Railway's Procfile release phase:

```
release: npx prisma migrate deploy && npx prisma db seed
```

---

## 8. Disaster Recovery — Full Rebuild

If everything needs to be rebuilt from scratch:

### Phase 1: Terraform (infra)

```powershell
# 1. Run terraform init
cd terraform
$env:TF_VAR_project_id="pinyin-pal-831"
terraform init

# 2. Run Terraform apply
terraform apply

# 3. Generate keys for all 3 service accounts
gcloud iam service-accounts keys create keys/gcs-storage-service-key.json `
  --iam-account=gcs-storage-service@pinyin-pal-831.iam.gserviceaccount.com

gcloud iam service-accounts keys create keys/tts-service-key.json `
  --iam-account=tts-service@pinyin-pal-831.iam.gserviceaccount.com

gcloud iam service-accounts keys create keys/gemini-service-key.json `
  --iam-account=gemini-service@pinyin-pal-831.iam.gserviceaccount.com

# Convert each to one-line JSON for env vars (remove newlines)
# The contents of these files become GCS_CREDENTIALS_RAW,
# GOOGLE_TTS_CREDENTIALS_RAW, and GEMINI_API_CREDENTIALS_RAW respectively

# 4. Post-Terraform manual steps
gcloud storage buckets update gs://pinyin-pal-data --cors-file=cors.json
gcloud storage buckets add-iam-policy-binding gs://pinyin-pal-data --member=allUsers --role=roles/storage.objectViewer
gcloud storage buckets add-iam-policy-binding gs://pinyin-pal-data --member=serviceAccount:gcs-storage-service@pinyin-pal-831.iam.gserviceaccount.com --role=roles/storage.objectAdmin
```

### Phase 2: Railway (click-ops)

```powershell
# 1. Create project + service in Dashboard
# 2. Set all 14 env vars (from phase 4.1)
# 3. Set railway.toml (build + start + healthcheck)
# 4. Create VITE_API_URL = https://${{RAILWAY_PUBLIC_DOMAIN}}
# 5. Connect Vercel integration
```

### Phase 3: Seed

```powershell
# 1. Run migrations
npx prisma migrate deploy

# 2. Seed database
node apps/backend/prisma/seed.js

# 3. Upload to GCS
node scripts/upload-content-to-gcs.js

# 4. Verify everything works
#    Health endpoint
curl https://mandarin-vite-react-ts-production.up.railway.app/api/v1/health

#    Expected: { "status": "healthy", "services": { "gemini": true, "tts": true }, "cache": { "redis": { "connected": true } } }

#    Frontend loads
#    Visit https://mandarin-vite-react-ts.vercel.app

#    Login works
#    Test user: test@example.com / password123

#    TTS audio plays
#    Navigate to any quiz, verify audio plays

#    GCS CORS accessible
curl -H "Origin: https://mandarin-vite-react-ts.vercel.app" -I https://storage.googleapis.com/pinyin-pal-data/
#    Expected: Access-Control-Allow-Origin: *
```

> **Note:** See `verification-artifacts/migration/README.md` for the full verification checklist.

### Phase 4: Vercel

```powershell
# 1. Import project via Terraform
terraform import vercel_project.frontend prj_...

# 2. Before first apply: delete VITE_API_URL from Vercel Dashboard
# 3. Run Terraform
terraform apply

# 4. Verify Railway integration syncs VITE_API_URL
```

---

## 9. Exit Strategy: Railway → Render

### Why Migrate

| Factor                 | Railway                              | Render                             |
| ---------------------- | ------------------------------------ | ---------------------------------- |
| Terraform provider     | ❌ None                              | ✅ `render-oss/render` v1.0+       |
| CDN                    | ❌ Disabled (May 2026)               | ✅ Global CDN + Edge caching       |
| Free tier restrictions | ⚠️ Deploy blocked 8AM-8PM            | ✅ 750 free hours, no restrictions |
| Reliability            | ⚠️ "Repeated outages"                | ✅ 99.99% uptime SLA               |
| Managed DB + Redis     | ❌ Container templates               | ✅ Managed Postgres + Key Value    |
| IaC                    | `.railway/railway.ts` (experimental) | `render.yaml` Blueprints (stable)  |
| Pricing (1 vCPU/2GB)   | ~$40/mo (metered)                    | $25/mo (flat)                      |

### Migration Plan

| Current (Railway)          | Target (Render)                      |
| -------------------------- | ------------------------------------ |
| Railway Web Service        | `render_web_service`                 |
| `railway.toml`             | `render.yaml` Blueprints             |
| Railway-Vercel integration | Direct `VITE_API_URL` in Terraform   |
| Upstash Redis              | `render_key_value` (or keep Upstash) |
| 14 Railway env vars        | `render.yaml` envVars                |

**Backend code changes:** Zero. Same env var names, same build commands, same start commands.

**Full migration doc:** See `verification-artifacts/migration/README.md`

---

## Appendix A: Useful Commands

```powershell
# Get Terraform outputs
terraform -chdir=terraform output -raw neon_database_url_pooler
terraform -chdir=terraform output -raw upstash_redis_url

# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test health
curl https://mandarin-vite-react-ts-production.up.railway.app/api/v1/health

# Verify GCS CORS
gsutil cors get gs://pinyin-pal-data

# List GCS objects
gcloud storage ls gs://pinyin-pal-data/ --recursive

# Run seed
node apps/backend/prisma/seed.js

# Upload to GCS
node scripts/upload-content-to-gcs.js
```

## Appendix B: Key Files & Locations

| File                                                      | Purpose                                          |
| --------------------------------------------------------- | ------------------------------------------------ |
| `apps/backend/railway.toml`                               | Railway build/deploy/healthcheck config          |
| `apps/backend/prisma/seed.js`                             | Database seed (single entry point)               |
| `apps/backend/prisma.config.ts`                           | Prisma v7 config (seed command, datasource)      |
| `apps/backend/src/shared/config/index.ts`                 | Backend env var mapping + validation             |
| `apps/backend/src/app/index.ts`                           | Express setup: CORS, trust proxy, crash handlers |
| `apps/backend/src/app/container.ts`                       | DI composition root                              |
| `apps/backend/src/modules/health/api/HealthController.ts` | Health check (reports GCS, TTS, Gemini, Redis)   |
| `scripts/upload-content-to-gcs.js`                        | GCS content uploader                             |
| `terraform/main.tf`                                       | GCS bucket + IAM + CORS                          |
| `terraform/variables.tf`                                  | Variable definitions                             |
| `terraform/apis.tf`                                       | GCP API enablements                              |
| `terraform/iam.tf`                                        | IAM role bindings                                |
| `terraform/service-accounts.tf`                           | Service account definitions                      |
| `terraform/neon.tf`                                       | Neon project                                     |
| `terraform/upstash.tf`                                    | Upstash Redis                                    |
| `terraform/vercel.tf`                                     | Vercel project                                   |
| `keys/*.json`                                             | GCP SA keys (gitignored)                         |
| `.env.local`                                              | Local dev env vars (gitignored)                  |
