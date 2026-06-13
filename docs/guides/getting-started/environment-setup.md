# Environment Setup Guide

**Last Updated:** June 12, 2026  
**Purpose:** Single source of truth for all environment variables used by the system  
**Audience:** Developers setting up local development or configuring a new deployment

> **When to read this:** When setting up your local development for the first time, adding a new env var, or configuring a deployment environment.

## File Structure

```
mandarin-vite-react-ts/
├── .env.local          # Local development (gitignored) - SINGLE SOURCE FOR BOTH FRONTEND & BACKEND
├── .env.example        # Template for team (committed) - AT PROJECT ROOT
├── apps/
│   ├── frontend/       # Reads .env.local from root via Vite
│   └── backend/        # Reads .env.local from root via dotenv config
```

**Important**: This project uses a **single `.env.local` file at the project root** for both frontend and backend. The backend loads from root via `dotenv.config({ path: ... })` in `apps/backend/src/shared/config/index.js`.

---

## Environment Variable Catalog

| Variable                     | Required                                  | Source (file)                 | Validated at startup? | Since      |
| ---------------------------- | ----------------------------------------- | ----------------------------- | --------------------- | ---------- |
| `DATABASE_URL`               | ✅ **Mandatory**                          | `shared/config/index.js`      | ✅ `validateConfig()` | Epic 13    |
| `JWT_SECRET`                 | ✅ **Mandatory**                          | `shared/config/index.js`      | ✅ `validateConfig()` | Epic 13    |
| `JWT_REFRESH_SECRET`         | ✅ **Mandatory**                          | `shared/config/index.js`      | ✅ `validateConfig()` | Epic 13    |
| `GCS_BUCKET_NAME`            | ✅ **Mandatory**                          | `shared/config/index.js`      | ✅ `validateConfig()` | Epic 13    |
| `GOOGLE_TTS_CREDENTIALS_RAW` | ✅ **Mandatory**                          | `external/GoogleTTSClient.js` | ✅ `validateConfig()` | Epic 13    |
| `GEMINI_API_CREDENTIALS_RAW` | ✅ **Mandatory**                          | `external/GeminiClient.js`    | ✅ `validateConfig()` | Epic 13    |
| `REDIS_URL`                  | 🟡 Optional (cache auto-enabled when set) | `shared/config/index.js`      | ❌                    | Epic 13    |
| `FRONTEND_URL`               | 🟡 Optional (default: `localhost:5173`)   | `shared/config/index.js`      | ❌                    | Epic 13    |
| `EXAMPLES_CACHE_HMAC_KEY`    | 🟡 Optional                               | `shared/config/index.js`      | ❌                    | Story 16.3 |
| `PORT`                       | 🟡 Optional (default: `3001`)             | `shared/config/index.js`      | ❌                    | —          |
| `NODE_ENV`                   | 🟡 Optional (default: `development`)      | `shared/config/index.js`      | ❌                    | —          |
| `VITE_API_URL`               | ✅ **Mandatory (frontend)**               | Frontend services             | ❌                    | —          |
| `ENABLE_DETAILED_LOGS`       | 🟡 Optional                               | `shared/config/index.js`      | ❌                    | —          |

> `CACHE_ENABLED` has been **deprecated** — cache is now enabled automatically when `REDIS_URL` is present. Remove it from your env config.

**Legend:** ✅ = `validateConfig()` throws at startup if missing · 🟡 = has a safe default, server starts fine

**1. Copy example file (at project root):**

```bash
# From project root
cp .env.example .env.local
```

## Setup Steps

**1. Copy example file (at project root):**

```bash
# From project root
cp .env.example .env.local
```

**2. Fill in values (all ✅ Mandatory vars must be set):**

```env
# .env.local

# === DATABASE (Supabase dev branch) ===
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres

# === AUTHENTICATION ===
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-in-production
JWT_REFRESH_SECRET=your-jwt-refresh-secret-different-from-access-secret

# === GOOGLE CLOUD (required — dev-tier service account) ===
# Service account JSON must be a single-line escaped string
GOOGLE_TTS_CREDENTIALS_RAW='{"type":"service_account","project_id":"..."}'
GEMINI_API_CREDENTIALS_RAW='{"type":"service_account","project_id":"..."}'
GCS_BUCKET_NAME=your-bucket-name

# === SERVER ===
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# === FRONTEND ===
VITE_API_URL=http://localhost:3001

# === REDIS (Optional — cache degrades gracefully if absent) ===
REDIS_URL=redis://default:password@localhost:6379

# === EXAMPLE CACHING (Optional) ===
EXAMPLES_CACHE_HMAC_KEY=your-hmac-key-at-least-32-chars
```

