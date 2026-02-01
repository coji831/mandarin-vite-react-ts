# Backend Setup Guide

This guide provides step-by-step instructions for setting up the Express backend server with authentication and database integration.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or Supabase)
- Environment variables configured (see [Environment Setup Guide](./environment-setup-guide.md))

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Start development server
npm run start-backend
```

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

- Middleware order matters: CORS → Routes → Error Handler
- Apply CORS **once only** at app level (duplicate CORS breaks authentication)
- Error handler must be last middleware registered

## CORS Configuration

**Essential Settings** ([apps/backend/src/middleware/cors.ts](../../apps/backend/src/middleware/cors.ts)):

```typescript
export const corsMiddleware = cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true, // Required for cookie-based authentication
});
```

**Environment Variable:**

```env
FRONTEND_URL=http://localhost:5173  # Dev: localhost, Prod: Vercel domain
```

**⚠️ Critical Rules:**

1. Apply CORS middleware **once only** at app level
2. Must set `credentials: true` for cookie forwarding
3. `origin` must exactly match frontend URL (including protocol)
4. Duplicate CORS middleware breaks authentication

**Learn more:** [CORS Deep Dive](../knowledge-base/backend-architecture.md#cors-cross-origin-resource-sharing-deep-dive)

## Error Handling

**Centralized Error Middleware** ([apps/backend/src/middleware/errorHandler.ts](../../apps/backend/src/middleware/errorHandler.ts)):

- Catches all unhandled errors from routes/middleware
- Handles Prisma-specific errors (duplicate keys, not found)
- Must be registered **after all routes**

**Common Prisma Error Codes:**

- `P2002`: Unique constraint violation (409 Conflict)
- `P2025`: Record not found (404 Not Found)

## Security Configuration

**Password Hashing** (bcrypt with 10 salt rounds):

- Hash passwords before storing: `bcrypt.hash(password, 10)`
- Verify on login: `bcrypt.compare(plaintext, hash)`
- Implementation: [apps/backend/src/utils/hashUtils.js](../../apps/backend/src/utils/hashUtils.js)

📖 **Deep Dive:** See [Backend Authentication](../knowledge-base/backend-authentication.md) for password hashing strategies, salt rounds, and security best practices.

**JWT Tokens** (dual-token authentication):

- **Access Token**: Short-lived (15 min), sent in Authorization header
- **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie
- Implementation: [apps/backend/src/core/services/AuthService.js](../../apps/backend/src/core/services/AuthService.js)

📖 **Deep Dive:** See [Backend Authentication](../knowledge-base/backend-authentication.md) for JWT architecture, token refresh flows, and security considerations.

**Required Environment Variables:**

```env
JWT_SECRET=your-access-token-secret-key
JWT_REFRESH_SECRET=your-refresh-token-secret-key
```

**Token Flow:**

1. Login → Issue both tokens
2. API calls → Send access token in `Authorization: Bearer <token>`
3. Access token expires → Frontend uses refresh token to get new access token
4. Refresh token rotation: Issue new refresh token on each refresh

## Authentication Middleware

**Implementation:** [apps/backend/src/api/middleware/authenticate.js](../../apps/backend/src/api/middleware/authenticate.js)

**Two Middleware Functions:**

1. **`requireAuth`**: Protect routes requiring authentication
   - Extracts JWT from `Authorization: Bearer <token>` header
   - Verifies token signature and expiration
   - Attaches `req.userId` for downstream handlers
   - Returns 401 if missing/invalid/expired

2. **`optionalAuth`**: Allow anonymous + authenticated access
   - Sets `req.userId = null` if no valid token
   - Continues request processing regardless

**Usage Example:**

```javascript
import { requireAuth } from "../middleware/authenticate.js";

// Protected route
router.get("/api/v1/progress", requireAuth, async (req, res) => {
  const userId = req.userId; // Guaranteed to exist
});
```

## Database Setup (Prisma + PostgreSQL)

**Prisma Client Configuration** ([apps/backend/src/core/database/prismaClient.js](../../apps/backend/src/core/database/prismaClient.js)):

- Singleton pattern: Single client instance shared across application
- Query logging enabled in development only
- Graceful shutdown on process exit

**Connection Pooling** ([apps/backend/prisma/schema.prisma](../../apps/backend/prisma/schema.prisma)):

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")    // Pooled connection (Supabase/Railway)
  directUrl = env("DIRECT_URL")      // Direct connection (migrations only)
}
```

**Environment Variables:**

```env
# Pooled connection (port 6543 with pgbouncer)
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true"

# Direct connection (port 5432 for migrations)
DIRECT_URL="postgresql://user:pass@host:5432/db"
```

**Why Two URLs?**

- `DATABASE_URL`: Runtime queries (use connection pooler for performance)
- `DIRECT_URL`: Migrations only (bypass pooler to avoid transaction conflicts)

**Setup Commands:**

```bash
npx prisma migrate dev  # Apply migrations
npx prisma generate     # Generate Prisma Client
```

