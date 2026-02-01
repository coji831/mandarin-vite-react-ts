# Vite Configuration Guide

**Category:** Configuration  
**Audience:** Frontend developers configuring dev environment  
**Last Updated:** January 30, 2026

Configuration guide for the frontend development server in the monorepo. Covers proxy setup for local backend communication and production deployment considerations.

**Project Context:**

- **Monorepo**: Frontend in `apps/frontend/`, backend in `apps/backend/`
- **Development**: Vite dev server (port 5173) proxies `/api/*` to Express backend (port 3001)
- **Production**: Frontend deployed to Vercel, backend to Railway (direct HTTPS communication)

---

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

---

## Development Proxy Configuration

**Purpose:** In development, the Vite proxy forwards frontend requests to the local Express backend, enabling seamless full-stack development.

**Architecture:**

```
Browser → Vite (localhost:5173) → Proxy → Express (localhost:3001)
          /api/* requests are forwarded
```

⚠️ **Critical Warning**: The proxy intercepts `/api/*` requests **before** your fetch logic sees them. This can mask incorrect `VITE_API_URL` configuration. Always test without the proxy before deploying to ensure production URLs are correct.

### Current Configuration

File: `apps/frontend/vite.config.ts`

```typescript
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, "../.."), // Load .env from monorepo root
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001", // Local Express backend
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });

          // Forward Set-Cookie headers from backend to browser
          proxy.on("proxyRes", (proxyRes, _req, res) => {
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

### Configuration Explained

1. **`envDir`**: Points to monorepo root to load shared `.env` files
2. **`changeOrigin: true`**: Required for cross-origin proxy (different ports)
3. **`secure: false`**: Allows HTTP in development (production uses HTTPS)
4. **Cookie Forwarding**: `proxyRes` handler forwards `Set-Cookie` headers from backend
5. **Error Handling**: Logs proxy errors for debugging

### Why Cookie Forwarding Matters

JWT refresh tokens are stored in httpOnly cookies for security. The proxy must forward `Set-Cookie` headers from the backend to the browser, otherwise authentication breaks.

**Learn more:** [Frontend Development Server Concepts](../knowledge-base/frontend-development-server.md) - Proxy architecture, cookie forwarding mechanics, event handlers explained

---

## Production Deployment

**Architecture:**

```
Browser → Vercel (Frontend) → Railway (Backend via HTTPS)
          Direct fetch() calls to backend URL
          NO PROXY in production
```

### Key Differences from Development

1. **No Proxy**: Production frontend makes direct HTTPS requests to Railway backend
2. **Environment Variable**: `VITE_API_URL` must point to Railway backend URL (e.g., `https://mandarin-backend.up.railway.app`)
3. **CORS**: Backend CORS must allow Vercel origin (configured via `FRONTEND_URL` env var)
4. **Cookies**: httpOnly cookies work across domains if CORS credentials enabled

### Production Configuration

```env
# .env.production (Vercel environment variables)
VITE_API_URL=https://mandarin-backend.up.railway.app
```

### Vercel Deployment

- Automatic deployment on push to `main` branch
- Build command: `npm run build` (runs Vite build from monorepo)
- Output directory: `apps/frontend/dist`
- Environment variables configured in Vercel dashboard

### Railway Backend

- Deployed from `apps/backend/` directory
- Exposes REST API at `/api/*` routes
- CORS configured to accept requests from Vercel domain
- See [Backend Setup Guide](./backend-setup-guide.md) for deployment details

---

## Frontend Fetch Configuration

### API Client

File: `src/config/api.ts`

```typescript
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  timeout: 10000,
  withCredentials: true,
} as const;

export function getApiUrl(endpoint: string): string {
  return API_CONFIG.baseURL + endpoint;
}
```

### Unified API Client

File: `src/services/apiClient.ts`

```typescript
import { API_CONFIG, getApiUrl } from "../config/api";
import { authFetch } from "../features/auth/utils/authFetch";

export class ApiClient {
  // Authenticated requests (auto-handles JWT refresh)
  static async authRequest(endpoint: string, options?: RequestInit): Promise<Response> {
    return authFetch(endpoint, options);
  }

  // Public requests (no authentication required)
  static async publicRequest(endpoint: string, options?: RequestInit): Promise<Response> {
    const url = getApiUrl(endpoint);
    return fetch(url, {
      ...options,
      credentials: "include", // Send cookies with requests
    });
  }

  static get config() {
    return API_CONFIG;
  }
}
```

### How It Works

**Development:** `VITE_API_URL` is empty or `http://localhost:3001`
- Requests go to `/api/*` (relative URL)
- Vite proxy intercepts and forwards to localhost:3001
- Cookies forwarded by proxy configuration

**Production:** `VITE_API_URL` is Railway backend URL
- Requests go to full URL (e.g., `https://backend.railway.app/api/*`)
- No proxy involved (direct HTTPS fetch)
- Cookies sent via `credentials: "include"`

### Example Usage

```typescript
import { ApiClient } from "@/services/apiClient";
import { API_ROUTES } from "@mandarin/shared-constants";

// Authenticated request (requires JWT)
const response = await ApiClient.authRequest(API_ROUTES.auth.login, {
  method: "POST",
  body: JSON.stringify({ email, password }),
});

// Public request (no authentication)
const healthResponse = await ApiClient.publicRequest("/api/health");
```

