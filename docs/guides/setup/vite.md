# Vite Setup Guide

**Last Updated:** June 3, 2026
**Purpose:** Configure Vite for React frontend development, including dev server, proxy setup, and build optimization
**Audience:** Frontend developers setting up and configuring the Vite development environment

> **When to read this:** When configuring the Vite dev server, setting up the development proxy to the backend, troubleshooting build or HMR issues, or preparing a production deployment.

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

### Cookie Forwarding

The `proxyRes` handler above forwards `Set-Cookie` headers from the backend to the browser, which is required for httpOnly refresh token cookies.

> **Complete authentication reference:** See [Frontend-Backend Integration Guide](../integrations/frontend-backend.md) for CORS setup, JWT authentication flow, token refresh lifecycle, and troubleshooting.

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
- See [Backend Setup Guide](./backend-development.md) for deployment details

---

## Frontend Fetch Configuration

> **Complete API client patterns:** See [API Client Patterns](../conventions/api-client.md) for the full `ApiClient` setup, authenticated request handling, and JWT refresh logic.

### Environment Variable

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

// Development: VITE_API_URL is "http://localhost:3001" (proxy handles /api/*)
// Production:  VITE_API_URL is Railway backend URL (direct HTTPS fetch)
```

> **Auth & cookie setup:** See [Frontend-Backend Integration Guide](../integrations/frontend-backend.md) for cookie-based JWT flow, `credentials: "include"`, and CORS configuration.

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

> **Troubleshooting Guide:** See [Troubleshooting Guide](../operations/troubleshooting.md) for comprehensive debugging help.
>
> Common Vite/proxy issues covered:
>
> - [Proxy not forwarding requests](../operations/troubleshooting.md#proxy-not-forwarding-requests)
> - [Environment variables undefined](../operations/troubleshooting.md#environment-variables-undefined)
> - [Production deployment issues](../operations/troubleshooting.md#production-deployment-issues)
> - [Monorepo-specific issues](../operations/troubleshooting.md#monorepo-specific-issues)
>
> Cookie authentication issues:
>
> - [Cookies not visible](../operations/troubleshooting.md#-cookies-not-visible-in-browser)
> - [Proxy cookie forwarding](../operations/troubleshooting.md#-cookies-not-visible-in-browser)

---

## Backend Testing Configuration

> **Note:** For backend testing configuration (Vitest, Prisma integration), see [Backend Testing Guide](../testing/backend.md#backend-testing).

---

## Reference

### Official Documentation

- [Vite Server Options](https://vitejs.dev/config/server-options.html) - Proxy configuration
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html) - `VITE_` prefix requirement

### Project Documentation

- [Backend Setup Guide](./backend-development.md) - Railway deployment, CORS configuration
- [Environment Setup Guide](../getting-started/environment-setup.md) - Complete environment variable reference
- [Backend Testing Guide](../testing/backend.md) - Backend testing setup with Vitest
- [Architecture Overview](../../architecture.md) - High-level system design

- [Frontend Development Server](../../knowledge-base/frontend/frontend-development-server.md) - Proxy mechanics, HMR, HTTPS setup
- [Infrastructure Configuration](../../knowledge-base/infrastructure/infra-configuration-management.md) - Environment variable best practices

### Related Files

- `apps/frontend/vite.config.ts` - Current proxy configuration
- `apps/frontend/src/config/api.ts` - API URL configuration
- `apps/frontend/src/services/apiClient.ts` - Unified API client
- `.env.example` - Environment variable template

---

## Verification

Confirm your Vite dev server starts successfully:

```bash
# Start the frontend dev server
npm run dev --workspace=@mandarin/frontend

# Open in browser
# Expected: http://localhost:5173 loads the application without errors
```

**Expected result:** The application loads at `localhost:5173` without console errors.

---

**Last Updated:** June 3, 2026
