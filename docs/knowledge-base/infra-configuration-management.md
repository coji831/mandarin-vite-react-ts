# Infrastructure Configuration Management

**Category:** Infrastructure & DevOps  
**Last Updated:** January 9, 2026

---

## Overview

Configuration management is the practice of controlling environment-specific settings (database URLs, API keys, feature flags) across development, testing, staging, and production environments. Poor configuration practices lead to environment drift, security vulnerabilities, and difficult debugging. This guide covers principles and patterns for robust configuration management.

---

## The Single Source of Truth Principle

### The Problem with Multiple Config Files

Many projects accumulate configuration files over time:

```
.env
.env.local
.env.development
.env.production
.env.test
.env.staging
```

This creates **configuration drift**:

- Development uses `.env.local`
- Tests use `.env.test`
- App startup uses `.env.development`
- Different values for same setting across files
- Unclear precedence rules

**Real-World Impact:**

```
# .env.local
DATABASE_URL=postgresql://localhost:5432/app_dev

# .env.test
DATABASE_URL=postgresql://localhost:5432/app_test

# Result: App connects to app_dev, tests to app_test
# Developer changes schema in app_dev
# Tests fail mysteriously (using different database)
```

### Single Source of Truth Pattern

**Principle:** One environment = one config file

**Implementation:**

```
Development:
  └── .env.local (single source for dev + test)

Production:
  └── Environment variables (set by platform: Vercel, Railway, etc.)

Template:
  └── .env.example (committed, shows required variables)
```

**Benefits:**

- Tests and development always aligned
- No precedence confusion
- Easy to spot missing variables
- Simple onboarding (copy `.env.example` → `.env.local`)

---

## Environment Variable Hierarchy

### Load Order (Priority: Highest to Lowest)

Most tools follow this precedence:

1. **Process environment** (actual system env vars)
2. **`.env.local`** (local overrides, gitignored)
3. **`.env.development` / `.env.production`** (environment-specific)
4. **`.env`** (shared defaults)

**Example:**

```bash
# .env (committed, defaults)
PORT=3000
DATABASE_URL=postgresql://localhost:5432/app

# .env.local (gitignored, developer-specific)
PORT=3001  # Overrides .env
DATABASE_URL=postgresql://localhost:5432/my_custom_db

# Result:
PORT=3001
DATABASE_URL=postgresql://localhost:5432/my_custom_db
```

### When to Use Each File

| File               | Purpose            | Committed? | Use Case                                   |
| ------------------ | ------------------ | ---------- | ------------------------------------------ |
| `.env`             | Shared defaults    | ✅ Yes     | Non-sensitive defaults all developers need |
| `.env.example`     | Template           | ✅ Yes     | Onboarding new developers                  |
| `.env.local`       | Local overrides    | ❌ No      | Developer-specific settings, secrets       |
| `.env.development` | Dev-only defaults  | ✅ Yes     | Dev-specific non-sensitive config          |
| `.env.production`  | Prod-only defaults | ✅ Yes     | Prod-specific non-sensitive config         |
| `.env.test`        | Test-specific      | ⚠️ Maybe   | Only if tests need different config        |

---

## Configuration Validation Strategies

### 1. Fail Fast on Startup

Validate required variables immediately:

```typescript
// config/env.ts
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "FRONTEND_URL"] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Please check .env.example for required configuration.`,
    );
  }
}

// index.ts
validateEnv();
app.listen(PORT);
```

**Benefits:**

- Catch config errors before app starts
- Clear error messages for developers
- Prevents partial startup with missing config

### 2. Type-Safe Configuration

Use schema validation (Zod, Joi, etc.):

```typescript
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().positive(),
  NODE_ENV: z.enum(["development", "test", "production"]),
  FRONTEND_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);

// Usage: env.DATABASE_URL (typed, validated)
```

**Benefits:**

- Type safety across codebase
- Runtime validation
- Auto-complete in IDE
- Clear schema documentation

### 3. Environment-Specific Validation

Different environments need different variables:

```typescript
const baseSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

const developmentSchema = baseSchema.extend({
  DEBUG_LOGGING: z.boolean().optional(),
});

const productionSchema = baseSchema.extend({
  SENTRY_DSN: z.string().url(),
  REDIS_URL: z.string().url(),
});

const schema = process.env.NODE_ENV === "production" ? productionSchema : developmentSchema;

export const env = schema.parse(process.env);
```

---

## Security Best Practices

### 1. Never Commit Secrets

**Good:**

```gitignore
# .gitignore
.env.local
.env.*.local
.env.production.local