**Why Use `ApiClient`?**

- Automatic JWT refresh handling
- Consistent credential forwarding
- Centralized error handling
- Easy migration to React Query later

---

## Backend Cookie Configuration

Set cookies with environment-aware options:

```typescript
// Backend: utils/cookieHelpers.ts
export function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax", // lax for dev
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

// Set cookie
res.cookie("refreshToken", token, getCookieOptions());

// Clear cookie (use same options)
res.clearCookie("refreshToken", getCookieOptions());
```

**⚠️ Critical:** Use `sameSite: "lax"` in development for cross-port requests (localhost:5173 → localhost:3001).

---

## Environment Variables

### Monorepo Structure

```
mandarin-vite-react-ts/
├── .env.example         # Template for all environment variables
├── .env.local           # Local development overrides (gitignored)
├── apps/
│   ├── frontend/
│   │   └── vite.config.ts  # Points envDir to monorepo root
│   └── backend/
└── packages/
```

### Frontend Variables

Must use `VITE_` prefix:

```env
# .env.local (monorepo root)
VITE_API_URL="http://localhost:3001"  # Development
# VITE_API_URL="https://backend.railway.app"  # Production (set in Vercel)
```

**Usage in Frontend Code:**

```typescript
// Accessed via import.meta.env (Vite-specific)
const API_URL = import.meta.env.VITE_API_URL;

// Centralized in src/config/api.ts for consistency
import { API_CONFIG } from "@/config/api";
console.log(API_CONFIG.baseURL); // "http://localhost:3001"
```

### Backend Variables

No prefix required:

```env
# Backend reads from same .env.local file
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
FRONTEND_URL="http://localhost:5173"
```

### Important Notes

1. **`.env.local` is gitignored** - never commit secrets
2. **Frontend variables are embedded at build time** - changing them requires rebuild
3. **Backend variables are runtime** - can change without rebuild
4. **Vite only exposes variables with `VITE_` prefix** to frontend code

---

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

---

## Troubleshooting

### Cookies not being set

1. Verify `credentials: "include"` in ApiClient requests
2. Check proxy `proxyRes` handler forwards `Set-Cookie` headers
3. Confirm backend uses `sameSite: "lax"` in development (not `"strict"`)
4. Ensure backend CORS has `credentials: true` and matches frontend origin
5. Check browser DevTools → Application → Cookies for `refreshToken`

### Proxy not forwarding requests

1. Confirm requests start with `/api` (e.g., `/api/v1/auth/login`)
2. Check backend is running: `npm run start-backend` (should show "Backend server running on port 3001")
3. Verify `changeOrigin: true` in `vite.config.ts`
4. Check browser DevTools → Network tab for proxy errors
5. Look for "proxy error" logs in terminal where Vite is running

### Environment variables undefined

1. Ensure variable has `VITE_` prefix (frontend requirement)
2. Restart dev server after changing `.env.local` (variables embedded at startup)
3. Check file is named `.env.local` in **monorepo root** (not `apps/frontend/`)
4. Verify `envDir` in `vite.config.ts` points to `"../.."` (monorepo root)
5. Run `echo $VITE_API_URL` (Linux/Mac) or `echo %VITE_API_URL%` (Windows) to check if loaded

### Production deployment issues

1. Verify `VITE_API_URL` is set in Vercel environment variables (not just `.env.local`)
2. Check Railway backend URL is accessible: `curl https://backend.railway.app/api/health`
3. Ensure backend `FRONTEND_URL` includes your Vercel domain (CORS)
4. Test with browser DevTools → Network tab to see actual fetch URLs
5. Remember: proxy doesn't exist in production (direct HTTPS requests)

### Monorepo-specific issues

1. Run `npm install` from **monorepo root** (not individual app directories)
2. Start commands from root: `npm run dev` (starts both frontend and backend)
3. Check workspace configuration in root `package.json` includes `apps/*`
4. Verify `envDir` in Vite config resolves correctly: `path.resolve(__dirname, "../..")` should point to repo root

---

## Backend Testing Configuration

> **Note:** For backend testing configuration (Vitest, Prisma integration), see [Testing Guide](testing-guide.md#backend-testing).

---

## Reference

### Official Documentation

- [Vite Server Options](https://vitejs.dev/config/server-options.html) - Proxy configuration
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html) - `VITE_` prefix requirement

### Project Documentation

- [Backend Setup Guide](./backend-setup-guide.md) - Railway deployment, CORS configuration
- [Environment Setup Guide](./environment-setup-guide.md) - Complete environment variable reference
- [Testing Guide](./testing-guide.md) - Backend testing setup with Vitest
- [Architecture Overview](../architecture.md) - High-level system design

### Knowledge Base

- [Frontend Development Server](../knowledge-base/frontend-development-server.md) - Proxy mechanics, HMR, HTTPS setup
- [Infrastructure Configuration](../knowledge-base/infra-configuration-management.md) - Environment variable best practices

### Related Files

- `apps/frontend/vite.config.ts` - Current proxy configuration
- `apps/frontend/src/config/api.ts` - API URL configuration
- `apps/frontend/src/services/apiClient.ts` - Unified API client
- `.env.example` - Environment variable template

---

**Last Updated:** January 30, 2026
