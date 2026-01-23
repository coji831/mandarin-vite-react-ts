# Implementation 13-1: Monorepo Structure Setup

## Technical Scope

Set up npm workspaces monorepo structure with apps/frontend, apps/backend, and shared packages. Consolidate existing local-backend/ and api/ code into new backend structure. Configure build tools, development scripts, and Vercel deployment.

## Implementation Details

### Root package.json workspace configuration

```json
{
  "name": "mandarin-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "npm run dev --workspace=@mandarin/frontend",
    "dev:backend": "npm run dev --workspace=@mandarin/backend",
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present"
  },
  "dependencies": {
    "concurrently": "^9.1.2"
  }
}
```

### Shared Types Package

```typescript
// packages/shared-types/src/index.ts
export interface VocabularyItem {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  hskLevel?: number;
  category?: string;
}

export interface UserProgress {
  userId: string;
  itemId: string;
  correctCount: number;
  incorrectCount: number;
  lastReviewed: string;
  confidenceLevel: number;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface TTSRequest {
  text: string;
  languageCode?: string;
  voiceName?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Shared Constants Package

```typescript
// packages/shared-constants/src/index.ts
export const API_ENDPOINTS = {
  TTS: "/api/tts",
  CONVERSATION: "/api/conversation",
  HEALTH: "/health",
} as const;

export const HSK_LEVELS = [1, 2, 3, 4, 5, 6] as const;

export const CONFIDENCE_LEVELS = {
  NEW: 0,
  LEARNING: 1,
  FAMILIAR: 2,
  KNOWN: 3,
  MASTERED: 4,
} as const;
```

### Backend Entry Point

```javascript
// apps/backend/src/index.js
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// CORS for development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
```

### Vercel Deployment Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build:frontend",
  "outputDirectory": "apps/frontend/dist",
  "installCommand": "npm install",
  "framework": null,
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/apps/frontend/dist/$1"
    }
  ]
}
```

**Key Configuration Points:**

- **Serverless Functions**: Located in `/api` directory (Vercel convention)

  - Direct handlers without Express wrappers (lightweight, fast cold starts)
  - Import backend services from `../apps/backend/` paths
  - Auto-routed: `/api/tts` → `/api/tts.js`, `/api/conversation` → `/api/conversation.js`

- **Build Process**:

  - Builds frontend workspace only (backend is runtime-only for serverless)
  - Output to `apps/frontend/dist`
  - Installs all workspace dependencies

- **Routing**:
  - API routes: Automatically handled by functions in `/api`
  - Frontend: SPA catch-all rewrites to `apps/frontend/dist`

### Serverless Function Structure (Vercel Best Practice)

```javascript
// api/tts.js - Direct handler following Vercel best practices
import { config } from "../apps/backend/config/index.js";
import { synthesizeSpeech } from "../apps/backend/services/ttsService.js";
import * as gcsService from "../apps/backend/services/gcsService.js";
import { computeTTSHash } from "../apps/backend/utils/hashUtils.js";
import { createLogger } from "../apps/backend/utils/logger.js";

const logger = createLogger("TTS");

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({
      code: "METHOD_NOT_ALLOWED",
      message: "Method Not Allowed",
    });
  }

  // Direct business logic - no Express wrapper
  const { text, voice = config.tts.voiceDefault } = req.body;
  // ... validation and processing
}
```

**Why Direct Handlers (Not Express Wrappers)?**

- ✅ **Stateless**: No Express app creation per request
- ✅ **Lightweight**: Minimal overhead, faster cold starts
- ✅ **Vercel-native**: Follows platform best practices
- ✅ **Maintainable**: Business logic in `/apps/backend`, handlers are thin wrappers

```

## Architecture Integration

```

Root Workspace
├── apps/frontend → React + Vite
│ └── imports → @mandarin/shared-types, @mandarin/shared-constants
│
├── apps/backend → Node.js + Express
│ └── imports → @mandarin/shared-types, @mandarin/shared-constants
│
└── packages/
├── shared-types → TypeScript interfaces
└── shared-constants → API paths, config