## Redis Caching (Optional)

**Implementation:** [apps/backend/src/core/cache/redisClient.js](../../apps/backend/src/core/cache/redisClient.js)

**Fail-Open Pattern** (application continues if Redis unavailable):

- Lazy connection: Non-blocking initialization
- Graceful degradation: Cache failures return null (treat as cache miss)
- No application crashes if Redis is down

**Configuration:**

```env
REDIS_URL="redis://default:password@host:port"
CACHE_ENABLED="true"  # Set to "false" to disable caching
```

**Usage Pattern:**

```javascript
// Try cache first, fallback to database
const cached = await cacheGet(key);
if (cached) return JSON.parse(cached);

const data = await database.query(...);
await cacheSet(key, JSON.stringify(data), 3600); // 1 hour TTL
```

**Full implementation:** See [apps/backend/src/core/cache/redisClient.js](../../apps/backend/src/core/cache/redisClient.js)

**When to Use:**

- Expensive database queries (conversation generation, TTS requests)
- Rate-limited external APIs (Google Cloud TTS)
- User session data

**Learn more:** [Redis Caching Guide](./redis-caching-guide.md)

## Clean Architecture Folder Structure

```
apps/backend/
├── src/
│   ├── api/                    # HTTP Layer (Controllers & Routes)
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── progressController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── progress.js
│   │   └── middleware/
│   │       ├── authenticate.js
│   │       ├── cors.js
│   │       └── rateLimiter.js
│   ├── core/                   # Business Logic Layer
│   │   ├── services/           # Domain Services
│   │   │   ├── AuthService.js
│   │   │   ├── ProgressService.js
│   │   │   ├── ttsService.js
│   │   │   └── conversationService.js
│   │   ├── repositories/       # Data Access Layer
│   │   │   ├── UserRepository.js
│   │   │   └── ProgressRepository.js
│   │   ├── database/
│   │   │   └── prismaClient.js
│   │   └── cache/
│   │       ├── redisClient.js
│   │       └── CacheService.js
│   ├── utils/                  # Shared Utilities
│   │   ├── logger.js
│   │   └── hashUtils.js
│   └── server.js               # Express App Entry
├── prisma/
│   └── schema.prisma
└── tests/
    ├── integration/
    └── unit/
```

**Architectural Layers:**

1. **API Layer** (Controllers/Routes): HTTP request handling, validation, response formatting
2. **Core Layer** (Services): Business logic, orchestration, domain rules
3. **Data Layer** (Repositories): Database access, query construction, data mapping
4. **Infrastructure** (Cache/Database): External service clients

## Testing (Vitest + Supertest)

**Configuration:** [apps/backend/vitest.config.js](../../apps/backend/vitest.config.js)

**Key Settings:**

- `pool: "forks"`: Required for bcrypt and other native modules
- `setupFiles`: Database cleanup before tests
- `globals: true`: Enable describe/it/expect without imports

**Run Tests:**

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Test Structure:**

```javascript
import request from "supertest";
import app from "../../src/server.js";

describe("POST /api/v1/auth/register", () => {
  it("should create a new user", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "test@example.com", password: "SecurePass123!" });

    expect(response.status).toBe(201);
  });
});
```

**Learn more:** [Testing Guide](./testing-guide.md)

## Troubleshooting

**CORS errors persist:**

1. Verify CORS middleware is before routes
2. Check for duplicate CORS calls
3. Confirm `FRONTEND_URL` is set
4. Ensure `credentials: true` in both frontend and backend

**Authentication middleware not working:**

1. Check JWT_SECRET and JWT_REFRESH_SECRET match between sign/verify
2. Verify token extraction logic (Bearer prefix)
3. Confirm Prisma client is initialized
4. Check token expiration times

**Redis connection issues:**

1. Verify REDIS_URL format (redis://default:password@host:port)
2. Check if Redis server is running
3. Application should continue without cache if Redis fails (fail-open)
4. Check health endpoint for Redis connection status

**Database connection errors:**

1. Verify DATABASE_URL format matches Prisma expectations
2. Check if connection pooling is enabled (Railway/Supabase)
3. Ensure migrations are run (`npx prisma migrate dev`)
4. See [Supabase Setup Guide](./supabase-setup-guide.md#troubleshooting)

## Reference

**Official Documentation:**

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT.io](https://jwt.io/introduction) - JWT introduction

**Project Documentation:**

- [Backend README](../../apps/backend/README.md) - Backend overview and deployment
- [API Specification](../../apps/backend/docs/api-spec.md) - Endpoint reference
- [Environment Setup Guide](./environment-setup-guide.md) - All environment variables

**Knowledge Base:**

- [Backend Architecture Patterns](../knowledge-base/backend-architecture.md) - Layered architecture, CORS, middleware
- [Authentication Concepts](../knowledge-base/backend-authentication.md) - OAuth, SSO, session strategies
- [Redis Caching Guide](./redis-caching-guide.md) - Caching strategies and patterns

---

**Last Updated:** January 30, 2026
