# Environment Setup Guide

Configure environment variables for development, testing, and production.

## File Structure

```
mandarin-vite-react-ts/
├── .env.local          # Local development (gitignored) - SINGLE SOURCE FOR BOTH FRONTEND & BACKEND
├── .env.example        # Template for team (committed) - AT PROJECT ROOT
├── apps/
│   ├── frontend/       # Reads .env.local from root via Vite
│   └── backend/        # Reads .env.local from root via dotenv config
```

**Important**: This project uses a **single `.env.local` file at the project root** for both frontend and backend to simplify development. The backend explicitly loads from the root via `dotenv.config({ path: '../../../../.env.local' })` in `apps/backend/src/config/index.js`.

## Setup Steps

**1. Copy example file (at project root):**

```bash
# From project root
cp .env.example .env.local
```

**2. Fill in values:**

```env
# .env.local

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@localhost:5432/mandarin_dev
# Railway example: postgresql://postgres:pass@containers-us-west-123.railway.app:5432/railway
# Supabase example: postgresql://postgres:[PASSWORD]@db.project.supabase.co:5432/postgres

# Authentication
# Generate JWT secrets with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-in-production
JWT_REFRESH_SECRET=your-jwt-refresh-secret-different-from-access-secret
JWT_ACCESS_EXPIRY=15m   # Access token lifetime
JWT_REFRESH_EXPIRY=7d   # Refresh token lifetime

# Redis Caching (Optional - falls back gracefully if unavailable)
# Railway example: redis://default:password@redis.railway.internal:6379
# Upstash example: redis://default:password@host.upstash.io:6379
REDIS_URL=redis://default:password@localhost:6379
CACHE_ENABLED=true
CACHE_TTL_TTS=86400         # TTS cache: 24 hours
CACHE_TTL_CONVERSATION=3600  # Conversation cache: 1 hour

# Server
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001  # REQUIRED: Used by frontend services for API baseURL

# ⚠️ IMPORTANT: VITE_API_URL is mandatory even when using Vite proxy.
# The proxy can mask configuration issues during local dev that will break in production.

# External Services
# Google Cloud service account JSON (single-line string)
GOOGLE_TTS_CREDENTIALS_RAW='{"type":"service_account","project_id":"..."}'
GEMINI_API_CREDENTIALS_RAW='{"type":"service_account","project_id":"..."}'
GCS_BUCKET_NAME=your-bucket-name
```

**JWT Secret Generation:**

```bash
# Generate secure random secrets (run this twice for access + refresh secrets)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important Notes:**

- **JWT_SECRET vs JWT_REFRESH_SECRET**: Use different secrets for access and refresh tokens
- **Redis**: Optional for development; backend falls back to no-cache mode gracefully
- **Database**: Railway and Supabase both provide free PostgreSQL tiers
- **Google Credentials**: Service account JSON must be on a single line with escaped quotes

**3. Update `.gitignore`:**

```gitignore
# Environment files
.env.local
.env.*.local

# Keep template
!.env.example
```

## Key Principles

**Single Source of Truth:**

- Use `.env.local` for both development AND tests
- Avoid multiple `.env` files that create inconsistencies
- Keep `.env.example` updated with all required variables

**Learn more:** [Configuration Management](../knowledge-base/infra-configuration-management.md) - Environment strategies, validation, security

## Backend Configuration

Load environment variables:

```typescript
// apps/backend/src/config/index.js
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

- [JWT Authentication](../business-requirements/epic-13-production-backend-architecture/story-13-3-authentication.md)

**Learn more:**

- [Infrastructure Configuration Management](../knowledge-base/infra-configuration-management.md) - Single source of truth, validation strategies, security best practices

---

**Last Updated:** January 29, 2026
