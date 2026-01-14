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

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001

# External Services
GOOGLE_CLOUD_TTS_API_KEY=your-api-key
```

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
// src/server.ts
import dotenv from "dotenv";
dotenv.config(); // Loads .env.local automatically

// Validate required variables
const required = ["DATABASE_URL", "JWT_SECRET", "FRONTEND_URL"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(", ")}`);
}
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

- [Story 13.3: JWT Authentication](../business-requirements/epic-13-production-backend-architecture/story-13-3-authentication.md)

**Learn more:**

- [Infrastructure Configuration Management](../knowledge-base/infra-configuration-management.md) - Single source of truth, validation strategies, security best practices

---

**Last Updated:** January 9, 2026
