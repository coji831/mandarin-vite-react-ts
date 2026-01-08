# Vite Configuration Guide

Step-by-step guide for configuring Vite development server with backend proxy and cookie authentication support.

## Basic Configuration

Create `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
```

## Backend Proxy with Cookie Forwarding

Configure proxy to forward cookies between frontend (localhost:5173) and backend (localhost:3001):

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          // Forward Cookie header from browser to backend
          proxy.on("proxyReq", (proxyReq, req, res) => {
            if (req.headers.cookie) {
              proxyReq.setHeader("cookie", req.headers.cookie);
            }
          });

          // Forward Set-Cookie header from backend to browser
          proxy.on("proxyRes", (proxyRes, req, res) => {
            const setCookie = proxyRes.headers["set-cookie"];
            if (setCookie) {
              res.setHeader("set-cookie", setCookie);
            }
          });
        },
      },
    },
  },
});
```

**What this does:**
- Routes `/api/*` requests to `http://localhost:3001`
- `proxyReq`: Sends browser cookies to backend
- `proxyRes`: Sends backend's Set-Cookie headers to browser

**Learn more:** [Frontend Development Server Concepts](../knowledge-base/frontend-development-server.md) - Proxy architecture, cookie forwarding mechanics, event handlers explained

## Frontend Fetch Configuration

Enable credentials in fetch requests:

```typescript
// src/services/api.ts
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  return fetch(`/api${endpoint}`, {
    ...options,
    credentials: "include",  // Send cookies with requests
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

// Usage
const response = await apiRequest("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});
```

## Backend Cookie Configuration

Set cookies with environment-aware options:

```typescript
// Backend: utils/cookieHelpers.ts
export function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",  // lax for dev
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  };
}

// Set cookie
res.cookie("refreshToken", token, getCookieOptions());

// Clear cookie (use same options)
res.clearCookie("refreshToken", getCookieOptions());
```

**⚠️ Critical:** Use `sameSite: "lax"` in development for cross-port requests (localhost:5173 → localhost:3001).

## Environment Variables

Frontend variables must use `VITE_` prefix:

```env
# .env.local
VITE_API_URL=http://localhost:3001
```

Usage:

```typescript
const API_URL = import.meta.env.VITE_API_URL;
```

## Path Aliases

Configure import aliases:

```typescript
// vite.config.ts
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Usage:

```typescript
import { Button } from "@/components/Button";
```

## Troubleshooting

**Cookies not being set:**
1. Verify `credentials: "include"` in frontend fetch
2. Check proxy event handlers are configured
3. Confirm backend uses `sameSite: "lax"` in development
4. Ensure backend CORS has `credentials: true`

**Proxy not forwarding requests:**
1. Confirm requests start with `/api`
2. Check backend is running on port 3001
3. Verify `changeOrigin: true` in proxy config

**Environment variables undefined:**
1. Ensure variable has `VITE_` prefix
2. Restart dev server after changing `.env.local`
3. Check file is named `.env.local` (not `.env.locale`)

## Reference

- **Source**: [Story 13.3: JWT Authentication System](../business-requirements/epic-13-production-backend-architecture/story-13-3-authentication.md)
- [Vite Proxy Documentation](https://vitejs.dev/config/server-options.html#server-proxy)

**Learn more:**
- [Frontend Development Server](../knowledge-base/frontend-development-server.md) - How proxies work, HMR, HTTPS setup
- [Infrastructure Configuration](../knowledge-base/infra-configuration-management.md) - Environment variable strategies

---

**Last Updated:** January 9, 2026
