# Infrastructure Overview

**Last Updated:** June 12, 2026
**Purpose:** How the system's infrastructure services work together — dependencies, data flow, and ops tasks
**Audience:** DevOps engineers and developers managing infrastructure changes

> **Also see:**
>
> - [Deployment Guide](./deployment.md) — step-by-step deploy walkthrough
> - [Environment Setup](../getting-started/environment-setup.md) — env var catalog
> - [Database Setup](../setup/database.md) — Prisma migrations, connection pooling
> - [Redis Setup](../setup/redis.md) — Redis configuration and troubleshooting

---

## Service Dependency Map

### Logical Architecture (What the System Needs)

```
┌──────────┐     HTTPS     ┌──────────────────────────────────────┐
│ Frontend │──────────────▶│            Backend                    │
│ (SPA)    │               │  ┌──────────┐  ┌──── SQL DB ───────┐ │
└──────────┘               │  │ Express   │  │ • Users, progress │ │
                           │  │ Server    │──│ • Quiz sessions   │ │
                           │  │ port 3001 │  │ • Gamification    │ │
                           │  └─────┬─────┘  └───────────────────┘ │
                           │        │                              │
                           │        ├───────── KV Cache ──────────┐│
                           │        │  • TTS audio (24h TTL)      ││
                           │        │  • AI feedback (24h TTL)    ││
                           │        │  • Quiz sessions (24h)      ││
                           │        │  • Due words (5min TTL)     ││
                           │        │  (optional — fail-open)     ││
                           │        └─────────────────────────────┘│
                           │        │                              │
                           │        ├── Ext. APIs ────────────────┐│
                           │        │  • TTS (audio generation)   ││
                           │        │  • LLM (text gen/AI)        ││
                           │        └─────────────────────────────┘│
                           │        │                              │
                           │        └── Blob Storage ─────────────┐│
                           │           • Cached audio/assets      ││
                           │           (via GcsFileStore)         ││
                           └──────────────────────────────────────┘
```

### Current Concrete Implementation

| Logical Role     | Current Provider     | Config Source                   | Swappable?                     |
| ---------------- | -------------------- | ------------------------------- | ------------------------------ |
| Frontend hosting | Vercel               | `vercel.json`                   | ✅ Any static host             |
| Backend runtime  | Railway              | `railway.toml`, `Procfile`      | ✅ Any Node host               |
| SQL Database     | Supabase PostgreSQL  | `DATABASE_URL` (Prisma ORM)     | ✅ Any SQL DB                  |
| KV Cache         | Railway Redis        | `REDIS_URL`                     | ✅ Any Redis                   |
| Blob Storage     | Google Cloud Storage | `GCS_BUCKET_NAME` + credentials | ⚠️ GcsFileStore adapter needed |
| TTS API          | Google Cloud TTS     | `GOOGLE_TTS_CREDENTIALS_RAW`    | ⚠️ New client adapter needed   |
| LLM / AI         | Google Gemini        | `GEMINI_API_CREDENTIALS_RAW`    | ⚠️ New client adapter needed   |

**Data Flow:**

1. Frontend → HTTPS → Backend (Express)
2. Backend → Prisma ORM → Any SQL database (currently PostgreSQL)
3. Backend → Redis (optional, fail-open)
4. Backend → External APIs (lazy-init, fail only on use)
5. Backend → Blob Storage (via `GcsFileStore` / `StorageFactory`)

### Local Development vs Cloud Deployment

| Aspect                   | Local (`NODE_ENV=development`)          | Cloud (`NODE_ENV=production`)                                   |
| ------------------------ | --------------------------------------- | --------------------------------------------------------------- |
| Database                 | Supabase dev branch URL in `.env.local` | Supabase prod branch (`DATABASE_URL` set in platform Dashboard) |
| Redis                    | Local or skipped (cache = no-op)        | Platform-managed (Railway auto-injects `REDIS_URL`)             |
| GCS credentials          | Same GCP service account JSON           | Same — stored in platform env vars                              |
| Google APIs (TTS/Gemini) | Same credentials, lazy-init             | Same                                                            |
| Env file                 | `.env.local` at project root            | Railway Dashboard → Variables                                   |
| File watching            | `node --watch` for hot reload           | `node` (no --watch, uses platform restart)                      |

---

## Multi-Storage & Multi-Cache Architecture

The backend supports multiple storage and cache endpoints through factory patterns — each module gets its own instance, not a shared singleton.

### Storage (`StorageFactory`)

Each module that needs blob storage creates its own `GcsFileStore` via `StorageFactory` in `container.js`:

```js
const ttsStorage = StorageFactory.create("tts", { bucket: config.gcsBucket });
const examplesStorage = StorageFactory.create("examples", { bucket: config.gcsBucket });
const vocabularyStorage = StorageFactory.create("vocabulary", { bucket: config.gcsBucket });
```

**What this enables:**

| Scenario                         | How                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------- |
| Same bucket, different prefix    | Instances auto-namespace under module name                                        |
| Different buckets per module     | Pass `{ bucket: "other-bucket" }` per call                                        |
| Different storage backend        | Swap `GcsFileStore` implementation behind same interface                          |
| Future: per-use-case GCS buckets | Each factory call can point to dedicated bucket (defined in `terraform/storage/`) |

### Cache (`CacheFactory`)

