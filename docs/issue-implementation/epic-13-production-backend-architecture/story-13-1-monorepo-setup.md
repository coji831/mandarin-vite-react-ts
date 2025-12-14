# Implementation 13-1: Monorepo Structure Setup

## Technical Scope

Set up npm workspaces monorepo structure with apps/frontend, apps/backend, and shared packages. Consolidate existing local-backend/ and api/ code into new backend structure. Configure build tools, development scripts, and Vercel deployment.

## Implementation Details

```typescript
// Root package.json workspace configuration
{
  "name": "mandarin-learning-platform",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "npm run dev --workspace=apps/frontend",
    "dev:backend": "npm run dev --workspace=apps/backend",
    "build": "npm run build --workspace=apps/frontend && npm run build --workspace=apps/backend",
    "test": "npm run test --workspaces"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

```typescript
// packages/shared-types/index.ts
export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

export interface Progress {
  id: string;
  userId: string;
  wordId: string;
  studyCount: number;
  correctCount: number;
  confidence: number;
  nextReview: Date;
}
```

```typescript
// packages/shared-constants/paths.ts
export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/v1/auth/register",
    LOGIN: "/api/v1/auth/login",
    REFRESH: "/api/v1/auth/refresh",
    LOGOUT: "/api/v1/auth/logout",
  },
  PROGRESS: {
    LIST: "/api/v1/progress",
    DETAIL: (wordId: string) => `/api/v1/progress/${wordId}`,
    BATCH: "/api/v1/progress/batch",
    STATS: "/api/v1/progress/stats",
  },
} as const;
```

## Architecture Integration

```
Root Workspace
    ├── apps/frontend → React + Vite
    │   └── imports → packages/shared-types, packages/shared-constants
    │
    ├── apps/backend → Node.js + Express
    │   └── imports → packages/shared-types, packages/shared-constants
    │
    └── packages/
        ├── shared-types → TypeScript interfaces
        └── shared-constants → API paths, config
```

Frontend and backend consume shared packages as workspace dependencies, ensuring type safety and consistency across client-server boundary.

## Technical Challenges & Solutions

```
Problem: Vercel deployment with monorepo structure (multiple build outputs)
Solution: Configure vercel.json with multiple builds array entries:
- Frontend build using @vercel/static-build
- Backend functions using @vercel/node
- Route configuration to direct /api/* to backend, /* to frontend
```

```
Problem: Development workflow with concurrent frontend + backend startup
Solution: Use concurrently package to run both dev servers in parallel:
- Frontend on port 5173 (Vite default)
- Backend on port 3001 (Express)
- Frontend configured to proxy /api/* requests to backend during dev
```

## Testing Implementation

**Unit Tests:**

- Workspace dependency resolution (verify shared packages importable)
- Build scripts execute without errors
- Development servers start and respond on correct ports

**Integration Tests:**

- Full deployment cycle to Vercel staging environment
- Frontend can fetch from backend /api endpoints
- Shared types match between client and server
