# Frontend Development Guide

**Last Updated:** June 12, 2026  
**Purpose:** Comprehensive guide for frontend development with React, TypeScript, and Vite  
**Audience:** Frontend developers starting work in the `apps/frontend/` directory

---

## Quick Start

```bash
# From project root
npm install                    # Install dependencies (monorepo mode)
npm run dev                    # Start Vite dev server + backend
# Frontend:  http://localhost:5173
# Backend:   http://localhost:3001
```

**Prerequisites:**

- Node.js 18+
- See [Environment Setup Guide](./environment-setup-guide.md) for `.env.local` configuration

---

## Project Structure

```
apps/frontend/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ features/              # Feature modules (primary organization)
â”‚   â”‚   â”œâ”€â”€ auth/              # LoginForm, RegisterForm, AuthContext, ProtectedRoute
â”‚   â”‚   â”œâ”€â”€ dashboard/         # LeechWidget, leechService
â”‚   â”‚   â”œâ”€â”€ gamification/      # StreakCounter, XPProgressBar, BadgeDisplay, etc.
â”‚   â”‚   â”œâ”€â”€ quiz/              # QuizContext, ProgressContext, reducers, hooks, services
â”‚   â”‚   â””â”€â”€ vocabulary/        # FlashCard, Sidebar, WordDetails, audioService, etc.
â”‚   â”œâ”€â”€ pages/                 # Route orchestrators (DashboardPage, FlashCardPage, etc.)
â”‚   â”œâ”€â”€ router/                # Router.tsx, LearnRoutes.tsx
â”‚   â”œâ”€â”€ shared/
â”‚   â”‚   â”œâ”€â”€ api/               # axiosClient (aliased as `services`)
â”‚   â”‚   â”œâ”€â”€ components/        # Button, Input, ToggleSwitch, LoadingScreen, etc.
â”‚   â”‚   â”œâ”€â”€ config/            # api.ts (API_CONFIG)
â”‚   â”‚   â”œâ”€â”€ constants/         # paths.ts, toneMap.ts
â”‚   â”‚   â””â”€â”€ layouts/           # AppLayout, LearnLayout, Root
â”‚   â”œâ”€â”€ utils/                 # Utilities (csvLoader, formatters)
â”‚   â”œâ”€â”€ App.tsx                # Root component
â”‚   â”œâ”€â”€ main.tsx               # Entry point
â”‚   â””â”€â”€ setupTests.ts          # Test configuration
â”œâ”€â”€ public/                    # Static assets
â”‚   â”œâ”€â”€ data/                  # CSV data files
â”‚   â””â”€â”€ images/
â”œâ”€â”€ vite.config.ts             # Vite configuration (proxy, aliases)
â”œâ”€â”€ vitest.config.ts           # Test runner configuration
â”œâ”€â”€ tsconfig.json              # TypeScript configuration
â”œâ”€â”€ package.json               # Dependencies
â””â”€â”€ README.md                  # Feature overview
```

---

## Development Environment

### Configuration Files

**`vite.config.ts`** - Dev server, proxy, aliases

```typescript
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, "../.."), // Load .env from monorepo root
  resolve: {
    alias: {
      features: path.resolve(__dirname, "src/features"),
      src: path.resolve(__dirname, "src"),
      utils: path.resolve(__dirname, "src/utils"),
      config: path.resolve(__dirname, "src/shared/config"),
      shared: path.resolve(__dirname, "src/shared"),
      services: path.resolve(__dirname, "src/shared/api"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        configure: (proxy) => {
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

**`vitest.config.ts`** - Unit/component testing

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
    clearMocks: true,
  },
  resolve: {
    alias: {
      features: path.resolve(__dirname, "src/features"),
      src: path.resolve(__dirname, "src"),
      utils: path.resolve(__dirname, "src/utils"),
      config: path.resolve(__dirname, "src/shared/config"),
      shared: path.resolve(__dirname, "src/shared"),
      services: path.resolve(__dirname, "src/shared/api"),
    },
  },
});
```

### Environment Variables

**`.env.local` (project root):**

```env
# Frontend (VITE_ prefix required)
VITE_API_URL=http://localhost:3001  # Backend URL (dev)
```

**Production (Vercel):**

- Set `VITE_API_URL` to Railway backend URL in Vercel dashboard

---

## Component Patterns

### Feature Component

**Purpose:** Contains all logic for a feature  
**Location:** `src/features/<feature>/components/`

