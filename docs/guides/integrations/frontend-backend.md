# Frontend-Backend Integration Guide

**Last Updated:** June 3, 2026  
**Purpose:** Unified guide for cookie-based authentication, CORS setup, API communication, and frontend-backend sync  
**Audience:** Full-stack developers configuring auth, debugging CORS/cookie issues, or integrating frontend clients with backend

---

## Overview

This application uses **cookie-based JWT authentication** with credential forwarding between frontend (localhost:5173) and backend (localhost:3001/Railway). The frontend sends requests to the backend with cookies enabled, the backend validates JWT tokens, and both services must be precisely configured for authentication to work.

**Architecture Summary:**

```
Frontend Request (with credentials)
  Γåô
Vite Proxy (dev) or direct HTTPS (production)
  Γåô
Backend CORS Middleware
  Γåô
JWT Verification Middleware
  Γåô
Protected Route Handler
  Γåô
Response with Set-Cookie header (if refresh token rotation)
```

---

## CORS Configuration

### Backend Setup

**File:** `apps/backend/src/shared/middleware/` (CORS is configured in `app/index.js`)

```javascript
import cors from "cors";

export const corsMiddleware = cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true, // CRITICAL: Enables cookie forwarding
});
```

**Environment Variable:**

```env
# .env.local
FRONTEND_URL=http://localhost:5173  # Dev: localhost, Prod: Vercel domain
```

**Server Initialization:**

```javascript
// apps/backend/src/app/index.js
import express from "express";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "../shared/middleware/index.js";

const app = express();

app.use(cookieParser()); // Parse Cookie headers
app.use(corsMiddleware); // CORS configuration (apply ONCE only)
// ... then routes ...
```

### Critical Rules

ΓÜá∩╕Å **These rules must all be satisfied or authentication breaks:**

1. **Apply CORS middleware ONCE** at the app level (duplicate CORS configurations break credentials)
2. **Set `credentials: true`** in CORS options to allow cookie forwarding
3. **`origin` must exactly match frontend URL** ΓÇö including protocol (`http://` vs `https://`)
4. **Backend and frontend must be on same domain** for cookies to work (or use httpOnly + SameSite workaround)
5. **CORS must be applied before routes** (middleware order matters)

### Development vs Production

**Local Development (Vite):**

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- CORS origin: `http://localhost:5173`
- Cookies: Forwarded by Vite proxy to backend
- Credentials: `include` in fetch requests

**Production (Vercel + Railway):**

- Frontend: `https://yourapp.vercel.app`
- Backend: `https://yourapp-backend.railway.app`
- CORS origin: `https://yourapp.vercel.app`
- Cookies: Direct HTTPS requests, no proxy
- Credentials: `include` in fetch requests

---

## Cookie-Based Authentication Flow

### Request/Response Lifecycle

**Step 1: Login Request**

Frontend sends credentials:

```typescript
// Frontend: src/services/AuthService.ts
const response = await fetch("http://localhost:3001/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // CRITICAL: Include cookies in request
  body: JSON.stringify({ email: "user@example.com", password: "secret" }),
});
```

**Step 2: Backend Response**

Backend validates credentials and sends httpOnly cookie:

```typescript
// Backend: apps/backend/src/routes/auth.js
app.post("/api/v1/auth/login", async (req, res) => {
  const user = await AuthService.authenticate(req.body);
  const accessToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(user, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

  // Set httpOnly cookie (secure in production)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // Not accessible via JavaScript (XSS protection)
    secure: true, // HTTPS only in production
    sameSite: "lax", // CSRF protection
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    accessToken, // Send in response (client stores in memory)
    user: { id: user.id, email: user.email },
  });
});
```

**Step 3: Authenticated Requests**

Frontend sends accessToken in Authorization header:

```typescript
// Frontend: Each API call
const response = await fetch("http://localhost:3001/api/v1/vocab", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${accessToken}`, // Access token in header
    "Content-Type": "application/json",
  },
  credentials: "include", // Browser automatically includes refreshToken cookie
});
```

**Step 4: Token Rotation**

Backend validates accessToken; if expired, issues new one via refresh token in cookie:

```typescript
// Backend middleware
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      // Refresh token logic
      const refreshToken = req.cookies.refreshToken;
      const newAccessToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "15m" });
      res.set("X-New-Access-Token", newAccessToken);
      req.user = user;
      next();
    } else {
      res.status(403).json({ error: "Invalid token" });
    }
  }
}
```

---

## Vite Proxy Configuration

### Development Server Proxy

**File:** `apps/frontend/vite.config.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true, // Mask origin from backend perspective
        credentials: true, // Forward cookies
        proxyRes: (proxyRes, req, res) => {
          // Forward Set-Cookie headers back to client
          const setCookie = proxyRes.headers["set-cookie"];
          if (setCookie) {
            res.setHeader("Set-Cookie", setCookie);
          }
        },
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

### Proxy Behavior

**How the proxy works:**

1. Frontend request to `/api/v1/auth/login` ΓåÆ Intercepted by proxy
2. Rewritten to `http://localhost:3001/api/v1/auth/login`
3. Backend processes request as if it came from the same origin
4. Response headers (like `Set-Cookie`) forwarded back to frontend
5. Browser cookie jar stores `refreshToken` automatically

**Important Notes:**