# Keep templates only
!.env.example
```

**Bad:**

```env
# .env.production (committed)
DATABASE_URL=postgresql://user:actual-password@prod-host/db
JWT_SECRET=actual-secret-key-12345
```

### 2. Use Placeholder Values in Examples

**Good:**

```env
# .env.example
DATABASE_URL=postgresql://postgres:[PASSWORD]@localhost:5432/app_dev
JWT_SECRET=change-me-to-random-string-min-32-characters
GOOGLE_API_KEY=your-google-api-key-here
```

**Bad:**

```env
# .env.example
DATABASE_URL=postgresql://postgres:password@localhost:5432/app_dev
JWT_SECRET=secret
GOOGLE_API_KEY=
```

### 3. Separate Secrets from Config

**Pattern:** Use secret management services in production

```typescript
// Development: .env.local
process.env.JWT_SECRET;

// Production: Secret manager
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

async function getSecret(name: string) {
  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({
    name: `projects/my-project/secrets/${name}/versions/latest`,
  });
  return version.payload?.data?.toString();
}

const JWT_SECRET =
  process.env.NODE_ENV === "production" ? await getSecret("jwt-secret") : process.env.JWT_SECRET;
```

### 4. Rotate Secrets Regularly

**Best Practices:**

- Rotate production secrets quarterly
- Use different secrets per environment
- Never reuse development secrets in production
- Store secrets in password manager (1Password, LastPass)
- Document rotation procedure

---

## Frontend Environment Variables

### Build-Time vs Runtime

Frontend apps often bundle environment variables at **build time**, not runtime:

```typescript
// ❌ Won't work (server-only process.env)
fetch(process.env.API_URL);

// ✅ Vite: VITE_ prefix exposed to client
fetch(import.meta.env.VITE_API_URL);

// ✅ Create React App: REACT_APP_ prefix
fetch(process.env.REACT_APP_API_URL);

// ✅ Next.js: NEXT_PUBLIC_ prefix
fetch(process.env.NEXT_PUBLIC_API_URL);
```

### Security Implications

**Frontend variables are PUBLIC** (visible in browser bundle):

```env
# ❌ NEVER expose secrets to frontend
VITE_DATABASE_URL=postgresql://...
VITE_JWT_SECRET=...

# ✅ Only public config
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_MAPS_API_KEY=... # Restricted by domain
```

### Runtime Configuration for SPAs

**Problem:** Build once, deploy many environments (staging, prod, etc.)

**Solution 1: Config Endpoint**

```typescript
// Backend: /api/config
app.get("/api/config", (req, res) => {
  res.json({
    apiUrl: process.env.API_URL,
    environment: process.env.NODE_ENV,
  });
});

// Frontend: Load on startup
const config = await fetch("/api/config").then((r) => r.json());
```

**Solution 2: Inject at Deploy Time**

```bash
# Replace placeholders in built files
sed -i "s|__API_URL__|${API_URL}|g" dist/index.html
```

---

## Testing Environment Configuration

### Isolation Principles

**Goal:** Tests should not affect each other or development environment

**Bad:**

```typescript
// Tests mutate process.env directly
test("should validate token", () => {
  process.env.JWT_SECRET = "test-secret";
  // Other tests now see modified value
});
```

**Good:**

```typescript
// Save and restore
let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
  process.env.JWT_SECRET = "test-secret";
});

afterEach(() => {
  process.env = originalEnv;
});
```

**Better:**

```typescript
// Use mocks
jest.mock("./config/env", () => ({
  env: {
    JWT_SECRET: "test-secret",
    DATABASE_URL: "mock-db",
  },
}));
```

### Test Database Management

**Pattern:** Separate test database

```env
# .env.local (development)
DATABASE_URL=postgresql://localhost:5432/app_dev

# .env.test or test setup
DATABASE_URL=postgresql://localhost:5432/app_test
```

**Cleanup Strategy:**

```typescript
// setupTests.ts
beforeAll(async () => {
  // Connect to test database
  await db.connect(process.env.DATABASE_URL);
});

beforeEach(async () => {
  // Clean slate for each test
  await db.query("TRUNCATE TABLE users CASCADE");
});

afterAll(async () => {
  await db.close();
});
```

---

## Configuration Patterns by Environment

### Development

**Goals:**

- Easy onboarding
- Fast feedback
- Debugging enabled

**Pattern:**

```env
# .env.local
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug

# Local services
DATABASE_URL=postgresql://localhost:5432/app_dev
REDIS_URL=redis://localhost:6379

# Relaxed security
JWT_EXPIRY=7d
CORS_ORIGIN=*
```

### Testing

**Goals:**

- Isolation
- Speed
- Reproducibility

**Pattern:**

```env
# .env.test or test setup
NODE_ENV=test
LOG_LEVEL=error  # Quiet logs

# In-memory or test instances
DATABASE_URL=postgresql://localhost:5432/app_test
REDIS_URL=redis://localhost:6380