Cache instances are created with `CacheFactory.create(name, options)`:

```js
const cache = await CacheFactory.create("default");
const analyticsCache = await CacheFactory.create("analytics", { enabled: false });
```

**What this enables:**

| Scenario                   | How                                                        |
| -------------------------- | ---------------------------------------------------------- |
| Multi-namespace caching    | Each instance gets its own Redis key prefix (`mandarin:*`) |
| Selective disabling        | Pass `{ enabled: false }` per-instance                     |
| Separate Redis connections | Each instance could use different Redis if needed          |
| No-op fallback             | `CacheService` silently no-ops when Redis is unavailable   |

### Current Cache Usage by Module

| Module        | Cache Instance                   | Key Pattern                     | TTL  |
| ------------- | -------------------------------- | ------------------------------- | ---- |
| TTS           | `CacheFactory.create("default")` | `tts:{sha256(text+voice)}`      | 24h  |
| AI Feedback   | `withCache()` wrapper            | `ai_feedback:{wordId}:{answer}` | 24h  |
| Quiz Sessions | Quiz module's Redis              | `quiz_session:{userId}`         | 24h  |
| Due Words     | `withCache()` wrapper            | `due_words:{userId}`            | 5min |

---

## Terraform

**Location:** `terraform/`

Manages GCP resources only (not Railway/Vercel). Current modules:

| Module               | Files                                      | What it manages                                                                  |
| -------------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| **Storage**          | `terraform/storage/*.tf`                   | Per-use-case GCS buckets (TTS, vocabulary, examples, audio) with lifecycle rules |
| **Service Accounts** | `terraform/service-accounts/*.tf`          | Per-use-case GCP service accounts with least-privilege IAM                       |
| **Redis**            | `terraform/redis.tf`                       | GCP Memorystore Redis instance (optional — Railway provides its own Redis)       |
| **Monitoring**       | `terraform/conversation-infrastructure.tf` | TTS cost alert policy (stale — needs cleanup)                                    |

**State:** Check `terraform state list` to see what's provisioned.

```bash
# Quickstart
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Inspect current state
terraform state list
terraform state show 'google_storage_bucket.tts_cache'
```

**After changes:** Document in story/epic (what resource, why, rollback plan), commit `.tf` files.

---

## Database Migrations

> **Full guide:** [Database Setup Guide](../setup/database.md)

**Location:** `apps/backend/prisma/`

```bash
# Create a new migration (development)
npx prisma migrate dev --name <description>

# Apply pending migrations (production — runs automatically via Procfile release)
npx prisma migrate deploy

# Reset (WARNING: deletes all data)
npx prisma migrate reset
```

The `Procfile` has `release: npx prisma migrate deploy`, so migrations run automatically before every Railway deploy.

**Checklist:** ✓ Tested locally ✓ No data loss ✓ Rollback documented ✓ Story/epic updated

---

## CI/CD

**Location:** `.github/workflows/`

```bash
# Test locally with act
brew install act
act -j test
```

**Checklist:** ✓ YAML syntax valid ✓ Tested locally ✓ PR checks trigger

---

## Dependency Updates

```bash
# Audit
npm audit

# Update a single package
npm install --workspace=@mandarin/backend some-package@^2.0.0

# Test thoroughly after updating
npm run build && npm test
```

# Commit & push

git add package-lock.json
git commit -m "deps(scope): upgrade <package> to v<version>"

````

**Keep aligned:** typescript, vitest, shared packages same version across workspaces

**Checklist:** ✓ Changelog reviewed ✓ Tests pass ✓ Security audit clean ✓ Workspaces aligned

---

## Documentation Reference

When infrastructure changes are made, update corresponding documentation:

| Change Type        | Documentation to Update                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| New cloud resource | [Deployment Guide](deployment.md), [Environment Setup Guide](../getting-started/environment-setup.md)     |
| Database schema    | Prisma schema comments, migration files, affected story/epic docs                                         |
| Deployment process | [Deployment Guide](deployment.md), railway.toml comments                                                  |
| New env variable   | [Environment Setup Guide](../getting-started/environment-setup.md), `.env.example`                        |
| CI/CD workflow     | [Workflow](../operations/workflow.md) (Step 4), GitHub Actions inline comments                            |
| Tooling config     | [tooling-standards.md](../setup/tooling-standards.md), [Frontend Conventions](../conventions/frontend.md) |

---

## Quick Reference Commands

```bash
# Terraform
terraform plan -out=tfplan
terraform apply tfplan
terraform state list

# Database (see [Database Setup Guide](../setup/database.md) for full reference)
npm run db:migrate:deploy       # Apply pending migrations (production)

# Dependency Management
npm audit                       # Check vulnerabilities
npm update --workspace=<name>   # Update workspace
npm install --workspace=<name> <package>

# CI/CD Testing
act -j test                     # Run test job locally
act -j build-and-deploy         # Run full pipeline

# Environment Setup
npm run db:reset                # Full dev reset (DANGEROUS)
npm run dev:backend           # Backend dev server
npm run dev                      # Frontend dev server
````

---

## Key Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [Prisma Migration Docs](https://www.prisma.io/docs/orm/prisma-migrate/understand-prisma-migrate)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)
- [Railway Documentation](https://railway.app/docs)
- [npm Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [GitHub Actions](https://docs.github.com/en/actions)