- ΓÜá∩╕Å **Proxy only exists in development** ΓÇö production uses direct HTTPS calls
- Γ£à `credentials: true` ensures cookies are included in proxied requests
- Γ£à `changeOrigin: true` masks the origin (backend sees frontend as local)
- Γ£à `proxyRes` handler ensures `Set-Cookie` headers reach the browser

---

> **Complete Guide:** See [API Client Patterns](../conventions/api-client.md) for the `apiClient` setup, axios interceptors, error handling, and service layer patterns.

---

## Environment Configuration

### Required Variables

**`.env.local` (at project root):**

```env
# Frontend (Vite prefix required)
VITE_API_URL=http://localhost:3001  # Must match backend URL
FRONTEND_URL=http://localhost:5173

# Backend
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-in-production
JWT_REFRESH_SECRET=different-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

**Production (Railway / Vercel):**

```env
# Vercel Environment Variables
VITE_API_URL=https://yourapp-backend.railway.app

# Railway Backend Environment Variables
FRONTEND_URL=https://yourapp.vercel.app
JWT_SECRET=[generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
JWT_REFRESH_SECRET=[generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
```

---

## Common Issues & Solutions

### Cookies Not Visible in Browser

**Symptoms:**

- `refreshToken` not in DevTools ΓåÆ Application ΓåÆ Cookies
- Login works but subsequent requests fail with 401

**Checklist:**

1. Γ£à **Backend sets `httpOnly: true`** (not accessible via JavaScript for security)
2. Γ£à **Frontend sends `credentials: "include"`** in fetch options
3. Γ£à **Backend CORS has `credentials: true`** (not just `credentials: true` in proxy)
4. Γ£à **Domain matches exactly** ΓÇö including protocol (http vs https)
5. Γ£à **Development:** Vite proxy `proxyRes` handler forwards Set-Cookie

**Debug:**

```typescript
// Frontend: Check request headers
fetch("http://localhost:3001/api/v1/auth/login", {
  credentials: "include", // Must be included
}).then((r) => {
  console.log(r.headers.get("set-cookie")); // Won't show (httpOnly)
});

// Backend: Verify cookie is set
res.cookie("refreshToken", token, {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
});
```

### CORS Error: "Credentials mode is 'include'"

**Symptoms:**

```
Access to XMLHttpRequest ... CORS policy: Credentials mode is 'include', but CORS header
'Access-Control-Allow-Credentials' is missing
```

**Solution:**

Backend CORS must explicitly allow credentials:

```typescript
// Γ¥î Wrong
cors({
  origin: "http://localhost:5173",
  // Missing: credentials: true
});

// Γ£à Correct
cors({
  origin: "http://localhost:5173",
  credentials: true, // Required
});
```

### Proxy Not Forwarding Requests

**Symptoms:**

- Requests to `/api/*` in dev server show as failed
- Backend logs don't show the request

**Checklist:**

1. Γ£à **Backend is running** ΓÇö `npm run dev:backend` (port 3001)
2. Γ£à **Request path starts with `/api`** ΓÇö e.g., `/api/v1/auth/login`
3. Γ£à **Vite config has proxy configured** for `/api` target
4. Γ£à **Proxy `changeOrigin: true`** ΓÇö backend should see request as local
5. Γ£à **Check browser DevTools ΓåÆ Network tab** for actual request URL

**Debug:**

```typescript
// Add request logging to Vite config
server: {
  proxy: {
    "/api": {
      target: "http://localhost:3001",
      changeOrigin: true,
      logLevel: "debug",  // Shows proxy activity
    }
  }
}
```

### Token Rotation Not Working

**Symptoms:**

- Access token expires
- Next request fails with 401 even though refresh token exists

**Checklist:**

1. Γ£à **Backend returns new token** in `X-New-Access-Token` header (or in response body)
2. Γ£à **Frontend stores new token** when refreshed
3. Γ£à **Refresh token in cookie** has not expired (7 days)
4. Γ£à **Cookie is being sent** (check DevTools Network tab, request cookies section)
5. Γ£à **CORS allows credentials** (backend `credentials: true`)

---

## Reference

### Related Guides

- [Environment Setup Guide](../getting-started/environment-setup.md) ΓÇö All environment variables
- [Backend Development Guide](../setup/backend-development.md) — Server setup, middleware
- [Vite Setup Guide](../setup/vite.md) — Frontend dev server, proxy
- [Troubleshooting Guide](./troubleshooting.md) ΓÇö Common CORS/cookie errors

### Knowledge Base

- [Backend Architecture: CORS Deep Dive](../knowledge-base/backend-architecture.md#cors-cross-origin-resource-sharing-deep-dive) ΓÇö Preflight requests, credentials handling
- [Backend Authentication](../knowledge-base/backend-authentication.md) ΓÇö JWT patterns, refresh strategies, security
- [API Response Patterns](../knowledge-base/api-response-patterns.md) ΓÇö Request/response shape conventions

### Implementation Files

- **Backend CORS:** `apps/backend/src/shared/middleware/`
- **Backend Auth:** `apps/backend/src/modules/auth/services/AuthService.js`
- **Frontend API Client:** `apps/frontend/src/services/ApiClient.ts`
- **Vite Config:** `apps/frontend/vite.config.ts`

---

**Last Updated:** June 3, 2026
