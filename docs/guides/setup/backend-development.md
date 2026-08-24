---
purpose: "Complete guide for running the NestJS backend locally, understanding architecture, and following development best practices"
status: active
last-verified: 2026-08-22
type: guide
audience: backend
---

# Backend Development Guide

**Last Updated:** August 22, 2026  
**Purpose:** Complete guide for running the NestJS backend locally, understanding architecture, and following development best practices  
**Audience:** Developers setting up and working with the NestJS backend  
**Time to Complete:** 15-20 minutes initial setup

> **Purpose:** Complete guide for running the NestJS backend locally, understanding architecture, and following development best practices.

---

## Table of Contents

1. [Quick Start (10 Minutes)](#quick-start-10-minutes)
2. [Architecture Overview](#architecture-overview)
3. [NestJS Server Setup](#nestjs-server-setup)
4. [CORS & Authentication](#cors--authentication) → cross-ref
5. [Security Standards](#security-standards) → cross-ref
6. [Database Setup](#database-setup) → cross-ref
7. [Redis Caching](#redis-caching) → cross-ref
8. [Testing](#testing) → cross-ref
9. [Common Commands](#common-commands)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start (10 Minutes)

### Prerequisites

- **Completed:** [Frontend Quick Start](../getting-started/quickstart.md) (Node.js, npm, git, project cloned)
- **Google Cloud:** Dev-tier service account with TTS + Gemini + GCS access
- **Optional:** Redis instance (caching falls back gracefully if unavailable)

### Step 1: Configure Environment Variables

Create `.env.local` at **project root** (if you haven't already):

```bash
# Copy example file
cp .env.example .env.local
```

Edit `.env.local` with required variables. See **[Environment Setup Guide](../getting-started/environment-setup.md)** for the full catalog.

**Required at startup — the 7 fail-fast criticals (`validateConfig()` in `apps/backend/src/shared/config/index.ts` throws if any are missing):** `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GCS_BUCKET_NAME`, `GCS_CREDENTIALS_RAW`, `GOOGLE_TTS_CREDENTIALS_RAW`, `GEMINI_API_CREDENTIALS_RAW`.

```env
# Database (Neon)
DATABASE_URL="postgresql://user:password@pg.neon.tech/mandarin_dev?sslmode=require"

# Authentication
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="your-32-char-secret-here"
JWT_REFRESH_SECRET="your-other-32-char-secret-here"

# Google Cloud (dev-tier service account)
GOOGLE_TTS_CREDENTIALS_RAW='{"type":"service_account","project_id":"..."}'
GEMINI_API_CREDENTIALS_RAW='{"type":"service_account","project_id":"..."}'
GCS_CREDENTIALS_RAW='{"type":"service_account","project_id":"..."}'
GCS_BUCKET_NAME="your-dev-bucket-name"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Frontend API URL (Required for frontend services)
VITE_API_URL=http://localhost:3001
```

> **Full Environment Setup:** See [Environment Setup Guide](../getting-started/environment-setup.md) for Redis, Google Cloud services, and production configuration.

### Step 2: Initialize Database

```bash
# Run Prisma migrations to create tables
npx prisma migrate dev
```

**Verify:** Check your database — tables should exist now. See [Database Setup Guide](../setup/database.md) for the full model list and reset/seed commands.

### Step 3: Create Test Users

```bash
# From apps/backend
npm run db:seed
```

`npm run db:seed` creates test accounts needed for auth, quiz sessions, and any user-scoped feature. Without them, login endpoints return 401.

### Step 4: Start Backend Server

```bash
# From project root
npm run dev:backend

# Or from apps/backend
cd apps/backend
npm run dev
```

**✅ Backend is running at:** `http://localhost:3001`

### Step 5: Verify Backend Health

Open `http://localhost:3001/api/v1/health` or run:

```bash
curl http://localhost:3001/api/v1/health
```

> **Note:** The `/v1/` prefix is the API version. It may change with major API releases — check `packages/shared-constants` for the current `ROUTE_PATTERNS`.

You should see (or HTTP 200):

```json
{
  "status": "ok",
  "timestamp": "2026-06-12T12:00:00.000Z",
  "uptime": 123.45,
  "services": {
    "gemini": true,
    "tts": true
  },
  "cache": {
    "redis": {
      "connected": false
    }
  }
}
```

> **Health check design:** The endpoint returns `status: "ok"` with HTTP 200 when the server process is running. Individual service health (`gemini`, `tts`, `cache.redis.connected`) reflects whether each dependency responded to a ping. A `false` service does not block the health check — the server can be healthy even if a downstream dependency is unavailable.

---

## Architecture Overview

### NestJS Modulith (Epic 24)

Since **Epic 24 (completed 2026-08-22)** the backend is a **NestJS 11 modulith** on the Express platform adapter — the Express surface (`src/app/` + `modules/*/api/`) is deleted and Nest is the only production entry.

All source files are TypeScript (`.ts`). The `.js` extension in import paths refers to compiled output (Node.js ESM requires file extensions in imports).

```
apps/backend/
├── src/
│   ├── nest/                    # NestJS shell (production entry)
│   │   ├── main.ts              # Bootstrap — validateConfig() → NestFactory.create()
│   │   ├── app.module.ts        # Root module — registers all feature modules
│   │   ├── configure-app.ts     # CORS, cookie parsing, /api prefix, /api-docs, error bridge
│   │   ├── exception.filter.ts  # Global {code, message, requestId} error envelope
│   │   ├── guards/              # AuthGuard / OptionalAuthGuard / RequireAuthGuard
│   │   ├── rate-limit.config.ts # express-rate-limit configs (per-route)
│   │   └── request-id.middleware.ts
│   ├── modules/                 # Business modules (15) — each with:
│   │   ├── <name>/nest/         #   <name>.module.ts (@Module) + <name>-nest.controller.ts
│   │   ├── <name>/services/     #   business logic
│   │   ├── <name>/repositories/ #   Prisma access
│   │   ├── <name>/types/        #   typed interfaces (barrel)
│   │   └── <name>/__tests__/
│   └── shared/                  # Cross-cutting concerns
│       ├── config/index.ts      # Env config validation (fail-fast)
│       ├── infrastructure/      # External clients, cache, DB, security
│       └── utils/               # logger, errorFactory, dateUtils
├── prisma/
│   └── schema.prisma
└── tests/
    ├── integration/nest/        # Nest-only regression guards (ex-parity harnesses)
    └── unit/
```

### Key Concepts

1. **Shell** (`src/nest/`): `main.ts` validates config and boots `AppModule`; `configure-app.ts` reproduces the former Express middleware order (CORS once, cookie parsing, `/api` prefix, body-parser limits, error bridge last).
2. **Modules** (`src/modules/<name>/nest/`): each module declares its Nest `@Module` with controllers + `useFactory` providers, registered in `src/nest/app.module.ts`. Services/repositories are reused unchanged from the modulith.
3. **DI**: NestJS `@Module`/constructor injection replaces the deleted Express `container.ts` composition root. Shared infra is exposed via `SharedModule`/`DatabaseModule`.
4. **HTTP layer**: errors flow through the global `AppExceptionFilter` → `{code, message, requestId}` envelope; guards implement auth.

**Deep Dive:** See [Backend Architecture Patterns](../../knowledge-base/backend/backend-architecture.md) for layered architecture, dependency injection, and design patterns. **Authoritative reference:** [`apps/backend/README.md`](../../../apps/backend/README.md).

---

## NestJS Server Setup

**Key Configuration Points** ([apps/backend/src/nest/main.ts](../../../apps/backend/src/nest/main.ts) + [`app.module.ts`](../../../apps/backend/src/nest/app.module.ts)):

- `validateConfig()` runs **before** `NestFactory.create` — a missing critical env var crashes at boot (fail-fast preserved).
- The Express adapter (`NestFactory.create<NestExpressApplication>`) reproduces the former middleware order: CORS applied once, cookie-parser, `/api` prefix, body-parser limits, then the `AppExceptionFilter` error bridge mounted last.
- `/api-docs` (swagger-ui) + `/api-docs.json` are served from Nest (`configure-app.ts`).

**Critical Notes:**

- The global error filter emits the `{code, message, requestId}` envelope for every 4xx/5xx and logs each error with its requestId (parity with the retired Express `errorHandler.ts`).
- Prisma error codes are translated in the shared error-resolution helpers: `P2002` (unique violation → 409 Conflict), `P2025` (not found → 404 Not Found).
- Apply CORS **once only** at app level (duplicate CORS breaks authentication).

---

## CORS & Authentication

> **Complete Reference:** See [Frontend-Backend Integration Guide](../integrations/frontend-backend.md) for CORS configuration, cookie-based JWT flow, token refresh, and environment setup.
>
> **Common issues:** CORS errors, cookies not visible, proxy forwarding

---

## Security Standards

> **Security Standards:** See [Security Conventions](../conventions/security.md) for credential management, input validation, rate limiting, security headers, and audit logging.
>
> **JWT Flow:** See [Frontend-Backend Integration Guide](../integrations/frontend-backend.md) for cookie-based JWT authentication and token refresh lifecycle.

---

## Database Setup

> **Database Commands:** See [Database Setup Guide](../setup/database.md) for all Prisma migration, seed, and reset commands.
>
> **Quick ref:** `npm run db:migrate:deploy` (production migrations)

---

## Redis Caching

> **Redis Setup:** See [Redis Setup Guide](../setup/redis.md) for configuration options including local, Railway, and disabling Redis.
>
> **Caching Patterns:** See [Caching Patterns](../operations/caching-patterns.md) for app-specific cache key formats and invalidation strategies.

---

## Testing

> **Backend Tests:** See [Backend Testing Guide](../testing/backend.md) for Vitest configuration, test patterns, and CI setup.
>
> **Frontend Tests:** See [Frontend Testing Guide](../testing/frontend.md) for component and hook test patterns.

---

## Common Commands

```bash
# Development (apps/backend unless noted)
npm run dev:backend         # Start backend server (from project root → tsx watch src/nest/main.ts)
npm run dev                 # Start backend server (from apps/backend)
npm run build               # Compile (tsc -p tsconfig.build.json) + copy openapi.yaml
npm run start               # Run the production build (node dist/nest/main.js)

# Database
npm run db:migrate         # Run migrations (prisma migrate dev)
npm run db:generate        # Generate Prisma client
npm run db:seed            # Create test users (test@example.com / Test1234!)
npm run db:studio          # Open Prisma Studio (GUI)
npm run db:reset           # Reset database (WARNING: deletes data)

# Quality
npm run typecheck          # tsc --noEmit
npm run lint               # eslint

# Testing
npm run test               # Changed-scope tests (vitest run --changed)
npm run test:full          # Full unit suite (vitest run)
npm run test:integration   # Integration suite (vitest --config vitest.integration.config.ts)
npm run test:coverage      # Coverage report
```

> **Full script reference:** [`apps/backend/package.json`](../../../apps/backend/package.json) — the authoritative list (~50 scripts).

---

## Troubleshooting

> **Troubleshooting Guide:** See [Troubleshooting Guide](../operations/troubleshooting.md) for comprehensive debugging help (CORS, authentication, Redis, database, and native-module issues).

---

## Reference

### Official Documentation

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT.io](https://jwt.io/introduction) - JWT introduction

### Project Documentation

- [Backend README](../../../apps/backend/README.md) - Backend overview, deployment, and API endpoints (authoritative)
- [API Specification](../../../apps/backend/docs/api-spec.md) - Endpoint reference
- [Environment Setup Guide](../getting-started/environment-setup.md) — All environment variables
- [Redis Setup Guide](../setup/redis.md) — Redis caching and integration

### Knowledge Base

- [Backend Architecture Patterns](../../knowledge-base/backend/backend-architecture.md) - Layered architecture, DI, error handling
- [Authentication Concepts](../../knowledge-base/backend/backend-authentication.md) - OAuth, SSO, session strategies
- [PostgreSQL Setup & Migrations](../../knowledge-base/backend/backend-database-postgres.md) - Connection pooling, migrations
- [Caching Strategies](../../knowledge-base/infrastructure/integration-caching.md) - Redis patterns, cache-aside

---

**Last Updated:** August 22, 2026