> **Note:** Google Cloud credentials use a **dev-tier service account** with limited quotas. Production uses a separate account with full resources. All GCS/TTS/Gemini clients are lazy-loaded — validated at startup but fail only on use if misconfigured.

**JWT Secret Generation:**

```bash
# Generate secure random secrets (run this twice for access + refresh secrets)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Variable Details

### Mandatory — validated by `validateConfig()` at startup

| Variable                     | Where it's read                           | Local Dev                                | Cloud Deployment                                 | Notes                                                           |
| ---------------------------- | ----------------------------------------- | ---------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| `DATABASE_URL`               | `shared/config/index.js` → Prisma         | Supabase dev branch URL in `.env.local`  | Supabase prod branch URL in platform Dashboard   | No local PostgreSQL needed                                      |
| `JWT_SECRET`                 | `shared/config/index.js` → JWT middleware | Same value in `.env.local`               | Same value in platform Dashboard                 | Min 32 chars. Access tokens (15min).                            |
| `JWT_REFRESH_SECRET`         | `shared/config/index.js` → JWT middleware | Same value in `.env.local`               | Same value in platform Dashboard                 | Min 32 chars. Refresh tokens (7d). Different from `JWT_SECRET`. |
| `GCS_BUCKET_NAME`            | `shared/config/index.js`                  | Same bucket name in `.env.local`         | Same bucket name in platform Dashboard           | Dev uses a dev-tier bucket                                      |
| `GOOGLE_TTS_CREDENTIALS_RAW` | `external/GoogleTTSClient.js`             | Dev service account JSON in `.env.local` | Production service account in platform Dashboard | Dev account has lower TTS quotas                                |
| `GEMINI_API_CREDENTIALS_RAW` | `external/GeminiClient.js`                | Dev service account JSON in `.env.local` | Production service account in platform Dashboard | Used for Gemini AI + GCS auth fallback                          |
| `VITE_API_URL`               | Frontend services                         | `http://localhost:3001` in `.env.local`  | Production backend URL in Vercel Dashboard       | Mandatory for frontend (not validated by backend)               |

### Optional (safe defaults)

| Variable                  | Default                 | Local Dev                                   | Cloud Deployment                            | Notes                                                                                        |
| ------------------------- | ----------------------- | ------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `REDIS_URL`               | _disabled_              | Local Redis or skip (cache = no-op)         | Platform auto-injects or set manually       | Cache enabled automatically when `REDIS_URL` is set. No separate `CACHE_ENABLED` var needed. |
| `FRONTEND_URL`            | `http://localhost:5173` | Not needed (default matches Vite)           | Set to production frontend URL              | CORS allowed origin.                                                                         |
| `PORT`                    | `3001`                  | Fixed locally                               | Platform usually overrides                  |                                                                                              |
| `NODE_ENV`                | `development`           | `development`                               | `production`                                |                                                                                              |
| `CACHE_ENABLED`           | — (deprecated)          | Not needed — cache auto-detects `REDIS_URL` | Not needed — cache auto-detects `REDIS_URL` | **Deprecated.** Cache is enabled automatically when `REDIS_URL` is present. Remove this var. |
| `ENABLE_DETAILED_LOGS`    | `false`                 | Set `true` for debugging                    | Usually `false`                             |                                                                                              |
| `EXAMPLES_CACHE_HMAC_KEY` | _none_                  | Not needed for dev                          | Set in platform Dashboard                   | HMAC key for examples GCS cache naming.                                                      |

---

## .gitignore

```gitignore
# Environment files
.env.local
.env.*.local

# Keep template
!.env.example
```

---

## Reference: Adding a New Environment Variable

1. Add it to `.env.example` with a comment explaining its purpose
2. Add it to the catalog table above
3. Add validation in `apps/backend/src/shared/config/index.js` if it should be mandatory
4. Set it in Railway Dashboard (backend) and/or Vercel Dashboard (frontend)
5. Document in the story/epic that introduced it

