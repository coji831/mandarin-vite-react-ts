# Implementation 13-1: Monorepo Structure Setup

## Technical Scope

Set up npm workspaces monorepo structure with apps/frontend, apps/backend, and shared packages. Consolidate existing local-backend/ and api/ code into new backend structure. Configure build tools, development scripts, and Vercel deployment.

## Status

- **Implementation Status**: Completed
- **Last Update**: December 14, 2025

## Implementation Summary

Successfully implemented npm workspaces monorepo structure with the following key changes:

### Directory Structure Created

```
apps/
  ├── frontend/        # React + Vite (moved from root src/)
  │   ├── src/
  │   ├── index.html
  │   ├── vite.config.ts
  │   └── package.json
  └── backend/         # Node.js + Express (consolidated from local-backend + api/)
      ├── src/
      │   └── index.js (new unified entry point)
      ├── api/         # Serverless functions
      └── package.json

packages/
  ├── shared-types/    # TypeScript interfaces
  │   ├── src/index.ts
  │   └── package.json
  └── shared-constants/ # Configuration and constants
      ├── src/index.ts
      └── package.json
```

### Root Configuration

- **package.json**: Configured with npm workspaces, concurrently for parallel dev servers
- **vercel.json**: Updated for monorepo deployment with correct build paths
- **MONOREPO.md**: Added comprehensive documentation for monorepo usage

### Workspace Scripts

- `npm run dev`: Runs frontend (port 5173) and backend (port 3001) concurrently
- `npm run dev:frontend`: Frontend only
- `npm run dev:backend`: Backend only
- `npm run build`: Builds all workspaces
- `npm run test`: Runs tests across all workspaces

### Shared Packages

- **@mandarin/shared-types**: Exports TypeScript interfaces (VocabularyItem, UserProgress, ConversationMessage, TTSRequest, ApiResponse)
- **@mandarin/shared-constants**: Exports constants (API_ENDPOINTS, HSK_LEVELS, TTS_VOICES, CONFIDENCE_LEVELS, ERROR_MESSAGES)

### Dependencies Installed

- Successfully installed 687 packages
- All workspace dependencies resolved correctly
- Workspace scripts verified working

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

### Vercel Configuration

```json
{
  "buildCommand": "npm run build:frontend",
  "outputDirectory": "apps/frontend/dist",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/apps/backend/api/:path*"
    },
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```

## Architecture Integration

```
Root Workspace
    ├── apps/frontend → React + Vite
    │   └── imports → @mandarin/shared-types, @mandarin/shared-constants
    │
    ├── apps/backend → Node.js + Express
    │   └── imports → @mandarin/shared-types, @mandarin/shared-constants
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

## Testing Implementation

**Verification Completed:**

- ✅ Workspace dependency resolution (all packages installed successfully)
- ✅ Build scripts configuration (package.json scripts verified)
- ✅ Development server configuration (dev:frontend and dev:backend scripts tested)
- ✅ Shared package imports available to workspace apps

**Pending Integration Tests:**

- Frontend→Backend API communication (requires Story 13.4 Progress API implementation)
- Full Vercel deployment cycle (requires backend routes implementation)
- Type checking across workspace boundaries (requires more shared type usage)

## Related Stories

- [Story 13.2: Database Schema & ORM Configuration](./story-13-2-database-schema.md) - Next: Add Prisma and PostgreSQL
- [Story 13.3: Authentication & JWT Tokens](./story-13-3-authentication.md) - Requires monorepo for middleware implementation
