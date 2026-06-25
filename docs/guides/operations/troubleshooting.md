# Troubleshooting Guide

**Audience:** Developers debugging common development, deployment, and integration issues  
**Last Updated:** June 3, 2026  
**Scope:** Consolidates troubleshooting from backend, frontend, database, infrastructure, and testing guides

> **=��� Tip:** Use `Ctrl+F` to search for your specific error message or keyword.

**Severity Legend:**

- =��� **Critical** G�� Blocks development (requires immediate fix)
- =��� **Common** G�� Frequently encountered (most devs hit this)
- =��� **Rare** G�� Edge case or unusual scenario

---

## =��� Quick Error Lookup (by Keyword)

| Error Message                            | Category                | Severity | Solution                                                                                        |
| ---------------------------------------- | ----------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `ERR_MODULE_NOT_FOUND` (WindowsG��Linux) | Backend Deployment      | =���     | [Case-Sensitivity Fix](#-err_module_not_found-on-railwaylinux-case-sensitivity)                 |
| `ENOTFOUND redis.railway.internal`       | Infrastructure/Redis    | =���     | [Redis Connection](#error-getaddrinfo-enotfound-redisrailwayinternal)                           |
| `MaxRetriesPerRequestError`              | Infrastructure/Redis    | =���     | [Redis Connection](#error-maxretriesperrequest-error-reached-the-max-retries-per-request-limit) |
| `Cookies not visible in browser`         | Authentication/Frontend | =���     | [Cookie Issues](#-cookies-not-visible-in-browser)                                               |
| `CORS error` / `credentials`             | Backend Integration     | =���     | [CORS Credentials Error](#-cors-credentials-error)                                              |
| `Port already in use`                    | Infrastructure          | =���     | [Port in Use](#-port-already-in-use)                                                            |
| `Development server won't start`         | Frontend                | =���     | [Server Startup](#development-server-wont-start)                                                |
| `Module not found` (npm/ts)              | Dependencies            | =���     | [Module Not Found](#module-not-found)                                                           |
| `Type 'undefined' is not assignable`     | TypeScript              | =���     | [TypeScript Errors](#-type-undefined-is-not-assignable)                                         |
| `TextEncoder is not defined`             | Testing                 | =���     | [Test Setup](#-textencoder-is-not-defined)                                                      |
| `Cannot find module '@/...'`             | TypeScript/Testing      | =���     | [Module Mapping](#-cannot-find-module-)                                                         |
| `Test timeout`                           | Testing                 | =���     | [Test Configuration](#-test-timeout)                                                            |
| `Out of memory`                          | Build                   | =���     | [Build Errors](#-out-of-memory)                                                                 |
| `Proxy not forwarding`                   | Frontend/Vite           | =���     | [Proxy Issues](#proxy-not-forwarding-requests)                                                  |
| `Changes not appearing`                  | Frontend                | =���     | [HMR Issues](#changes-not-appearing)                                                            |
| `Redis connection error`                 | Infrastructure/Redis    | =���     | [Redis Issues](#-redis-connection-issues)                                                       |
| `CORS errors persist`                    | Backend                 | =���     | [CORS Setup](#cors-errors-persist)                                                              |
| `JWT authentication failing`             | Backend Auth            | =���     | [Auth Issues](#authentication-middleware-not-working)                                           |
| `Database connection errors`             | Database                | =���     | [Database Issues](#database-connection-errors)                                                  |

---

## =��� Category Index

- [=��� Quick Diagnostics](#-quick-diagnostics)
- [=���n+� Backend / Express Errors](#n+�-backend--express-errors)
- [=��� Frontend / Vite Errors](#-frontend--vite-errors)
- [=�� Authentication & Cookie Issues](#-authentication--cookie-issues)
- [=���n+� Database / Prisma Errors](#-database--prisma-errors)
- [=�ܿ Infrastructure / Redis Errors](#-infrastructure--redis-errors)
- [=��� Testing Errors](#-testing-errors)
- [=��� Build & Deployment Errors](#-build--deployment-errors)
- [G�� Quick Diagnostic Checklists](#-quick-diagnostic-checklists)
- [=��� Reference](#-reference)

---

## =��� Quick Diagnostics

### Development server won't start

```bash
# Kill port process (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Kill port process (Mac/Linux)
lsof -i :5173
kill -9 <PID>
```

### Module not found

```bash
# Clear and reinstall dependencies
npm cache clean --force
Remove-Item -Recurse -Force node_modules    # Windows
rm -rf node_modules                          # Mac/Linux
Remove-Item package-lock.json                # Windows
rm package-lock.json                         # Mac/Linux
npm install
```

### Changes not appearing

1. Hard refresh browser: `Ctrl+Shift+R`
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear browser cache: DevTools G�� Storage G�� Clear site data

### Backend not responding

```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Start backend if needed
npm run dev:backend

# Check port 3001 is not in use
netstat -ano | findstr :3001
```

---

## =���n+� Backend / Express Errors

### =��� CORS Errors Persist

**Symptoms:** Requests blocked by CORS policy, browsers show "Access-Control-Allow-Origin" errors

**Checks:**

1. G�� Verify CORS middleware is **before** routes in Express app
2. G�� Check for duplicate CORS calls
3. G�� Confirm `FRONTEND_URL` is set in `.env.local`
4. G�� Ensure `credentials: true` in both frontend fetch AND backend CORS config

**Example Fix:**

```javascript
// Backend (correct order - CORS before routes)
const cors = require("cors");
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// THEN define routes
app.use("/api", apiRoutes);
```

**Frontend Fix:**

```typescript
fetch("/api/auth/login", {
  method: "POST",
  credentials: "include", // Required!
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

### =��� Authentication Middleware Not Working

**Symptoms:** Requests rejected with 401/403, JWT validation fails

**Checks:**

1. G�� `JWT_SECRET` and `JWT_REFRESH_SECRET` match between sign and verify
2. G�� Token extraction logic handles Bearer prefix correctly
3. G�� Prisma client is properly initialized before auth middleware
4. G�� Token expiration times are reasonable (not immediately expired)
5. G�� Middleware is applied to protected routes

**Example Debug:**

```javascript
// Add logging to auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  console.log("Token extracted:", token ? `${token.substring(0, 20)}...` : "NONE");
  console.log("JWT_SECRET available:", !!process.env.JWT_SECRET);

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified successfully");
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).json({ error: "Invalid token" });
  }
}
```

### =��� Bcrypt/Native Module Issues

**Symptoms:** Tests fail with bcrypt, errors like "bcrypt binding not built"

**Checks:**

1. G�� Vitest uses `pool: "forks"` (not threads) - threads can't use native modules
2. G�� Node.js version 18+
3. G�� bcrypt is properly installed in package.json

**Fix:**

```javascript
// vitest.config.js or vite.config.ts
export default defineConfig({
  test: {
    pool: "forks", // Required for native modules like bcrypt
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
```

**Or rebuild:**

```bash
npm rebuild bcrypt
```

---

## =��� Frontend / Vite Errors

### Proxy not forwarding requests

**Symptoms:** Requests to `/api/*` fail with 404, backend doesn't receive request

**Checks:**

1. G�� Requests start with `/api` (e.g., `/api/v1/auth/login`)
2. G�� Backend is running: `npm run dev:backend` (shows "Backend server running on port 3001")
3. G�� `changeOrigin: true` in `vite.config.ts`
4. G�� `target` points to correct backend URL
5. G�� Check DevTools G�� Network tab for proxy errors
6. G�� Look for "proxy error" logs in terminal where Vite is running

**Debug Steps:**

```typescript
// vite.config.ts - add logging to proxy
server: {
  proxy: {
    "/api": {
      target: "http://localhost:3001",
      changeOrigin: true,
      configure: (proxy) => {
        proxy.on("error", (err, _req, _res) => {
          console.log("Proxy error:", err.message);
        });
        proxy.on("proxyReq", (proxyReq, req) => {
          console.log("Forwarding:", req.method, req.url);
        });
      },
    },
  },
}
```

### Environment variables undefined

**Symptoms:** `VITE_API_URL` is undefined, environment variables not loading

**Checks:**

1. G�� Variable has `VITE_` prefix (Vite requirement for frontend)
2. G�� Dev server restarted after changing `.env.local` (variables embedded at build/startup)
3. G�� File named `.env.local` in **monorepo root** (not `apps/frontend/`)
4. G�� `envDir` in `vite.config.ts` points to `"../.."` (monorepo root)
5. G�� Verify file is loaded: `echo $VITE_API_URL` (Linux/Mac) or `echo %VITE_API_URL%` (Windows PowerShell)

**Example Fix:**

```typescript
// vite.config.ts - ensure correct envDir
import path from "path";

export default defineConfig({
  envDir: path.resolve(__dirname, "../.."), // Monorepo root
  // ...
});
```

### Production deployment issues

**Symptoms:** Works locally but breaks on Vercel/production

**Checks:**

1. G�� `VITE_API_URL` is set in Vercel environment variables (not just `.env.local`)
2. G�� Railway backend URL is accessible: `curl https://backend.railway.app/api/health`
3. G�� Backend `FRONTEND_URL` includes your Vercel domain (CORS allow-list)
4. G�� Test with DevTools G�� Network to see actual fetch URLs
5. G�� Remember: **no proxy in production** G�� uses direct HTTPS requests

**Debug:**

```typescript
// Add logging to see actual URLs in production
console.log("API URL:", import.meta.env.VITE_API_URL);

const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`);
```

### Monorepo-specific issues

**Symptoms:** Can't find modules, configuration not loading, build fails

**Checks:**

1. G�� Run `npm install` from **monorepo root** (not individual app directories)
2. G�� Start commands from root: `npm run dev` (starts both frontend and backend)
3. G�� Root `package.json` includes workspace: `"workspaces": ["apps/*", "packages/*"]`
4. G�� `envDir` in Vite config resolves correctly to repo root

---

## =�� Authentication & Cookie Issues

### =��� Cookies not visible in browser

**Symptoms:** DevTools shows no cookies, even though response headers have Set-Cookie

**Checks:**

1. G�� Frontend uses `credentials: "include"` in fetch
2. G�� Proxy forwards `Set-Cookie` headers in response
3. G�� Backend uses `sameSite: "lax"` (not `"strict"`) in development
4. G�� Backend CORS has `credentials: true` and specific origin (not wildcard)
5. G�� Check DevTools G�� Application G�� Cookies for `refreshToken`

**Fix - Vite Proxy Configuration:**

```typescript
// vite.config.ts - forward cookies in both directions
server: {
  proxy: {
    "/api": {
      target: "http://localhost:3001",
      changeOrigin: true,
      configure: (proxy) => {
        // Forward incoming cookies from browser to backend
        proxy.on("proxyReq", (proxyReq, req) => {
          if (req.headers.cookie) {
            proxyReq.setHeader("cookie", req.headers.cookie);
          }
        });
        // Forward Set-Cookie headers from backend to browser
        proxy.on("proxyRes", (proxyRes, req, res) => {
          const setCookie = proxyRes.headers["set-cookie"];
          if (setCookie) {
            res.setHeader("set-cookie", setCookie);
          }
        });
      },
    },
  },
}
```

**Fix - Backend Cookie Configuration:**

```javascript
// Backend - set cookies with correct options
const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

res.cookie("refreshToken", token, cookieOptions);
```

**Fix - Frontend Fetch:**

```typescript
// Always include credentials
fetch("/api/auth/login", {
  method: "POST",
  credentials: "include", // Critical!
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
```

### =��� Cookie blocked (SameSite warning)

**Symptoms:** Browser console shows SameSite warning, cookies not sent

**Check:** Browser DevTools console for "SameSite" warnings

**Fix:**

```javascript
// Use lax in development, strict in production
res.cookie("refreshToken", token, {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
});
```

### =��� Cookies not cleared on logout

**Symptoms:** Session persists after logout, cookies still in browser

**Fix:** Match options exactly between set and clear:

```javascript
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  path: "/",
};

// Set
res.cookie("refreshToken", token, cookieOptions);

// Clear (MUST use same options)
res.clearCookie("refreshToken", cookieOptions);
```

### =��� Cookies not sent with requests

**Symptoms:** Server doesn't receive cookies in request, Authorization fails

**Fix:** Add `credentials: "include"` to every fetch:

```typescript
fetch("/api/protected", {
  method: "GET",
  credentials: "include", // Required!
});
```

---

## =���n+� Database / Prisma Errors

### =��� Database Connection Errors

**Symptoms:** `Error: Can't reach database`, migrations fail, backend won't start

**Checks:**

1. G�� `DATABASE_URL` format matches Prisma expectations
2. G�� PostgreSQL server is running (local or cloud like Supabase)
3. G�� Connection pooling is enabled if using Railway/Supabase
4. G�� Migrations have been run: `npx prisma migrate dev`
5. G�� No firewall blocking the connection

**Verify Database Connection:**

```bash
# Test connection directly
psql postgresql://user:password@host:5432/db_name

# In Node.js
const prisma = require("@prisma/client").PrismaClient;
const client = new prisma();
client.$connect()
  .then(() => console.log("Connected!"))
  .catch(err => console.error("Error:", err))
  .finally(() => client.$disconnect());
```

**Fix - Update DATABASE_URL:**

```env
# Local development
DATABASE_URL="postgresql://user:password@localhost:5432/mandarin_db"

# Supabase (includes connection pooling)
DATABASE_URL="postgresql://user:password@db.supabase.co:6543/postgres?pgbouncer=true"

# Railway
DATABASE_URL="postgresql://username:password@containers-us-west-xyz.railway.app:5432/railway"
```

**Run Migrations:**

```bash
npx prisma migrate dev
npx prisma generate # If types are missing
```

---

## =�ܿ Infrastructure / Redis Errors

### =��� Redis Connection Issues

**Symptoms:** Redis fails to connect, cache layer disabled, performance impact

**Checks:**

1. G�� `REDIS_URL` format is correct: `redis://default:password@host:port`
2. G�� Redis server is running (Railway or local)
3. G�� Network connectivity to Redis host (no firewall blocking)
4. G�� Application should **gracefully continue** without cache (fail-open)
5. G�� Check health endpoint: `http://localhost:3001/api/health`

**Debug - Check Redis Status:**

```bash
# Check backend logs on startup
npm run dev:backend

# Look for:
# [CacheFactory] Using RedisCacheService (enabled)
# Or: [CacheFactory] Using NoOpCacheService (disabled/fallback)
```

**Verify Redis Connection from Terminal:**

```bash
# If using Railway Redis via public URL
redis-cli -h switchback.proxy.rlwy.net -p 13172 -a YOUR_PASSWORD PING

# Should respond: PONG
```

### Error: `getaddrinfo ENOTFOUND redis.railway.internal`

**Cause:** Attempting to connect to Railway's internal Redis hostname from local machine (not supported)

**Solution:**

- Comment out `REDIS_URL` in `.env.local` for local development
- Or use Railway's public proxy URL: `redis://default:password@switchback.proxy.rlwy.net:PORT`

**Verification:**

```bash
# Should see:
[Redis Config Warning] Skipping Redis connection: Railway internal hostname detected
[CacheFactory] Using NoOpCacheService
```

**Impact:** Minimal - GCS cache layer still works, only Redis layer disabled

### Error: `MaxRetriesPerRequestError: Reached the max retries per request limit`

**Cause:** Redis client trying to connect to unreachable host, retrying exhausted

**Solution:** Same as above - disable `REDIS_URL` for local dev:

```env
# .env.local (local development)
# REDIS_URL=          (leave commented out)
CACHE_ENABLED=false
```

**Production Fix:**

```env
# .env.production
REDIS_URL="redis://default:password@redis.railway.internal:6379"
CACHE_ENABLED=true
```

### =��� Redis connection error: "Redis is already connecting/connected"

**Cause:** Multiple attempts to initialize Redis client simultaneously

**Fix:** Ensure single Redis client instance:

```javascript
// container.js - create only once
let redisClient;

export function getRedisClient() {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}
```

### =��� Redis connection refused

**Cause:** Redis server not running or wrong connection details

**Fix:**

1. Verify Redis is running (Railway dashboard or local instance)
2. Verify REDIS_URL is correct
3. Check credentials (password may be wrong)
4. Try fallback: disable Redis caching in development

---

## =��� Testing Errors

### =��� "TextEncoder is not defined"

**Cause:** Node.js test environment doesn't have TextEncoder (browsers have it)

**Fix:** Add to `setupTests.ts`:

```typescript
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
```

### =��� "Property does not exist on type"

**Cause:** TypeScript interface missing property or incomplete definition

**Fix:**

```typescript
// Add property to interface
interface User {
  name: string;
  age?: number; // Optional property
}

// Or use optional chaining
const age = user?.age ?? 0;
```

### =��� "Cannot find module '@/...'"

**Cause:** Module path alias not configured for tests

**Fix - Vitest Config:**

```typescript
// vitest.config.ts or vite.config.ts
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Or in tsconfig.json:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### =��� "Test timeout"

**Cause:** Test takes longer than default timeout (5 seconds)

**Fix:** Increase timeout for specific test:

```typescript
test("loads data", async () => {
  // Long-running test
}, 10000); // 10 seconds
```

**Or globally in vitest config:**

```typescript
test: {
  testTimeout: 10000,
}
```

---

## =��� Build & Deployment Errors

### =��� "ERR_MODULE_NOT_FOUND" on Railway/Linux (Case-Sensitivity)

**Symptom:** Backend works locally on Windows but fails on Railway with error like:

```
Error: Cannot find module './controllers/vocabularyController.js'
```

**Root Cause:**

- Git doesn't track filename case changes by default on Windows
- Windows is case-insensitive but Linux (Railway) is case-sensitive
- File might be named `VocabularyController.js` but imported as `vocabularyController.js`

**Solution - Force Git to recognize case:**

```bash
# 1. Force Git to recognize case change
git rm --cached apps/backend/src/api/controllers/VocabularyController.js

# 2. Rename file to lowercase
git add apps/backend/src/api/controllers/vocabularyController.js

# 3. Commit and push
git commit -m "fix: rename VocabularyController to lowercase for Linux compatibility"
git push
```

**Prevention:** Use lowercase for all filenames in backend code:

```
G�� Bad:  VocabularyController.js, UserService.ts
G�� Good: vocabularyController.js, userService.ts
```

### =��� Out of memory

**Symptoms:** Build fails with "JavaScript heap out of memory"

**Fix:**

```bash
# Windows
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Mac/Linux
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### =��� Port already in use

**Symptoms:** Can't start dev server, error says port 5173 or 3001 is already in use

**Fix:**

```bash
# Find process on port 5173 (frontend)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or for port 3001 (backend)
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## G�� Quick Diagnostic Checklists

### =�� Cookie Authentication Not Working? Check:

1. G�� Backend sets `Set-Cookie` header in response?
   - Check: DevTools G�� Network G�� Response headers
2. G�� Cookie visible in DevTools?
   - Check: DevTools G�� Application G�� Cookies
3. G�� Request includes `Cookie` header?
   - Check: DevTools G�� Network G�� Request headers
4. G�� Frontend uses `credentials: "include"`?
   - Check: API client code
5. G�� Backend CORS has `credentials: true` + specific origin?
   - Check: Backend Express setup
6. G�� Vite proxy forwards cookie headers?
   - Check: vite.config.ts proxy configuration

### =��� State Not Working? Check:

- G�� **Infinite re-render:** Move `setState` to useEffect or event handler
- G�� **State not persisting:** Check localStorage, verify JSON serialization
- G�� **Context not updating:** Verify reducer is called, check dispatch syntax
- G�� **Stale state:** Check dependency arrays in useEffect

### =��� Development Server Won't Start? Check:

- G�� Port 5173 is free: `netstat -ano | findstr :5173`
- G�� Port 3001 is free (backend): `netstat -ano | findstr :3001`
- G�� Dependencies installed: `npm install` from root
- G�� Node version 18+: `node --version`
- G�� All environment variables set: `echo %VITE_API_URL%`

### =��� API Requests Failing? Check:

- G�� Backend is running: `npm run dev:backend`
- G�� Backend responds: `curl http://localhost:3001/api/health`
- G�� Request includes `credentials: "include"`
- G�� VITE_API_URL set correctly
- G�� No CORS errors in console
- G�� DevTools G�� Network shows actual request/response

---

## =��� Reference

### Project Documentation Links

- [Backend Development Guide](./backend-development-guide.md) - Express setup, authentication, database
- [Frontend Development Guide](./frontend-development-guide.md) - React, Vite, routing (coming soon)
- [Backend Testing Guide](./backend-testing-guide.md) - Service/repository testing
- [Frontend Testing Guide](./frontend-testing-guide.md) - Component/hook testing
- [Environment Setup Guide](./environment-setup-guide.md) - All environment variables
- [Redis Setup Guide](./redis-setup-guide.md) - Cache configuration and setup
- [Vite Setup Guide](./vite-setup-guide.md) - Dev server, proxy setup
- [Database Setup Guide](./database-setup-guide.md) - PostgreSQL, Prisma setup
- [Deployment Guide](../deployment-guide.md) - Vercel, Railway deployment

### External Documentation

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [JWT.io](https://jwt.io/introduction)

### Knowledge Base Articles

- [Frontend Development Server](../knowledge-base/frontend/frontend-development-server.md) - Proxy mechanics, cookies, HMR
- [Backend Architecture](../knowledge-base/backend/backend-architecture.md) - Layers, patterns, CORS deep-dive
- [Authentication Concepts](../knowledge-base/backend/backend-authentication.md) - OAuth, SSO, JWT strategies
- [Caching Strategies](../knowledge-base/infrastructure/integration-caching.md) - Cache-aside, Redis patterns

---

**Last Updated:** June 3, 2026
