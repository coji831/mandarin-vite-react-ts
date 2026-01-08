# Troubleshooting Guide

Quick solutions to common development issues.

## Quick Diagnostics

**Development server won't start:**

```bash
# Kill port process (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Module not found:**

```bash
# Clear and reinstall
npm cache clean --force
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

**Changes not appearing:**

1. Hard refresh: `Ctrl+Shift+R`
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear browser cache

## Common Errors

### TypeScript Errors

**"Type 'undefined' is not assignable"**

```typescript
// Use nullish coalescing
const name: string = user.name ?? "Unknown";
```

**"Property does not exist on type"**

```typescript
// Add to interface or make optional
interface User {
  name: string;
  age?: number; // Optional property
}
```

**"Cannot find module '@/...'"**

Restart TypeScript server: `Cmd+Shift+P` > "TypeScript: Restart TS Server"

### Test Errors

**"TextEncoder is not defined"**

Add to `setupTests.ts`:

```typescript
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
```

**"Cannot find module 'utils/...'"**

Update `jest.config.js`:

```javascript
moduleNameMapper: {
  "^@/(.*)$": "<rootDir>/src/$1",
}
```

**Test timeout**

```typescript
// Increase timeout for slow test
test("loads data", async () => {
  // ...
}, 10000); // 10 seconds
```

### Build Errors

**Out of memory**

```bash
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

**Port already in use**

```bash
# Kill process on port
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

## Cookie Authentication Issues

### Cookies not visible in browser

**Check:** DevTools > Network > Response headers for `Set-Cookie`

**Fix:** Add proxy handlers to `vite.config.ts`:

```typescript
server: {
  proxy: {
    "/api": {
      target: "http://localhost:3001",
      configure: (proxy) => {
        proxy.on("proxyReq", (proxyReq, req) => {
          if (req.headers.cookie) {
            proxyReq.setHeader("cookie", req.headers.cookie);
          }
        });
        proxy.on("proxyRes", (proxyRes, req, res) => {
          const setCookie = proxyRes.headers["set-cookie"];
          if (setCookie) res.setHeader("set-cookie", setCookie);
        });
      },
    },
  },
}
```

**Learn more:** [Frontend Development Server](../knowledge-base/frontend-development-server.md#cookie-forwarding-in-proxied-environments)

### Cookie blocked (SameSite)

**Check:** Browser console for "SameSite" warnings

**Fix:** Use `sameSite: "lax"` in development:

```javascript
// Backend
res.cookie("refreshToken", token, {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
});
```

### CORS credentials error

**Check:** Response headers for `Access-Control-Allow-Origin: *`

**Fix:** Use specific origin with credentials:

```javascript
// Backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
```

**Learn more:** [CORS Deep Dive](../knowledge-base/backend-architecture.md#cors-cross-origin-resource-sharing-deep-dive)

### Cookies not sent with requests

**Fix:** Add `credentials: "include"` to fetch:

```typescript
fetch("/api/auth/login", {
  method: "POST",
  credentials: "include", // Required
  body: JSON.stringify(data),
});
```

### Cookie not cleared on logout

**Fix:** Match options exactly between set and clear:

```javascript
// Use same options for both
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  path: "/",
};

res.cookie("refreshToken", token, cookieOptions);
res.clearCookie("refreshToken", cookieOptions);
```

## Quick Diagnostic Checklist

**Cookie authentication not working? Check:**

1. ✅ Backend sets `Set-Cookie` header?
2. ✅ Cookie visible in DevTools > Application > Cookies?
3. ✅ Request includes `Cookie` header?
4. ✅ Frontend uses `credentials: "include"`?
5. ✅ Backend CORS has `credentials: true` + specific origin?
6. ✅ Vite proxy forwards cookie headers?

## State Issues

**Infinite re-render:**

```tsx
// Move setState to useEffect or event handler
useEffect(() => {
  setCount(count + 1);
}, []); // Empty deps = run once
```

**State not persisting:**

```typescript
// Check localStorage
console.log(localStorage.getItem("appState"));

// Catch serialization errors
try {
  localStorage.setItem("appState", JSON.stringify(state));
} catch (error) {
  console.error("Failed to save:", error);
}
```

## Reference

- [Environment Setup](./environment-setup-guide.md) - Configuration issues
- [Testing Guide](./testing-guide.md) - Test failures
- [Backend Setup](./backend-setup-guide.md) - Server errors
- [Vite Configuration](./vite-configuration-guide.md) - Build issues

**Learn more:**

- [Frontend Development Server](../knowledge-base/frontend-development-server.md) - Proxy, cookies, HMR
- [Backend Architecture](../knowledge-base/backend-architecture.md) - CORS concepts
- [React Patterns](../knowledge-base/frontend-react-patterns.md) - Strict Mode, cleanup

---

**Last Updated:** January 9, 2026