# Fast tests
JWT_EXPIRY=1m
BCRYPT_ROUNDS=4  # Faster hashing
```

### Production

**Goals:**

- Security
- Performance
- Observability

**Pattern:**

```bash
# Platform environment variables (Vercel, Railway, etc.)
NODE_ENV=production
LOG_LEVEL=info

# Managed services
DATABASE_URL=postgresql://user:pass@prod-host.cloud/db
REDIS_URL=redis://prod-cache.cloud:6379

# Strict security
JWT_EXPIRY=15m
CORS_ORIGIN=https://app.example.com
RATE_LIMIT=100
```

---

## Common Pitfalls

### 1. Environment Variable Not Loaded

**Symptom:** `process.env.MY_VAR` is `undefined`

**Causes:**

- File not named correctly (`.env.local` vs `.env.locale`)
- dotenv not configured properly
- Variable not exported in shell (for system env vars)
- Wrong working directory

**Fix:**

```typescript
// Explicit path for dotenv
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
```

### 2. Precedence Confusion

**Symptom:** Variable has unexpected value

**Cause:** Multiple files defining same variable

**Fix:** Log loaded values on startup

```typescript
console.log("Environment loaded:", {
  DATABASE_URL: process.env.DATABASE_URL?.replace(/:.+@/, ":***@"), // Hide password
  JWT_SECRET: process.env.JWT_SECRET ? "[SET]" : "[MISSING]",
  PORT: process.env.PORT,
});
```

### 3. String vs Number Coercion

**Symptom:** Port is string `"3001"` instead of number `3001`

**Cause:** Environment variables are always strings

**Fix:**

```typescript
// ❌ Wrong
const PORT = process.env.PORT; // Type: string | undefined

// ✅ Correct
const PORT = Number(process.env.PORT) || 3001; // Type: number

// ✅ Better: Zod coercion
const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
});
```

### 4. Forgetting .env.example

**Symptom:** New developers don't know what variables are needed

**Fix:** Keep `.env.example` in sync

```bash
# Add to PR checklist
- [ ] Updated .env.example if new variables added
```

---

## Tools & Libraries

### dotenv

Load environment variables from files:

```typescript
import dotenv from "dotenv";

// Load .env.local
dotenv.config({ path: ".env.local" });

// Load multiple files
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });
```

### Zod / Joi / Yup

Schema validation:

```typescript
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().positive().default(3001),
});

export const env = envSchema.parse(process.env);
```

### envalid

Specialized environment validation:

```typescript
import { cleanEnv, str, port, url } from "envalid";

export const env = cleanEnv(process.env, {
  DATABASE_URL: url(),
  PORT: port({ default: 3001 }),
  JWT_SECRET: str({ minLength: 32 }),
});
```

---

## Common Configuration Issues

**Category:** Troubleshooting  
**Context:** Environment variable pitfalls discovered in production

### Issue 1: Environment Variable Defined But Not Exported

**Symptom:** Application logs show `undefined` for a variable that exists in `.env.local`

**Example:**

```typescript
// .env.local (variable IS defined)
DATABASE_URL = "postgresql://localhost:5432/app";

// config/index.js (variable NOT exported)
export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET,
  // Missing: databaseUrl export!
};

// database/client.js (tries to use config)
import { config } from "../config/index.js";
const prisma = new PrismaClient({
  datasources: {
    db: { url: config.databaseUrl }, // undefined!
  },
});

// Result: "Invalid invocation" error from Prisma
```

**Root Cause:**  
The environment variable is loaded by `dotenv` but not added to the exported config object.

**Solution:**  
Explicitly export all required environment variables in your config module:

```typescript
// config/index.js - FIXED
export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL, // ✅ Now exported
};
```

**Prevention:**

1. Use TypeScript for config modules (type errors catch missing exports)
2. Validate config on startup:
   ```typescript
   if (!config.databaseUrl) {
     throw new Error("DATABASE_URL must be configured");
   }
   ```
3. Use schema validation (Zod) to ensure all required fields exist

**When This Happens:**

- Adding new environment variables without updating config exports
- Copy-pasting config code and forgetting to add new variables
- Incremental refactoring where new config isn't propagated

**Real-World Impact:**  
In Story 13.6, Prisma failed to connect during login because `DATABASE_URL` wasn't exported from the config module. The variable existed in `.env.local`, but `config.databaseUrl` was `undefined` when passed to `PrismaPg` adapter.

---

## Related Patterns

- **Secret Management**: [Deployment Security](./infra-deployment.md#secrets)
- **Database Configuration**: [Backend Database Patterns](./backend-database-cloud.md)
- **Frontend Build Config**: [Frontend Development Server](./frontend-development-server.md)

---

**Last Updated:** January 9, 2026