```

Frontend and backend consume shared packages as workspace dependencies, ensuring type safety and consistency across client-server boundary.

## Technical Challenges & Solutions

**Challenge 1: Workspace dependency resolution**

- **Problem**: npm workspace protocol syntax `workspace:*` not supported in npm v10
- **Solution**: Changed to simple `*` version specifier for workspace dependencies

**Challenge 2: Consolidating dual backends**

- **Problem**: Existing api/ (serverless functions) and local-backend/ (Express) need consolidation
- **Solution**: Kept both in apps/backend/ structure - api/ for Vercel serverless, src/ for Express local dev

**Challenge 3: Frontend file relocation**

- **Problem**: Vite and TypeScript configs reference root-relative paths
- **Solution**: Moved all configs along with src/ to maintain relative path structure

**Challenge 4: Vercel serverless function 404 errors (December 15, 2025)**

- **Problem**: Serverless functions in `apps/backend/api/` created Express app per request (anti-pattern), Vercel pattern matching failed
- **Solution**:
  - Moved serverless functions to root `/api` directory (Vercel convention)
  - Refactored to direct handlers without Express wrappers
  - Import backend services from `../apps/backend/` paths
  - Updated `vercel.json` to use `api/**/*.js` pattern

**Challenge 5: Jest configuration conflicts (December 15, 2025)**

- **Problem**: Root `jest.config.js` referenced non-existent `src/setupTests.ts`, conflicted with monorepo structure
- **Solution**:
  - Removed root `jest.config.js`
  - Removed duplicate `apps/frontend/setupTests.ts`
  - Kept workspace-specific Jest configs in each app

**Challenge 6: Jest ES module transformation (December 15, 2025)**

- **Problem**: Jest/ts-jest couldn't transform ES module `.js` files from `@mandarin/shared-constants`, even with `allowJs: true`
- **Solution**:
  - Created dual JS/TS exports in shared-constants package:
    - `src/index.js` - For Node.js backend (native ES modules)
    - `src/index.ts` - For TypeScript frontend/tests (type safety)
  - Updated `package.json` exports to resolve `.js` by default
  - Updated Jest config to map `@mandarin/shared-constants` to `.ts` version for tests

**Challenge 7: TypeScript monorepo configuration (December 15, 2025)**

- **Problem**: Root `tsconfig.json` referenced `tsconfig.app.json` (frontend-specific), shared packages had no TypeScript config
- **Solution**:
  - Added `tsconfig.json` to `packages/shared-constants/` and `packages/shared-types/`
  - Updated root `tsconfig.json` to use project references for monorepo
  - Configured proper module resolution for workspace packages

## Testing Implementation

**Verification Completed:**

- ✅ Workspace dependency resolution (all packages installed successfully)
- ✅ Build scripts configuration (package.json scripts verified)
- ✅ Development server configuration (dev:frontend and dev:backend scripts tested)
- ✅ Shared package imports available to workspace apps
- ✅ Vercel deployment configuration (serverless functions in `/api` directory)
- ✅ Jest test suite (13/13 test suites passing, 36 tests passed)
- ✅ TypeScript compilation across all workspaces
- ✅ Backend server running (port 3001, imports shared-constants JS)
- ✅ Frontend dev server running (port 5174, imports shared-constants TS)

**Pending Integration Tests:**

- Frontend→Backend API communication (requires Story 13.4 Progress API implementation)
- Full Vercel deployment cycle (requires backend routes implementation)
- Type checking across workspace boundaries (requires more shared type usage)

## Related Stories

- [Story 13.2: Database Schema & ORM Configuration](./story-13-2-database-schema.md) - Next: Add Prisma and PostgreSQL
- [Story 13.3: Authentication & JWT Tokens](./story-13-3-authentication.md) - Requires monorepo for middleware implementation
```
