# Backend Development Guide

**Last Updated:** June 3, 2026  
**Purpose:** Complete guide for running the Express backend locally, understanding architecture, and following development best practices  
**Audience:** Developers setting up and working with the Express backend  
**Time to Complete:** 15-20 minutes initial setup

> **Purpose:** Complete guide for running the Express backend locally, understanding architecture, and following development best practices.

---

## Table of Contents

1. [Quick Start (10 Minutes)](#quick-start-10-minutes)
2. [Architecture Overview](#architecture-overview)
3. [Express Server Setup](#express-server-setup)
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

- **Completed:** [Frontend Quick Start](quickstart.md) (Node.js, npm, git, project cloned)
- **Google Cloud:** Dev-tier service account with TTS + Gemini + GCS access
- **Optional:** Redis instance (caching falls back gracefully if unavailable)

### Step 1: Configure Environment Variables

Create `.env.local` at **project root** (if you haven't already):

```bash
# Copy example file
cp .env.example .env.local
```

Edit `.env.local` with required variables. See **[Environment Setup Guide](../getting-started/environment-setup.md)** for complete documentation.

**Minimum Required Variables (all mandatory — `validateConfig()` will crash at startup if missing):**

```env
# Database (Supabase dev branch)
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"

# Authentication
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="your-32-char-secret-here"
JWT_REFRESH_SECRET="your-other-32-char-secret-here"

# Google Cloud (dev-tier service account)
GOOGLE_TTS_CREDENTIALS_RAW='{"type":"service_account","project_id":"..."}'
GEMINI_API_CREDENTIALS_RAW='{"type":"service_account","project_id":"..."}'
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

This creates:

- `users` table (authentication)
- `progress` table (vocabulary progress tracking)
- `vocabulary_word`, `category`, `vocabulary_list` tables (normalized vocabulary data)
- Junction tables: `word_category`, `word_list` (many-to-many relationships)

**Verify:** Check your database - tables should exist now.

### Step 3: Load Vocabulary Data (Optional)

The backend includes migration scripts to populate vocabulary from CSV files:

```bash
# Navigate to backend directory
cd apps/backend

# Clean existing vocabulary data (if any)
npm run migrate:clean

# Load 500 HSK 3.0 Band 1 words
npm run migrate:vocab

# Load thematic categories (daily-communication, food-dining, etc.)
npm run migrate:categories

# Check migration status
node scripts/check-migration-progress.js
```

**Expected Result:**

- 500 vocabulary words (IDs 1-500)
- 7 thematic categories
- 624 word-category links

**Note:** This step is optional for backend development. The API works with or without vocabulary data, but quiz features require it.

### Step 3.5: Create Test Users

```bash
# From apps/backend
npm run db:seed
```

This creates two test accounts:

| Email              | Password    | Display Name |
| ------------------ | ----------- | ------------ |
| `test@example.com` | `Test1234!` | Test User    |
| `demo@example.com` | `Demo1234!` | Demo User    |

These are needed for auth, quiz sessions, and any user-scoped feature. Without them, login endpoints return 401.

### Step 4: Start Backend Server

```bash
# From project root
npm run dev:backend

# Or from apps/backend
cd apps/backend
npm run dev
```

**Γ£à Backend is running at:** `http://localhost:3001`

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

### Modular Monolith Folder Structure

```
apps/backend/
├── src/
│   ├── app/                       # Express App Bootstrap
│   │   ├── index.js               # Express app entry point
│   │   ├── container.js           # DI composition root
│   │   └── routes.js              # 11 route routers under /v1/
│   ├── modules/                   # 8 Business Modules
│   │   ├── auth/                  # Simple CRUD
│   │   │   ├── api/               #   controllers + routes
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   └── __tests__/
│   │   ├── word/                  # Simple CRUD
│   │   ├── vocabulary/            # Feature Slices
│   │   ├── quiz/                  # Clean Architecture (use-cases/)
│   │   ├── gamification/          # Simple CRUD
│   │   ├── examples/              # Feature Slices
│   │   ├── tts/                   # Simple
│   │   └── health/                # Simple
│   └── shared/                    # Cross-cutting Concerns
│       ├── config/index.js        # Env config validation
│       ├── infrastructure/        # External clients, cache, DB
│       │   ├── cache/
│       │   ├── database/
│       │   ├── external/          # GCS, Gemini, GoogleTTS
│       │   ├── redis/
│       │   ├── security/          # JWT, Password, HMAC
│       │   └── storage/
│       ├── middleware/            # asyncHandler, auth, cache, errorHandler
│       └── utils/                 # logger, errorFactory, hashUtils, dateUtils
├── prisma/
│   └── schema.prisma
└── tests/
    ├── integration/
    └── unit/
```

### Architectural Layers

1. **App Layer** (`src/app/`): Entry point, DI container registration, route mounting
2. **Module Layer** (`src/modules/<name>/api/`): HTTP request handling, validation, response formatting (controllers/routes per module)
3. **Service/Use-Case Layer** (`src/modules/<name>/services/` or `use-cases/`): Business logic, orchestration, domain rules
4. **Repository Layer** (`src/modules/<name>/repositories/`): Database access, query construction, data mapping
5. **Shared Infrastructure** (`src/shared/infrastructure/`): External service clients, cache, Redis, security

**Deep Dive:** See [Backend Architecture Patterns](../../knowledge-base/backend-architecture.md) for layered architecture, dependency injection, and design patterns.

---

## Express Server Setup

**Key Configuration Points** ([apps/backend/src/server.js](../../apps/backend/src/server.js)):

```javascript
const app = express();

// Middleware order is critical:
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies (required for JWT refresh tokens)
app.use(corsMiddleware); // CORS configuration (apply once only)

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/progress", progressRoutes);

// Error handling (must be last middleware)
app.use(errorHandler);
```

**Critical Notes:**

- Middleware order matters: CORS ΓåÆ Routes ΓåÆ Error Handler
- Apply CORS **once only** at app level (duplicate CORS breaks authentication)
- Error handler must be last middleware registered

### Error Handling

**Centralized Error Middleware** ([apps/backend/src/middleware/errorHandler.ts](../../apps/backend/src/middleware/errorHandler.ts)):

- Catches all unhandled errors from routes/middleware
- Handles Prisma-specific errors (duplicate keys, not found)
- Must be registered **after all routes**

**Common Prisma Error Codes:**

- `P2002`: Unique constraint violation (409 Conflict)
- `P2025`: Record not found (404 Not Found)

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
# Development
npm run dev:backend         # Start backend server (from project root)
npm run dev                 # Start backend server (from apps/backend)

# Database
npm run db:migrate         # Run migrations
npm run db:generate        # Generate Prisma client
npm run db:seed            # Create test users (test@example.com / Test1234!)
npm run db:studio          # Open Prisma Studio (GUI)
npm run db:reset           # Reset database (WARNING: deletes data)

# Vocabulary Data Migration (apps/backend)
npm run migrate:clean      # Delete all vocabulary data
npm run migrate:vocab      # Load 500 words from CSV files
npm run migrate:categories # Load thematic categories

# Testing
npm run test:backend       # Run backend tests (from project root)
npm run test              # Run backend tests (from apps/backend)
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

---

## Troubleshooting

> **Troubleshooting Guide:** See [Troubleshooting Guide](./troubleshooting.md) for comprehensive debugging help.
>
> Common issues covered:
>
> - [CORS Errors](./troubleshooting.md#-cors-errors-persist)
> - [Authentication Issues](./troubleshooting.md#-authentication-middleware-not-working)
> - [Redis Connection Issues](./troubleshooting.md#-redis-connection-issues)
> - [Database Connection Errors](./troubleshooting.md#-database-connection-errors)
> - [Bcrypt/Native Modules](./troubleshooting.md#-bcryptnative-module-issues)

---

## Reference

### Official Documentation

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT.io](https://jwt.io/introduction) - JWT introduction

### Project Documentation

- [Backend README](../../apps/backend/README.md) - Backend overview and deployment
- [API Specification](../../apps/backend/docs/api-spec.md) - Endpoint reference
- [Environment Setup Guide](../getting-started/environment-setup.md) — All environment variables
- [Redis Setup Guide](../setup/redis.md) — Redis caching and integration

### Knowledge Base

- [Backend Architecture Patterns](../knowledge-base/backend-architecture.md) - Layered architecture, CORS, middleware
- [Authentication Concepts](../knowledge-base/backend-authentication.md) - OAuth, SSO, session strategies
- [PostgreSQL Setup & Migrations](../knowledge-base/backend-database-postgres.md) - Connection pooling, migrations
- [Caching Strategies](../knowledge-base/integration-caching.md) - Redis patterns, cache-aside

---

**Last Updated:** June 2, 2026
