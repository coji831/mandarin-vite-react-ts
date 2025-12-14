# Vite + React + TypeScript Setup

**Category:** Getting Started  
**Last Updated:** December 9, 2025

---

## Overview

This project uses **Vite** as the build tool with **React 18** and **TypeScript 5**.

**Why Vite?**

- ⚡ Lightning-fast HMR (Hot Module Replacement)
- 📦 Built-in TypeScript support
- 🚀 Optimized production builds with Rollup
- ⚙️ Minimal configuration needed

---

## Configuration

### vite.config.ts

```typescript
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      src: path.resolve(__dirname, "src"),
      utils: path.resolve(__dirname, "src/utils"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
```

**Key Features:**

- **Path Aliases:** Import with `src/` or `utils/` instead of `../../`
- **API Proxy:** Routes `/api` requests to local backend (avoids CORS)
- **React Plugin:** Enables Fast Refresh for instant updates

---

## TypeScript Configuration

### Three Config Files

1. **tsconfig.json** (Base)

   - Sets up project references
   - Defines path aliases

2. **tsconfig.app.json** (App Code)

   - Configures `src/` folder
   - Strict mode enabled

3. **tsconfig.node.json** (Node Scripts)
   - For vite.config.ts and other Node scripts

### Example: tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": { "*": ["*"] },
    "types": ["@testing-library/jest-dom", "node"]
  },
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

### Example: tsconfig.app.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler"
  },
  "include": ["src"]
}
```

**Key Settings:**

- `jsx: "react-jsx"` - New JSX transform (no `import React`)
- `strict: true` - Enable all strict type checks
- `moduleResolution: "bundler"` - Optimized for Vite

---

## Using Path Aliases

```typescript
// ❌ Without aliases
import { loadCSV } from "../../../utils/csvLoader";

// ✅ With aliases
import { loadCSV } from "utils/csvLoader";
import { MyComponent } from "src/components/MyComponent";
```

---

## Environment Variables

### Frontend (Vite)

```bash
# .env.local
VITE_API_URL=http://localhost:3001
```

**Access in code:**

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

**Rules:**

- Must start with `VITE_` to be exposed
- Use `import.meta.env`, not `process.env`

### Backend (Node)

```bash
# .env.local
GOOGLE_API_KEY=your_key_here
DATABASE_URL=postgresql://...
```

**Access in code:**

```typescript
const apiKey = process.env.GOOGLE_API_KEY;
```

---

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check (no build)
tsc -b
```

---

## Project Structure

```
mandarin-vite-react-ts/
├── index.html              # Entry HTML (Vite serves this)
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript base config
├── tsconfig.app.json       # App TypeScript config
├── tsconfig.node.json      # Node scripts config
├── src/
│   ├── main.tsx           # React entry point
│   ├── App.tsx            # Root component
│   ├── vite-env.d.ts      # Vite type definitions
│   └── features/
└── public/                # Static assets (copied as-is)
```

---

## Key Lessons

- **index.html is the entry point**, not a template
- **Path aliases** reduce import complexity
- **API proxy** in dev avoids CORS issues
- **TypeScript strict mode** catches bugs early
- **Environment variables** must start with `VITE_` for frontend

---

## Next Steps

- [Testing Setup](./testing-setup.md) - Configure Jest
- [Linting Setup](./linting-setup.md) - ESLint & Prettier
- [Project Setup](./project-setup.md) - Full reference

---

**Related Guides:**

- [Deployment](./infra-deployment.md) - Production deployment
- [React Patterns](./frontend-react-patterns.md) - React best practices
