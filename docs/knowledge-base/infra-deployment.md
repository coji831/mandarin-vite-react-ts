# Deployment & Infrastructure

**Category:** Infrastructure  
**Last Updated:** December 9, 2025

---

## Vercel Deployment

**When Adopted:** Epic 1 (Google Cloud TTS Integration)  
**Why:** Zero-config deployment, serverless functions, global CDN  
**Use Case:** Deploy React app + API endpoints without managing servers

### Minimal Example

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" }
      ]
    }
  ]
}
```

```typescript
// api/get-tts-audio.ts (Serverless function)
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Serverless function auto-deployed to /api/get-tts-audio
  const { text } = req.query;

  if (!text) {
    return res.status(400).json({ error: "Missing text" });
  }

  const audio = await generateTTS(text as string);

  res.setHeader("Content-Type", "audio/mpeg");
  res.send(audio);
}
```

### Deploy Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add GOOGLE_API_KEY
vercel env add DATABASE_URL
```

### Key Lessons

- Serverless functions have 10s timeout (use background jobs for long tasks)
- Environment variables set via Vercel dashboard or CLI
- Use `rewrites` for clean API URLs (`/api/tts` not `/api/get-tts-audio`)
- Enable CORS headers for cross-origin requests
- Vercel auto-detects Vite (no config needed usually)

### When to Use

React apps, serverless APIs, static sites, low-maintenance deployments

---

## Environment Variables

**When Adopted:** Epic 1 (Google Cloud TTS Integration)  
**Why:** Secure secrets, different configs per environment  
**Use Case:** API keys, database URLs, feature flags

### Minimal Example

```bash
# .env.local (Never commit this!)
VITE_API_URL=http://localhost:3000
GOOGLE_API_KEY=AIza...
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecret123
```

```typescript
// vite.config.ts (Expose to frontend safely)
export default defineConfig({
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(process.env.VITE_API_URL),
  },
});

// Frontend usage (only VITE_* vars exposed)
const apiUrl = import.meta.env.VITE_API_URL;

// Backend usage (all vars available)
const apiKey = process.env.GOOGLE_API_KEY;
```

### Best Practices

```typescript
// Type-safe environment variables
interface Env {
  GOOGLE_API_KEY: string;
  DATABASE_URL: string;
  REDIS_URL?: string; // Optional
}

function loadEnv(): Env {
  const required = ["GOOGLE_API_KEY", "DATABASE_URL"];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  return {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY!,
    DATABASE_URL: process.env.DATABASE_URL!,
    REDIS_URL: process.env.REDIS_URL,
  };
}

const env = loadEnv(); // Fails fast if missing
```

### .gitignore

```
# Environment files (NEVER COMMIT!)
.env
.env.local
.env.production

# Example file for documentation
.env.example  # Commit this with dummy values
```

```.env.example
# Copy to .env.local and fill in real values
GOOGLE_API_KEY=your_api_key_here
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
```

### Key Lessons

- Prefix frontend vars with `VITE_` (Vite convention)
- Never commit `.env` files (use `.env.example` for docs)
- Validate required vars on startup (fail fast)
- Use different values per environment (dev, staging, prod)
- Rotate secrets regularly (especially after leaks)
- **Configure FRONTEND_URL for CORS with credentials** (authentication)
- **Use environment-aware cookie settings** (sameSite, secure flags)

### When to Use

All projects with secrets, multi-environment deployments

---

## Production Cookie Configuration (Vercel)

**When Adopted:** Epic 13 Story 13.3  
**Why:** httpOnly cookies require environment-specific configuration for security  
**Use Case:** JWT refresh tokens, session cookies in production

### FRONTEND_URL for CORS

CORS with credentials requires specific origin (not wildcard):

```bash
# .env.local (Development)
FRONTEND_URL=http://localhost:5173

# Vercel Environment Variables (Production)
FRONTEND_URL=https://your-app.vercel.app
```

**Backend Usage:**

```javascript
// apps/backend/src/shared/config/index.js
export default {
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
};

// apps/backend/src/server.js
import cors from "cors";
import config from "./shared/config/index.js";

app.use(
  cors({
    origin: config.frontendUrl, // Loaded from FRONTEND_URL
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
```

### Cookie Secure & SameSite Flags

Production requires HTTPS-only cookies with strict CSRF protection:

```javascript
// Environment-aware cookie configuration
const cookieOptions = {
  httpOnly: true, // Never accessible to JavaScript

  // HTTPS-only in production, HTTP allowed in development
  secure: process.env.NODE_ENV === "production",

  // Strict in production (CSRF protection), lax in dev (allow dev proxy)
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",

  path: "/", // Available to all routes
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Set cookie
res.cookie("refreshToken", token, cookieOptions);

// Clear cookie (MUST use matching options)
const { maxAge, ...clearOptions } = cookieOptions;
res.clearCookie("refreshToken", clearOptions);
```

### Vercel-Specific Considerations

**1. Serverless Function Timeout**

Vercel hobby plan limits functions to 10s execution:

```javascript
// Add timeout warnings for long operations
const timeout = setTimeout(() => {
  console.warn("Function approaching timeout (8s)");
}, 8000);

// Clear timeout when done
clearTimeout(timeout);
```

**2. Connection Pooling Required**

Vercel serverless functions need connection pooling:

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Use connection pooling for serverless
  relationMode = "prisma"
}

// .env.local (Production - use Supabase pooler URL)
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
```

**3. Cookie Domain (Multi-Subdomain)**

If using custom domain with subdomains:

```javascript
// Allow cookie across subdomains
res.cookie("refreshToken", token, {
  ...cookieOptions,
  domain: ".yourdomain.com", // Leading dot = all subdomains
});
```

### Deployment Checklist

Before deploying to Vercel:

**Environment Variables:**

- [ ] `FRONTEND_URL` set to Vercel domain (e.g., `https://app.vercel.app`)
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` uses connection pooling (Supabase pooler)
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` set (use `openssl rand -base64 32`)

**Cookie Configuration:**

- [ ] `secure: true` in production (automatic with `NODE_ENV=production`)
- [ ] `sameSite: strict` in production (CSRF protection)
- [ ] `httpOnly: true` always (XSS protection)
- [ ] Cookie path matches between set and clear operations

**CORS Configuration:**

- [ ] `origin` set to specific Vercel domain (not wildcard)
- [ ] `credentials: true` enabled
- [ ] Frontend uses `credentials: 'include'` in all auth requests

**Testing:**

- [ ] Test login flow in production
- [ ] Verify cookie stored in browser (DevTools > Application > Cookies)
- [ ] Test logout clears cookie
- [ ] Test token refresh works automatically
- [ ] Verify CORS headers in Network tab

### Common Production Issues

**Issue: Cookies work locally but not in Vercel**

**Cause:** `sameSite: strict` + missing `secure: true`

**Fix:**

```javascript
// ❌ BAD: Hardcoded to development settings
res.cookie("refreshToken", token, {
  httpOnly: true,
  sameSite: "lax", // Wrong for production
  secure: false, // Wrong for production
});

// ✅ GOOD: Environment-aware
res.cookie("refreshToken", token, {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  secure: process.env.NODE_ENV === "production",
});
```

**Issue: CORS error in production but not locally**

**Cause:** `FRONTEND_URL` not set or set to localhost

**Fix:**

```bash
# Verify Vercel environment variable
vercel env ls

# Should show:
# FRONTEND_URL (Production): https://your-app.vercel.app

# If missing, add:
vercel env add FRONTEND_URL
# Enter: https://your-app.vercel.app
```

**Issue: Cookie cleared on logout locally but not in production**

**Cause:** Clear options don't match set options

**Fix:** Extract cookie config to shared constant:

```javascript
// shared/config/cookies.js
export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  path: "/",
};

// Usage in authController
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "../config/cookies.js";

// Set
res.cookie("refreshToken", token, {
  ...REFRESH_TOKEN_COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

// Clear (exact matching options)
res.clearCookie("refreshToken", REFRESH_TOKEN_COOKIE_OPTIONS);
```

---

**Related Guides:**

- [Google Cloud Services](./integration-google-cloud.md) — API keys to secure
- [Backend Authentication](./backend-authentication.md) — JWT secrets, httpOnly cookies
- [Caching Strategies](./integration-caching.md) — Redis connection URLs
- [Vite Setup](./vite-setup.md) — Dev proxy cookie forwarding
- [Troubleshooting](./troubleshooting.md) — Cookie & CORS issues
