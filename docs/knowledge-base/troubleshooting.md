# Troubleshooting Common Issues

**Category:** Getting Started  
**Last Updated:** December 9, 2025

---

## Quick Index

- [Installation Issues](#installation-issues)
- [Development Server Issues](#development-server-issues)
- [TypeScript Errors](#typescript-errors)
- [Test Failures](#test-failures)
- [ESLint / Linting Issues](#eslint--linting-issues)
- [Vite Issues](#vite-issues)
- [State Management Issues](#state-management-issues)
- [API / Backend Issues](#api--backend-issues)

---

## Installation Issues

### `npm install` fails

**Symptom:** Module not found or permission errors

**Solutions:**

```bash
# 1. Clear npm cache
npm cache clean --force

# 2. Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 3. Reinstall
npm install

# 4. If still failing, check Node version
node --version  # Should be >= 18
```

### Permission denied (EACCES)

**Symptom:** Cannot write to global node_modules

**Solutions:**

```bash
# Option 1: Use npx instead of global install
npx vite

# Option 2: Change npm prefix (macOS/Linux)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Option 3: Fix permissions
sudo chown -R $(whoami) ~/.npm
```

---

## Development Server Issues

### Port 5173 already in use

**Symptom:** `EADDRINUSE: address already in use :::5173`

**Solutions:**

```bash
# Option 1: Kill process on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Option 2: Use different port
npm run dev -- --port 3000

# Option 3: Update vite.config.ts
server: {
  port: 3000,
}
```

### Vite not reloading on file changes

**Symptom:** Changes don't appear in browser

**Solutions:**

1. **Check file path** - Ensure file is under `src/`
2. **Restart dev server** - `Ctrl+C` and `npm run dev`
3. **Clear browser cache** - Hard refresh (`Ctrl+Shift+R`)
4. **Check vite.config.ts** - Ensure `hmr: true` is not disabled

```typescript
// vite.config.ts
server: {
  hmr: true, // Hot Module Replacement
  watch: {
    usePolling: true, // Use if on network drive
  },
}
```

### `Cannot find module '@/...'`

**Symptom:** Import alias not working

**Solutions:**

```bash
# 1. Restart TypeScript server (VS Code)
# Cmd+Shift+P > "TypeScript: Restart TS Server"

# 2. Check vite.config.ts
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
    utils: path.resolve(__dirname, "./src/utils"),
  },
}

# 3. Check tsconfig.json
"paths": {
  "@/*": ["./src/*"],
  "utils/*": ["./src/utils/*"]
}
```

---

## TypeScript Errors

### `Type 'undefined' is not assignable to type 'string'`

**Symptom:** Optional properties cause type errors

**Solutions:**

```typescript
// ❌ Problem
const name: string = user.name; // name might be undefined

// ✅ Solution 1: Optional chaining + nullish coalescing
const name: string = user.name ?? "Unknown";

// ✅ Solution 2: Type guard
if (user.name) {
  const name: string = user.name;
}

// ✅ Solution 3: Make type optional
const name: string | undefined = user.name;
```

### `Property does not exist on type`

**Symptom:** Accessing property not in interface

**Solutions:**

```typescript
// ❌ Problem
interface User {
  name: string;
}
const user: User = { name: "Alice", age: 30 }; // Error: age not in interface

// ✅ Solution 1: Add property
interface User {
  name: string;
  age: number;
}

// ✅ Solution 2: Make optional
interface User {
  name: string;
  age?: number;
}

// ✅ Solution 3: Use Record
const user: Record<string, any> = { name: "Alice", age: 30 };
```

### `Cannot find name 'React'`

**Symptom:** React not imported in JSX files

**Solutions:**

```tsx
// ❌ Old style (React < 17)
import React from "react";

// ✅ New style (React 17+, no import needed)
// Just use JSX directly

// tsconfig.json must have:
"jsx": "react-jsx"
```

---

## Test Failures

### `TextEncoder is not defined`

**Symptom:** jsdom doesn't include TextEncoder

**Solution:** Add to `src/setupTests.ts`:

```typescript
const { TextEncoder, TextDecoder } = require("util");
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}
```

### `Cannot find module 'utils/...'` (in tests)

**Symptom:** Path aliases not working in tests

**Solution:** Update `jest.config.js`:

```javascript
moduleNameMapper: {
  "^utils(.*)$": "<rootDir>/src/utils$1",
  "^@/(.*)$": "<rootDir>/src/$1",
}
```

### Tests timeout

**Symptom:** `Timeout - Async callback was not invoked within the 5000 ms timeout`

**Solutions:**

```typescript
// Option 1: Increase timeout for one test
it("loads data", async () => {
  // ...
}, 10000); // 10 seconds

// Option 2: Increase global timeout (jest.config.js)
module.exports = {
  testTimeout: 10000,
};
```

### Mock not working

**Symptom:** `fetch` or `localStorage` still calling real implementation

**Solutions:**

```typescript
// Mock fetch in test file
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: "mocked" }),
  })
) as jest.Mock;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});
```

---

## ESLint / Linting Issues

### ESLint not working in VS Code

**Solutions:**

1. **Restart ESLint server** - `Cmd+Shift+P` > "ESLint: Restart ESLint Server"
2. **Install extension** - `dbaeumer.vscode-eslint`
3. **Check workspace settings** - `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### `React Hook useEffect has a missing dependency`

**Symptom:** ESLint warns about missing dependencies

**Solutions:**

```tsx
// ❌ Problem: count not in deps
useEffect(() => {
  console.log(count);
}, []);

// ✅ Solution 1: Add dependency
useEffect(() => {
  console.log(count);
}, [count]);

// ✅ Solution 2: Disable warning (if intentional)
useEffect(() => {
  console.log(count);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### Prettier conflicts with ESLint

**Solutions:**

```bash
# Install eslint-config-prettier (disables conflicting rules)
npm install -D eslint-config-prettier
```

```javascript
// eslint.config.js
import prettier from "eslint-config-prettier";

export default [
  // ... other configs
  prettier, // Must be last
];
```

---

## Vite Issues

### Build fails with "out of memory"

**Symptom:** `FATAL ERROR: Ineffective mark-compacts near heap limit`

**Solutions:**

```bash
# Increase Node memory limit
$env:NODE_OPTIONS="--max-old-space-size=4096"; npm run build

# Or in package.json
"scripts": {
  "build": "NODE_OPTIONS=--max-old-space-size=4096 vite build"
}
```

### CSS not loading in production

**Symptom:** Styles work in dev but not in production build

**Solutions:**

1. **Check CSS import** - Ensure `import './App.css'` is in component
2. **Check build output** - Look for `dist/assets/*.css`
3. **Check index.html** - Ensure `<link>` tags are present after build

---

## State Management Issues

### State not persisting to localStorage

**Symptom:** Data lost on page refresh

**Solutions:**

```typescript
// Check localStorage is saving
console.log(localStorage.getItem("appState"));

// Ensure serialization works
const state = { lists: { itemsById: {}, itemIds: [] } };
localStorage.setItem("appState", JSON.stringify(state));

// Check for circular references (causes JSON.stringify to fail)
// Use try/catch
try {
  localStorage.setItem("appState", JSON.stringify(state));
} catch (error) {
  console.error("Failed to save state:", error);
}
```

### Infinite re-render loop

**Symptom:** Browser freezes, console shows "Maximum update depth exceeded"

**Solutions:**

```tsx
// ❌ Problem: setState in render body
function MyComponent() {
  const [count, setCount] = useState(0);
  setCount(count + 1); // Causes infinite loop!
  return <div>{count}</div>;
}

// ✅ Solution 1: Move to useEffect
function MyComponent() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(count + 1);
  }, []); // Only run once
  return <div>{count}</div>;
}

// ✅ Solution 2: Move to event handler
function MyComponent() {
  const [count, setCount] = useState(0);
  const handleClick = () => setCount(count + 1);
  return <button onClick={handleClick}>{count}</button>;
}
```

---

## API / Backend Issues

### CORS errors

**Symptom:** `Access to fetch blocked by CORS policy`

**Solutions:**

```javascript
// vite.config.ts - Proxy API requests
server: {
  proxy: {
    "/api": {
      target: "http://localhost:3001",
      changeOrigin: true,
    },
  },
}

// Or: Backend needs CORS headers (Express)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});
```

### `fetch` not working in tests

**Symptom:** `fetch is not defined` in Jest

**Solution:** Mock in `src/setupTests.ts`:

```typescript
if (typeof (global as any).fetch === "undefined") {
  (global as any).fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));
}
```

### Backend server not starting (port 3001)

**Symptom:** `EADDRINUSE: address already in use :::3001`

**Solutions:**

```bash
# Kill process on port 3001 (Windows)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or: Use different port
PORT=3002 npm run start-backend
```

---

## General Debugging Tips

1. **Check browser console** - Look for errors/warnings
2. **Check terminal output** - Look for Vite/TypeScript errors
3. **Clear cache** - Browser + npm cache
4. **Restart everything** - Dev server + TypeScript server + VS Code
5. **Check file paths** - Ensure imports use correct paths/aliases
6. **Update dependencies** - `npm update`

---

## Next Steps

- [Quick Start](./quickstart.md) - Basic setup
- [Testing Setup](./testing-setup.md) - Debug test issues
- [Vite Setup](./vite-setup.md) - Build configuration

---

**Need More Help?**

- Check [GitHub Issues](https://github.com/your-repo/issues)
- Review [Architecture Docs](../architecture.md)
- Consult [Code Conventions](../guides/code-conventions.md)
