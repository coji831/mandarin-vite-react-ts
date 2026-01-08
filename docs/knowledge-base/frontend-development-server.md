# Frontend Development Server Concepts

**Category:** Frontend Development  
**Last Updated:** January 9, 2026

---

## Overview

Modern frontend development servers (Vite, Webpack Dev Server, Parcel) provide more than just file serving. They act as development-time reverse proxies, hot module replacement engines, and request interceptors. Understanding their architecture helps debug proxy issues, configure authentication flows, and optimize development experience.

---

## Dev Proxy Architecture

### How Development Proxies Work

A development server proxy sits between your frontend code (running at `localhost:3000` or similar) and your backend API (running at `localhost:8080` or remote server). This solves the Same-Origin Policy problem during development.

**Without Proxy:**

```
Browser (localhost:3000)
    ↓ CORS error (different origin)
Backend API (localhost:8080)
```

**With Proxy:**

```
Browser (localhost:3000)
    ↓ Same origin request to /api/*
Dev Server Proxy (localhost:3000)
    ↓ Forwards to backend
Backend API (localhost:8080)
```

From the browser's perspective, all requests go to `localhost:3000`, eliminating CORS issues during development.

### Request/Response Flow

1. **Browser Request**: `fetch('http://localhost:3000/api/users')`
2. **Proxy Matches**: Dev server sees `/api/*` pattern in config
3. **Rewrite**: Strips `/api` prefix → `/users`
4. **Forward**: Sends to `http://localhost:8080/users`
5. **Backend Responds**: Returns data
6. **Proxy Forwards**: Passes response back to browser
7. **Browser Receives**: Thinks it came from `localhost:3000`

### Why This Matters

- **Development/Production Parity**: Production uses same-origin APIs (deployed together); development simulates this
- **CORS Avoidance**: No need to configure CORS during development
- **Cookie Handling**: Cookies sent to same origin automatically
- **Security Testing**: Test authentication flows in realistic environment

---

## Cookie Forwarding in Proxied Environments

### The Cookie Problem

HTTP cookies are domain-specific. When your frontend runs on `localhost:5173` and backend on `localhost:3001`, browsers treat these as **different origins** (different ports = different origins).

**Default Behavior:**

- Backend sets cookie for `localhost:3001`
- Browser stores cookie under `localhost:3001` domain
- Frontend makes request through proxy to `localhost:5173/api/*`
- Browser **does NOT** send `localhost:3001` cookies (different origin)

### Cookie Forwarding Mechanics

Development proxies must **explicitly forward** cookie headers in both directions:

**Outgoing (Browser → Backend):**

```
Browser Request Headers:
  Cookie: refreshToken=abc123

Proxy intercepts and forwards:
  Cookie: refreshToken=abc123
  → Backend receives cookies
```

**Incoming (Backend → Browser):**

```
Backend Response Headers:
  Set-Cookie: refreshToken=xyz789; HttpOnly

Proxy intercepts and forwards:
  Set-Cookie: refreshToken=xyz789; HttpOnly
  → Browser stores cookie for localhost:5173
```