```typescript
// src/features/vocabulary/components/VocabList.tsx
import { useVocabState } from "../hooks/useVocabState";
import { VocabCard } from "./VocabCard";

export function VocabList() {
  const { items, loading, error } = useVocabState();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <VocabCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

### Shared UI Component

**Purpose:** Reusable across features  
**Location:** `src/shared/components/`

```typescript
// src/shared/components/Button.tsx
import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "font-semibold transition",
        {
          "bg-blue-600 text-white": variant === "primary",
          "bg-gray-200 text-gray-900": variant === "secondary",
          "px-3 py-1 text-sm": size === "sm",
          "px-4 py-2": size === "md",
          "px-6 py-3 text-lg": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
```

---

## State Management (Context + Reducers)

This app uses **Context API + useReducer** for global state (not Redux), with split contexts and reducer composition:

```
BrowserRouter
└── AuthProvider (auth)
    └── AppLayout
        └── LearnLayout
            ├── ProgressProvider (quiz)
            └── UserIdentityProvider (quiz)
```

> ≡ƒôû **Complete Guide:** See [state-management-patterns.md](./state-management-patterns.md) for:
>
> - Reducer file patterns and DOMAIN/ACTION type naming
> - Action creator hooks with memoization (`useListsActions`)
> - Selector patterns with fallbacks
> - State shape normalization (`itemsById` + `itemIds`)
> - Complete testing examples (reducer, hook, component)

---

## Routing

**Router Setup:** `src/router/Router.tsx`

```typescript
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardPage } from "../pages/DashboardPage";
import { FlashCardPage } from "../pages/FlashCardPage";
import { LearnRoutes } from "./LearnRoutes";

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/learn/*" element={<LearnRoutes />} />
        <Route path="/quiz/*" element={<QuizPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Route Constants:** `src/shared/constants/paths.ts`

```typescript
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  FLASHCARD: "/learn/flashcard",
  QUIZ: "/quiz",
} as const;
```

---

## API Integration

> ≡ƒôû **Complete Guide:** See [api-client-patterns.md](./api-client-patterns.md) for:
>
> - Using `axiosClient` (preferred ΓÇö type-safe, auto error normalization)
> - `ApiResponse<T>` type, response interceptors
> - Service layer patterns with full examples
> - Error handling and legacy pattern migration
> - Testing API calls with mocked services

```typescript
// Preferred pattern — use axiosClient via the `services` alias, not raw fetch
import { apiClient } from "services";
const response = await apiClient.get<ApiResponse<ProgressData>>("/api/v1/progress");
```

---

## Testing

> ≡ƒôû **Complete Guide:** See [frontend-testing-guide.md](./frontend-testing-guide.md) for:
>
> - `renderWithProviders` helper setup
> - RTL queries (role/label/text ΓÇö not implementation details)
> - MSW (Mock Service Worker) for network mocking
> - Hook testing with `renderHook`
> - Reducer and context testing patterns
> - Common anti-patterns to avoid

---

## TypeScript Patterns

### Type Interfaces

**File:** `src/features/vocabulary/types/index.ts`

```typescript
export interface Word {
  id: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  definition: string;
  hsk: number;
}

export interface VocabList {
  id: string;
  name: string;
  words: Word[];
}

export interface Progress {
  wordId: string;
  userId: string;
  lastReviewDate: string;
  correct: number;
  incorrect: number;
}
```

### Custom Hooks with Types

```typescript
// src/features/vocabulary/hooks/useVocabState.ts
import { useEffect, useState } from "react";
import { vocabService } from "../services/vocabService";
import type { VocabList } from "../types";

export function useVocabState() {
  const [lists, setLists] = useState<VocabList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    vocabService
      .getLists()
      .then(setLists)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { lists, loading, error };
}
```

---

## Code Style & Conventions

> ≡ƒôû **Complete Guide:** See [frontend-conventions.md](./frontend-conventions.md) for:
>
> - Naming conventions (components, files, exports, test files)
> - Import path standards (`@/` aliases)
> - Feature folder structure
> - Export pattern rules (named vs. default)
> - Auth patterns, routing conventions, error handling standards

---

## Common Patterns

### Feature Loading State

```typescript
export function useVocabData() {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    vocabService
      .getAll()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => setState({ data: null, loading: false, error }));
  }, []);

  return state;
}
```

### Modal/Dialog Pattern

```typescript
export function useModal(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);
  return {
    open,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    toggle: () => setOpen(!open),
  };
}

// Usage
const { open, onOpen, onClose } = useModal();
return (
  <>
    <button onClick={onOpen}>Open</button>
    {open && <Modal onClose={onClose} />}
  </>
);
```

---

## Troubleshooting

### Development Server Issues

See [Troubleshooting Guide](./troubleshooting.md#development-server-wont-start) for common problems:

- Port already in use
- Environment variables undefined
- Module not found errors

### Testing Issues

See [Troubleshooting Guide](./troubleshooting.md#-testing-errors) for:

- `TextEncoder is not defined`
- Module path resolution in tests
- Test timeout

### Integration Issues

See [Frontend-Backend Integration Guide](./frontend-backend-integration-guide.md) for:

- Cookies not visible in browser
- CORS errors
- Proxy not forwarding requests

---

## Build & Deployment

### Building for Production

```bash
npm run build:frontend     # Outputs to apps/frontend/dist
npm run build              # Builds all apps
```

### Deployment to Vercel

- Automatic on push to `main` branch
- Build command: `npm run build:frontend`
- Output directory: `apps/frontend/dist`
- Environment: Set `VITE_API_URL` to Railway backend URL

---

## Reference

### Documentation

- [Frontend Testing Guide](./frontend-testing-guide.md) ΓÇö Component/hook testing patterns
- [Frontend-Backend Integration Guide](./frontend-backend-integration-guide.md) ΓÇö Auth, CORS, API setup
- [Environment Setup Guide](./environment-setup-guide.md) ΓÇö Environment variables
- [Frontend Conventions](./frontend-conventions.md) ΓÇö Frontend naming and patterns

### Key Files

- Frontend README: `apps/frontend/README.md`
- Vite config: `apps/frontend/vite.config.ts`
- Test config: `apps/frontend/vitest.config.ts`
- Routing: `src/App.tsx`
- Context setup: `src/context/`

### External Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vitest Documentation](https://vitest.dev/)
- [React Router](https://reactrouter.com/)

---

**Last Updated:** June 3, 2026