---

**See also:** [Deployment Guide](../operations/deployment.md) — full deployment walkthrough with per-environment config

---

## Key Principles

**Single Source of Truth:**

- Use `.env.local` for both development AND tests
- Avoid multiple `.env` files that create inconsistencies
- Keep `.env.example` updated with all required variables
  **Learn more:** [Configuration Management](../../knowledge-base/infra-configuration-management.md) - Environment strategies, validation, security

## Backend Configuration

Load environment variables:

```typescript
// apps/backend/src/shared/config/index.js
import dotenv from "dotenv";
import path from "path";

// Load .env.local from project root
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local") });

// Validate required variables
const required = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET", "FRONTEND_URL"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(", ")}`);
}

// Export parsed config
export const config = {
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  },
  redis: {
    url: process.env.REDIS_URL,
    enabled: process.env.CACHE_ENABLED !== "false",
    ttl: {
      tts: parseInt(process.env.CACHE_TTL_TTS || "86400"),
      conversation: parseInt(process.env.CACHE_TTL_CONVERSATION || "3600"),
    },
  },
  server: {
    port: parseInt(process.env.PORT || "3001"),
    frontendUrl: process.env.FRONTEND_URL,
  },
};
```

## Test Configuration

Load root `.env.local` in test setup:

```typescript
// setupTests.ts
import dotenv from "dotenv";
import path from "path";

// Share .env.local with tests
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Override test-specific values if needed
process.env.NODE_ENV = "test";
```

## Frontend Variables

Prefix with `VITE_` for client exposure:

```env
# ❌ Not accessible in browser
API_URL=http://localhost:3001

# ✅ Accessible in browser
VITE_API_URL=http://localhost:3001
```

Usage:

```typescript
const API_URL = import.meta.env.VITE_API_URL;
```

## Security

**Never commit secrets:**

```gitignore
.env.local
.env.production
```

**Use placeholders in examples:**

```env
# .env.example
DATABASE_URL=postgresql://postgres:[PASSWORD]@localhost:5432/mandarin_dev
JWT_SECRET=change-me-to-random-string-min-32-characters
GOOGLE_API_KEY=your-google-api-key-here
```

## Troubleshooting

**Variable undefined:**

1. Check file named `.env.local` (not `.env.locale`)
2. Restart dev server after changes
3. Verify dotenv.config() is called
4. Frontend: ensure `VITE_` prefix

**Tests using different config:**

1. Confirm setupTests.ts loads root `.env.local`
2. Check test runner working directory
3. Verify no `.env.test` overriding values

## Reference

- [JWT Authentication](../../business-requirements/epic-13-production-backend-architecture/story-13-3-authentication.md)

**Learn more:**

- [Infrastructure Configuration Management](../../knowledge-base/infra-configuration-management.md) - Single source of truth, validation strategies, security best practices

{
"compilerOptions": {
"target": "ES2020",
"module": "ESNext",
"lib": ["ES2020"],
"moduleResolution": "bundler",
"skipLibCheck": true,
"esModuleInterop": true,
"isolatedModules": true,
"noEmit": true,
"strict": true
},
"include": ["src/**/*"],
"exclude": ["node_modules"]
}

````

### Type Checking Commands

```bash
# Full type check (all workspaces with tsconfig)
npx tsc -b

# Frontend only
npm run type-check --workspace=@mandarin/frontend

# Specific file
npx tsc --noEmit apps/frontend/src/path/to/file.tsx
````

### Adding a New TypeScript Workspace

1. Create workspace `tsconfig.json` with `"references"` pointing to sub-configs
2. Add root config reference to root `tsconfig.json`
3. Add `"build": "tsc -b"` script to workspace `package.json`

---

## Vitest

### Configuration Overview

The monorepo uses Vitest for testing. Each workspace has its own config:

- **Frontend**: Vitest configured in `vite.config.ts` (shares Vite config)
- **Backend**: Standalone `vitest.config.js` (Node environment)
- **Legacy**: Backend also has `jest.config.js` (being phased out)

### Backend Vitest Config (`apps/backend/vitest.config.js`)