### Implementation Pattern (Vite Example)

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        configure: (proxy, options) => {
          // Forward cookies FROM browser TO backend
          proxy.on("proxyReq", (proxyReq, req, res) => {
            if (req.headers.cookie) {
              proxyReq.setHeader("cookie", req.headers.cookie);
            }
          });

          // Forward Set-Cookie FROM backend TO browser
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

### sameSite Cookie Attribute

The `sameSite` attribute controls whether cookies are sent in cross-site contexts:

- **`strict`**: Cookie only sent for same-site requests (production setting)
- **`lax`**: Cookie sent for top-level navigation GET requests (development compromise)
- **`none`**: Cookie sent for all cross-site requests (requires `secure: true`)

**Development Challenge:**

`localhost:5173` → `localhost:3001` is considered **cross-site** (different ports). Cookies with `sameSite: strict` are blocked.

**Solution:**

Use environment-aware cookie configuration:

```javascript
// Backend: Set cookie with appropriate sameSite
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  path: "/",
};
```

This maintains production security while enabling development workflows.

---

## Proxy Event Handlers Explained

Modern proxy libraries (http-proxy-middleware, Vite's built-in proxy) emit events during the proxy lifecycle. Handlers allow request/response manipulation.

### Common Events

| Event      | Trigger                      | Use Cases                                      |
| ---------- | ---------------------------- | ---------------------------------------------- |
| `proxyReq` | Before forwarding to backend | Add headers, modify request body, log outgoing |
| `proxyRes` | After backend responds       | Modify response headers, log incoming          |
| `error`    | Proxy error occurred         | Handle connection failures, log errors         |
| `close`    | Connection closed            | Cleanup, logging                               |

### Use Cases

**1. Header Manipulation**

Add authentication tokens, forward cookies, inject correlation IDs:

```typescript
proxy.on("proxyReq", (proxyReq, req) => {
  // Forward authorization header
  if (req.headers.authorization) {
    proxyReq.setHeader("authorization", req.headers.authorization);
  }

  // Add correlation ID for distributed tracing
  proxyReq.setHeader("x-correlation-id", generateId());
});
```

**2. Response Transformation**

Modify headers before sending to browser:

```typescript
proxy.on("proxyRes", (proxyRes, req, res) => {
  // Enable CORS for development
  proxyRes.headers["access-control-allow-origin"] = "http://localhost:5173";
  proxyRes.headers["access-control-allow-credentials"] = "true";

  // Forward custom headers
  if (proxyRes.headers["x-user-id"]) {
    res.setHeader("x-user-id", proxyRes.headers["x-user-id"]);
  }
});
```

**3. Logging & Debugging**

Log request/response details during development:

```typescript
proxy.on("proxyReq", (proxyReq, req) => {
  console.log(`[Proxy] ${req.method} ${req.url} → ${proxyReq.path}`);
});

proxy.on("proxyRes", (proxyRes, req, res) => {
  console.log(`[Proxy] ${req.method} ${req.url} ← ${proxyRes.statusCode}`);
});
```

**4. Error Handling**

Gracefully handle backend connection failures:

```typescript
proxy.on("error", (err, req, res) => {
  console.error("[Proxy Error]", err.message);

  if (!res.headersSent) {
    res.status(503).json({
      error: "Backend unavailable",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});
```

---

## Hot Module Replacement (HMR)

### How HMR Works

HMR allows updating code in the browser without full page reload:

1. **File Change Detected**: Dev server watches filesystem
2. **Module Update**: Modified module re-executed
3. **WebSocket Notification**: Server pushes update to browser
4. **Partial Update**: Only changed module replaced in running app
5. **State Preservation**: Component state maintained (React Fast Refresh)

### HMR vs Hot Reload vs Live Reload

| Type            | Behavior                     | State     |
| --------------- | ---------------------------- | --------- |
| **Live Reload** | Full page refresh            | Lost      |
| **Hot Reload**  | Re-mount app from top        | Lost      |
| **HMR**         | Replace changed modules only | Preserved |

### Framework-Specific HMR

**React Fast Refresh:**

- Preserves component state during edits
- Resets state if changing hooks order
- Re-mounts if export changes

**Vue Hot Reload:**

- Preserves component state
- Updates template/script/style independently

**Svelte HMR:**

- Preserves component state
- Updates on-the-fly

---

## Development Server Best Practices

### 1. Port Configuration

Choose non-conflicting ports:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5173, // Frontend
    strictPort: true, // Fail if port occupied (don't auto-increment)
  },
});
```

**Common Ports:**

- Vite default: 5173
- Create React App: 3000
- Next.js: 3000
- Angular: 4200
- Backend APIs: 3001, 8000, 8080

### 2. HTTPS in Development

Test HTTPS-only features (service workers, camera access):

```typescript
// vite.config.ts
import fs from "fs";

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync("./certs/localhost-key.pem"),
      cert: fs.readFileSync("./certs/localhost-cert.pem"),
    },
  },
});
```

Generate self-signed certs: `mkcert localhost`

### 3. Proxy Multiple Backends

Route different paths to different backends:

```typescript
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:3001", // REST API
      "/graphql": "http://localhost:4000", // GraphQL server
      "/socket.io": {
        // WebSocket
        target: "ws://localhost:3002",
        ws: true,
      },
    },
  },
});
```

### 4. Performance Optimization

**Reduce HMR Latency:**

```typescript
export default defineConfig({
  server: {
    watch: {
      usePolling: false, // Use native file watching
      interval: 100, // Polling interval if needed
    },
  },
});
```

**Optimize Dependencies:**

```typescript
export default defineConfig({
  optimizeDeps: {
    include: ["react", "react-dom"], // Pre-bundle heavy deps
    exclude: ["local-package"], // Don't pre-bundle local packages
  },
});
```

---

## Troubleshooting Common Issues

### Proxy Not Forwarding Requests

**Symptom:** Requests to `/api/*` return 404

**Checklist:**

1. Verify proxy path pattern matches request path
2. Check backend is running on target port
3. Confirm `changeOrigin: true` if backend checks Host header
4. Add logging to proxy events to debug

### Cookies Not Being Set

**Symptom:** `Set-Cookie` header visible but cookies not stored

**Checklist:**

1. Verify proxy forwards `Set-Cookie` header (proxyRes event)
2. Check `sameSite` is `lax` or `none` in development
3. Ensure frontend requests include `credentials: 'include'`
4. Confirm backend sets `path` attribute (defaults may not match)

### CORS Errors Despite Proxy

**Symptom:** CORS error even with proxy configured

**Possible Causes:**

- Request not matching proxy pattern (check exact path)
- Preflight OPTIONS request not handled
- Backend returning `Access-Control-Allow-Origin: *` (conflicts with credentials)

**Solution:**
Ensure backend CORS is configured OR let proxy handle CORS headers.

### WebSocket Connection Failures

**Symptom:** WebSocket connections fail through proxy

**Solution:**
Enable WebSocket proxying:

```typescript
proxy: {
  '/socket.io': {
    target: 'http://localhost:3001',
    ws: true,  // Enable WebSocket proxying
    changeOrigin: true
  }
}
```

---

## Related Patterns

- **Backend CORS Configuration**: [Backend Architecture](./backend-architecture.md#cors-configuration)
- **Cookie Security**: [Backend Authentication](./backend-authentication.md#cookie-based-sessions)
- **Production Deployment**: [Deployment Strategies](./infra-deployment.md#reverse-proxies)

---

**Last Updated:** January 9, 2026