```javascript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js", "tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.js"],
      exclude: ["node_modules/", "tests/", "src/index.js"],
    },
    setupFiles: ["./tests/setup.js"],
    testTimeout: 10000,
    globals: true,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true, // Run integration tests serially to avoid Prisma adapter issues
      },
    },
  },
});
```

### Running Tests

```bash
# All workspaces
npm test

# Specific workspace
npm test --workspace=@mandarin/frontend
npm test --workspace=@mandarin/backend

# Watch mode
npm test --workspace=@mandarin/frontend -- --watch
npm test --workspace=@mandarin/backend -- --watch

# Coverage
npm test --workspace=@mandarin/frontend -- --coverage
npm test --workspace=@mandarin/backend -- --coverage

# Specific test file (backend)
npm test --workspace=@mandarin/backend -- tests/unit/core/AuthService.test.js
```

### Key Config Differences: Frontend vs Backend

| Setting            | Frontend                  | Backend              |
| ------------------ | ------------------------- | -------------------- |
| Environment        | `jsdom` (browser DOM)     | `node`               |
| Test files         | `src/**/*.test.{ts,tsx}`  | `tests/**/*.test.js` |
| Language           | TypeScript                | JavaScript           |
| Coverage threshold | 40%                       | Not configured       |
| Config location    | `vite.config.ts` (shared) | `vitest.config.js`   |

### Legacy Jest Config

The backend has a `jest.config.js` from an earlier setup. **All new tests should use Vitest.** The Jest config is maintained for backward compatibility only.

---

## Dependency Management

### Workspace Alignment

Keep the following dependencies aligned across workspaces:

| Dependency                   | Root     | Frontend        | Backend         | Shared Packages |
| ---------------------------- | -------- | --------------- | --------------- | --------------- |
| `typescript`                 | `^5.8.3` | `^5.8.3`        | `^5.8.3`        | —               |
| `vitest`                     | —        | `^4.0.18`       | `^4.0.17`       | —               |
| `@mandarin/shared-constants` | —        | `*` (workspace) | `*` (workspace) | —               |
| `@mandarin/shared-types`     | —        | `*` (workspace) | `*` (workspace) | —               |

### Adding a New Dependency

```bash
# Workspace-specific
npm install --workspace=@mandarin/frontend <package>

# Root (shared dev dependency)
npm install -W -D <package>

# All workspaces
npm install --workspaces <package>
```

After adding:

1. Update this document if it's a build/test tool
2. Run `npm audit` to check for vulnerabilities
3. Update relevant setup guides

---

## Pre-Commit Hooks (Optional)

For automated linting and formatting before commits:

```bash
npm install -D husky lint-staged
npx husky-init
```

**`package.json` addition:**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.js": ["prettier --write"]
  }
}
```

---

## Common Commands Reference

```bash
# Lint
npm run lint                              # Frontend ESLint
npm run lint --workspace=@mandarin/frontend

# Format
npx prettier --write "**/*.{ts,tsx,js,json,css}"

# Type Check
npx tsc -b                                # All TypeScript workspaces
npm run type-check --workspace=@mandarin/frontend

# Test
npm test                                  # All workspaces
npm test --workspace=@mandarin/frontend   # Frontend only
npm test --workspace=@mandarin/backend    # Backend only

# Build
npm run build                             # All workspaces with build script
npm run build --workspace=@mandarin/frontend

# Security
npm audit                                 # Vulnerability check
npm audit fix                             # Auto-fix vulnerabilities
```

---

## Verification

Confirm Redis is configured and accessible:

```bash
cd apps/backend

# Check Redis connection via the health endpoint
# Start the backend and check:
curl http://localhost:3001/api/v1/health 2>/dev/null | jq '.cache'
# Expected: { "enabled": true, "status": "connected" }

# Or test directly with Redis CLI
redis-cli -u "$REDIS_URL" ping
# Expected: PONG
```

- [Linting Setup Guide](../setup/linting.md) — Quick-start ESLint/Prettier setup
- [Frontend Conventions](../conventions/frontend.md) — Code style and patterns
- [Backend Conventions](../conventions/backend.md) — Backend architecture patterns
- [Review Checklist](../operations/review-checklist.md) — Pre-commit and PR checks
- [Environment Setup Guide](environment-setup.md) — Environment variables
