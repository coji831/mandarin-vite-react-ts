# Story 13-6: Clean Architecture Implementation Plan

**Epic:** 13 - Production Backend Architecture  
**Story:** 13-6 - Clean Architecture Preparation for .NET Migration  
**Created:** 2026-01-17

---

## 📋 Overview

Refactor backend into clean architecture layers (api/, core/, infrastructure/) while migrating frontend business logic to backend. Prepare codebase for future .NET migration (Epic 14).

**Total Estimated Effort:** 10-12 hours (increased from 8-10 due to GCS migration)

---

## 🎯 Goals

1. ✅ Separate business logic from framework code (Express/Prisma)
2. ✅ Move frontend business logic to backend services
3. ✅ Generate OpenAPI 3.1 spec + Swagger UI
4. ✅ Document .NET migration path
5. ✅ Maintain 100% test coverage

---

## Phase 0: Prerequisites & Setup ✅ COMPLETE (3 hours)

**Phase 0 Commit:** `aa19cbb` - feat(story-13-6): complete Phase 0

### Static Data Storage Migration to GCS

**Decision:** Migrate vocabulary CSV files to Google Cloud Storage

**Rationale:**

- Backend (Railway) may not reliably reach Vercel frontend URLs
- Avoids complex cross-service dependencies and CORS configuration
- Centralized data management for better production reliability
- Enables future admin panel for dynamic content updates
- Small cost (~$0.50/month) justified by improved architecture

**Architecture Flow:**

```
Frontend → Backend API (/api/v1/vocabulary/*) → GCS Bucket → Backend → Frontend (JSON/CSV data)
```

**Benefits of Backend Proxy Pattern:**

- ✅ No CORS configuration needed on GCS bucket
- ✅ Backend controls access and can add caching
- ✅ Frontend doesn't need to know about GCS URLs
- ✅ Can transform/validate data before serving
- ✅ Leverages existing `gcsService.js` infrastructure

**Prerequisites (Already Complete):**

- ✅ GCS bucket `mandarin-vocab-data` created
- ✅ Vocabulary files uploaded to bucket
- ✅ Backend has `GCS_CREDENTIALS_RAW` with Storage Object Viewer role
- ✅ Existing `gcsService.js` handles authentication and bucket access

**Configuration Updates:**

- [x] Backend `apps/backend/src/config/vocabulary.js` (implemented: apps/backend/src/config/vocabulary.js)

  ```javascript
  export const vocabularyConfig = {
    // Note: gcsService uses config.gcsBucket (set via GCS_BUCKET_NAME env var)
    // For vocabulary-specific config:
    localDataPath: "apps/frontend/public/data/vocabulary",
    listsFile: "vocabularyLists.json",
    cacheTTL: 3600,
    gcsEnabled: process.env.GCS_ENABLED === "true",
  };
  ```

- [x] Backend `.env` variables (Railway) - documented in apps/backend/.env.example

  ```bash
  GCS_VOCAB_BUCKET=mandarin-vocab-data
  GCS_ENABLED=true
  # Uses existing GCS_CREDENTIALS_RAW (already configured for TTS)
  ```

- [x] **Frontend configuration - NO CHANGES NEEDED** - documented in apps/frontend/.env.example
  - Frontend calls backend API: `/api/v1/vocabulary/lists`
  - Backend handles GCS fetching internally
  - No GCS URLs exposed to frontend
  - Works in both dev and production without env var changes

---

### Shared Workspace Packages: Pure JS + .d.ts Strategy

**Current State:**

- `@mandarin/shared-constants` has both `.js` and `.ts` files
- `@mandarin/shared-types` is pure TypeScript
- Both consumed by frontend (TS) and backend (JS)

**Problem:**

- TypeScript compilation overhead for simple constants
- Backend doesn't need TS compilation, just IDE autocomplete
- Unnecessary build complexity

**Solution:** Pure JS + .d.ts Type Definitions

- [x] **Convert `@mandarin/shared-constants` to pure JS** - already pure JS with index.js

  ```javascript
  // packages/shared-constants/src/index.js (source of truth)
  export const API_ENDPOINTS = {
    TTS: "/api/tts",
    CONVERSATION: "/api/conversation",
    HEALTH: "/health",
    // ... rest of endpoints
  };

  export const CONFIDENCE_LEVELS = {
    NEW: 0,
    LEARNING: 1,
    FAMILIAR: 2,
    KNOWN: 3,
    MASTERED: 4,
  };
  ```

- [x] **Add TypeScript definitions** - created packages/shared-constants/src/index.d.ts

  ```typescript
  // packages/shared-constants/src/index.d.ts (generated or hand-written)
  export declare const API_ENDPOINTS: {
    readonly TTS: "/api/tts";
    readonly CONVERSATION: "/api/conversation";
    readonly HEALTH: "/health";
    // ... rest with proper types
  };

  export declare const CONFIDENCE_LEVELS: {
    readonly NEW: 0;
    readonly LEARNING: 1;
    readonly FAMILIAR: 2;
    readonly KNOWN: 3;
    readonly MASTERED: 4;
  };
  ```

- [x] **Update `package.json`** - updated to point to index.d.ts

  ```json
  {
    "name": "@mandarin/shared-constants",
    "main": "src/index.js",
    "types": "src/index.d.ts",
    "exports": {
      ".": {
        "types": "./src/index.d.ts",
        "import": "./src/index.js",
        "default": "./src/index.js"
      }
    }
  }
  ```

- [x] **Remove TypeScript dependencies** - removed typescript from devDependencies
  - [x] Delete `typescript` from `devDependencies`
  - [ ] Delete `tsconfig.json` if exists
  - [ ] Remove any build scripts

- [x] **Keep `@mandarin/shared-types` as pure TypeScript** - no changes needed
  - Only used by frontend
  - Backend uses JSDoc for type hints
  - No changes needed

**Benefits:**

- ✅ No build step required
- ✅ Backend gets IDE autocomplete via .d.ts
- ✅ Frontend gets full type safety
- ✅ Faster workspace operations
- ✅ Simpler to maintain (JS is source of truth)

---

### Frontend API Wrapper Consolidation (from TODO.md)

**Current Problem:**

- `API_BASE` repeated in every service file
- Inconsistent URL handling (some use `authFetch`, some use raw `fetch`)
- No centralized configuration for backend URL

**Required Changes:**

- [x] Create centralized API config utility - created apps/frontend/src/config/api.ts

  ```typescript
  // apps/frontend/src/config/api.ts
  export const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
    timeout: 10000,
    withCredentials: true,
  };

  export function getApiUrl(endpoint: string): string {
    return API_CONFIG.baseURL + endpoint;
  }
  ```

- [x] Create unified API client wrapper - created apps/frontend/src/services/apiClient.ts

  ```typescript
  // apps/frontend/src/services/apiClient.ts
  import { API_CONFIG, getApiUrl } from "../config/api";
  import { authFetch } from "../features/auth/utils/authFetch";

  export class ApiClient {
    // Authenticated requests (auto-handles token refresh)
    static async authRequest(endpoint: string, options?: RequestInit): Promise<Response> {
      return authFetch(endpoint, options);
    }

    // Public requests (no auth)
    static async publicRequest(endpoint: string, options?: RequestInit): Promise<Response> {
      const url = getApiUrl(endpoint);
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    }
  }
  ```

- [x] Update all service files to use `ApiClient`
  - [x] `audioService.ts` - Replace `API_BASE` with `ApiClient.publicRequest()`
  - [x] `conversationService.ts` - Replace `API_BASE` with `ApiClient.publicRequest()`
  - [ ] `progressService.ts` - Already uses `authFetch` ✓ (just verify consistency)
  - [ ] `vocabularyDataService.ts` - Will use `ApiClient.publicRequest()` for new endpoints

- [x] Remove `authFetch` duplication - kept as internal implementation, exposed through ApiClient
  - [x] Keep `authFetch.ts` as internal implementation
  - [x] Export through `ApiClient` for consistency
  - [x] Update all imports to use `ApiClient`

- [x] Update environment variable documentation
  - [x] Document `VITE_API_URL` in `.env.example`
  - [ ] Add Railway production URL to deployment docs
  - [ ] Verify CORS configuration on backend

**Benefits:**

- Single source of truth for API configuration
- Easier to switch between dev/staging/prod backends
- Consistent error handling across all API calls
- Prepares for future React Query/Axios migration (per TODO.md)

---

## 📂 Phase 1: Folder Structure Setup ✅ COMPLETE (30 min)

**Phase 1 Commit:** `0d849bc` - chore(story-13-6): complete Phase 1 - create clean architecture folder structure

### Create New Directory Structure

- [x] Create `apps/backend/src/api/` directory
  - [x] Create `apps/backend/src/api/controllers/`
  - [x] Create `apps/backend/src/api/routes/`
  - [x] Create `apps/backend/src/api/middleware/`
  - [x] Create `apps/backend/src/api/docs/`

- [x] Create `apps/backend/src/core/` directory
  - [x] Create `apps/backend/src/core/services/`
  - [x] Create `apps/backend/src/core/interfaces/`
  - [x] Create `apps/backend/src/core/domain/`

- [x] Create `apps/backend/src/infrastructure/` directory
  - [x] Create `apps/backend/src/infrastructure/repositories/`
  - [x] Create `apps/backend/src/infrastructure/database/`
  - [x] Create `apps/backend/src/infrastructure/cache/`
  - [x] Create `apps/backend/src/infrastructure/external/`

---

## 🔄 Phase 2: Extract Repository Layer ✅ COMPLETE (1.5 hours)

**Phase 2 Commit:** `65df6bf` - feat(story-13-6): complete Phase 2

### Define Repository Interfaces

- [x] Create `apps/backend/src/core/interfaces/IProgressRepository.js` - JSDoc interface with type definitions

  ```javascript
  export interface IProgressRepository {
    findByUser(userId: string): Promise<Progress[]>;
    findByUserAndWord(userId: string, wordId: string): Promise<Progress | null>;
    upsert(userId: string, wordId: string, data: Partial<Progress>): Promise<Progress>;
    findMany(filters: object): Promise<Progress[]>;
    deleteByUserAndWord(userId: string, wordId: string): Promise<void>;
  }
  ```

- [x] Create `apps/backend/src/core/interfaces/IVocabularyRepository.js` - JSDoc interface with type definitions
  ```javascript
  export interface IVocabularyRepository {
    findAllLists(): Promise<VocabularyList[]>;
    findListById(listId: string): Promise<VocabularyList | null>;
    findWordsForList(listId: string): Promise<Word[]>;
    searchLists(query: string, filters: object): Promise<VocabularyList[]>;
  }
  ```

### Implement Repository Concrete Classes

- [x] Create `apps/backend/src/infrastructure/repositories/ProgressRepository.js` - implemented all methods
  - [x] Implement `findByUser()` using Prisma
  - [x] Implement `findByUserAndWord()` using Prisma
  - [x] Implement `upsert()` using Prisma
  - [x] Implement `findMany()` with filters
  - [x] Implement `deleteByUserAndWord()`
  - [x] Add JSDoc documentation

- [x] Create `apps/backend/src/infrastructure/repositories/VocabularyRepository.js` (implemented: apps/backend/src/infrastructure/repositories/VocabularyRepository.js)
  - [x] Use existing `gcsService.js` (already configured with credentials)
  - [x] Implement `findAllLists()` - fetch vocabularyLists.json from GCS

    ```javascript
    import { downloadFile } from '../../services/gcsService.js';
    import { vocabularyConfig } from '../../config/vocabulary.js';

    async findAllLists() {
      if (!vocabularyConfig.gcsEnabled) {
        // Fallback to local file system in dev
        const localPath = path.join(vocabularyConfig.localDataPath, vocabularyConfig.listsFile);
        return JSON.parse(fs.readFileSync(localPath, 'utf-8'));
      }

      // Use existing gcsService - automatically uses GCS_CREDENTIALS_RAW
      const contents = await downloadFile(vocabularyConfig.listsFile);
      return JSON.parse(contents.toString());
    }
    ```

  - [x] Implement `findListById()` - filter by ID from cached lists
  - [x] Implement `findWordsForList()` - fetch CSV from GCS, parse with CsvParser
  - [x] Implement `searchLists()` - filter by query/difficulty/tags
  - [x] Add in-memory caching (TTL: 1 hour) to avoid repeated GCS calls

- [x] Move Prisma client to `apps/backend/src/infrastructure/database/client.js` - already centralized in models/index.js

---

## 🧠 Phase 3: Refactor Existing Services (Core Layer) ✅ COMPLETE (3 hours)

**Phase 3 Commits:**

- `d58e1c9` - feat(story-13-6): complete Phase 3a (cache/external/conversation)
- `12f0a8c` - feat(story-13-6): complete Phase 3b (AuthService refactor)

### ProgressService Refactoring ✅

- [x] Move `apps/backend/src/services/ProgressService.js` → `apps/backend/src/core/services/ProgressService.js`
- [x] Update ProgressService to accept `IProgressRepository` via constructor
- [x] Remove all direct Prisma imports from service
- [x] Add `calculateMasteryStats(userId, listId)` method
  ```javascript
  async calculateMasteryStats(userId, listId, wordIds) {
    const progress = await this.repository.findByUser(userId);
    const masteredWords = wordIds.filter(wordId => {
      const p = progress.find(pr => pr.wordId === wordId);
      return p && (p.confidence >= 0.8 || p.correctCount >= 3);
    });
    return {
      masteredCount: masteredWords.length,
      totalWords: wordIds.length,
      progressPercent: Math.round((masteredWords.length / wordIds.length) * 100)
    };
  }
  ```
- [x] Ensure `calculateNextReview()` remains pure (no external dependencies)
- [x] Update JSDoc documentation

### AuthService Refactoring ✅

- [x] Move `apps/backend/src/services/AuthService.js` → `apps/backend/src/core/services/AuthService.js`
- [x] Create `apps/backend/src/core/interfaces/IAuthRepository.js`
- [x] Create `apps/backend/src/infrastructure/repositories/AuthRepository.js`
- [x] Extract JWT operations to `apps/backend/src/infrastructure/security/JwtService.js`
- [x] Extract password hashing to `apps/backend/src/infrastructure/security/PasswordService.js`
- [x] Keep authentication logic in core service (pure business rules)
- [x] Update to use dependency injection (repository, jwtService, passwordService)

### Cache Services → Infrastructure Layer

- [x] Move `apps/backend/src/services/cache/` → `apps/backend/src/infrastructure/cache/`
  - [x] Move `CacheService.js` (abstract base class)
  - [x] Move `RedisCacheService.js` (Redis implementation)
  - [x] Move `NoOpCacheService.js` (No-op implementation)
  - [x] Move `RedisClient.js` (Redis client wrapper)
  - [x] Move `index.js` (exports)
- [x] Create `apps/backend/src/core/interfaces/ICacheService.js` (interface definition)
- [x] Update all imports across codebase:
  - [x] Update `CachedConversationService.js` imports
  - [x] Update `CachedTTSService.js` imports
  - [ ] Update any controller/service imports

### External API Clients → Infrastructure Layer

Move low-level API clients to infrastructure (no business logic, pure I/O):

- [x] **GeminiClient** (Gemini AI API)
  - [x] Move `apps/backend/src/services/geminiService.js` → `apps/backend/src/infrastructure/external/GeminiClient.js`
  - [x] Keep only: authentication, HTTP requests, response parsing
  - [x] Remove: conversation-specific logic (stays in ConversationService)
  - [x] Update imports in ConversationService

- [x] **GoogleTTSClient** (Google Text-to-Speech API)
  - [x] Move `apps/backend/src/services/ttsService.js` → `apps/backend/src/infrastructure/external/GoogleTTSClient.js`
  - [x] Keep only: TTS client initialization, synthesizeSpeech method
  - [x] Update imports in CachedTTSService

- [x] **GCSClient** (Google Cloud Storage)
  - [x] Move `apps/backend/src/services/gcsService.js` → `apps/backend/src/infrastructure/external/GCSClient.js`
  - [x] Keep only: storage client initialization, upload/download operations
  - [x] Update imports in VocabularyRepository, ConversationService

### Conversation Services → Core Layer

Move business logic services to core (orchestration, parsing, prompts):

- [x] **ConversationService** (High-level orchestration)
  - [x] Move `apps/backend/src/services/conversationService.js` → `apps/backend/src/core/services/ConversationService.js`
  - [x] Keep: conversation generation logic, parsing, prompt creation, orchestration
  - [x] Update to use infrastructure clients (GeminiClient, GoogleTTSClient, GCSClient)
  - [x] Inject clients via constructor (dependency injection)
  - [x] Update imports in CachedConversationService, controllers

- [x] **CachedConversationService** (Decorator pattern)
  - [x] Move `apps/backend/src/services/conversation/CachedConversationService.js` → `apps/backend/src/core/services/CachedConversationService.js`
  - [x] Update imports to use core/services/ConversationService
  - [x] Update imports to use infrastructure/cache

- [x] **CachedTTSService** (Decorator pattern)
  - [x] Move `apps/backend/src/services/tts/CachedTTSService.js` → `apps/backend/src/core/services/CachedTTSService.js`
  - [x] Update imports to use infrastructure/external/GoogleTTSClient
  - [x] Update imports to use infrastructure/cache

### Clean Architecture Validation

After Phase 3, verify:

- [ ] `core/services/` contains ONLY business logic (no Prisma, no Express, no external API clients)
- [ ] `core/services/` accepts dependencies via constructor (DI pattern)
- [ ] `infrastructure/external/` contains ONLY low-level API clients (Gemini, TTS, GCS)
- [ ] `infrastructure/cache/` contains ONLY cache implementations (Redis, NoOp)
- [ ] `infrastructure/repositories/` contains ONLY data access (Prisma, GCS data fetching)
- [ ] All services use interfaces from `core/interfaces/`

---

## 🆕 Phase 4: Create New Vocabulary Service ✅ COMPLETE (2 hours)

**Status:** VocabularyService, VocabularyRepository, CsvParser, and routes fully wired.
**Commits:** Phase 3b (12f0a8c), Phase 4 route wiring + import fixes

### VocabularyService (Core Layer) ✅

- [x] Create `apps/backend/src/core/services/VocabularyService.js` (implemented: apps/backend/src/core/services/VocabularyService.js)

  ```javascript
  export class VocabularyService {
    constructor(repository) {
      this.repository = repository; // IVocabularyRepository
    }

    async getAllLists() { ... }
    async getListById(listId) { ... }
    async getWordsForList(listId) { ... }
    async searchLists(query, filters) { ... }

    // Business logic methods
    extractDistinctDifficulties(lists) { ... }
    extractDistinctTags(lists) { ... }
  }
  ```

### CSV Parsing Infrastructure ✅

- [x] Create `apps/backend/src/infrastructure/parsers/CsvParser.js` (implemented: apps/backend/src/infrastructure/parsers/CsvParser.js)
  - [x] Port `csvLoader.ts` logic from frontend
  - [ ] Add server-side validation (word count limits, required fields)
  - [ ] Handle UTF-8 encoding properly
  - [ ] Add error handling for malformed CSV

- [ ] Move vocabulary data files to backend (optional - keep in public for now)
  - Decision: Keep in `public/data/vocabulary/` but access from backend file system

### VocabularyRepository Implementation ✅

- [x] Use existing `gcsService.js` infrastructure (already exists in backend)
- [x] Reference existing patterns from TTS audio storage
- [x] Fetch `vocabularyLists.json` from GCS bucket using SDK
- [x] Fetch CSV files from GCS bucket (not HTTP URLs)
- [x] Pass CSV text to CsvParser for processing
- [x] Implement search/filter logic

  ```javascript
  async searchLists(query, { difficulties, tags }) {
    let lists = await this.findAllLists();

    if (query) {
      lists = lists.filter(l =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.description?.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (difficulties?.length > 0) {
      lists = lists.filter(l => difficulties.includes(l.difficulty));
    }

    if (tags?.length > 0) {
      lists = lists.filter(l =>
        l.tags?.some(t => tags.includes(t))
      );
    }

    return lists;
  }
  ```

---

## 🎮 Phase 5: Update Controllers (API Layer) ✅ COMPLETE

### Refactor Existing Controllers

- [x] Move `apps/backend/src/controllers/` → `apps/backend/src/api/controllers/`
  - [x] Copy all controllers to new location
  - [x] Convert to class-based with dependency injection
  - [x] Remove business logic (ensure only HTTP mapping)

- [x] Update `ProgressController.js` to use dependency injection
  - [x] Convert to class with constructor accepting progressService
  - [x] Convert all export const functions to class methods (5/5: getAllProgress, getWordProgress, updateWordProgress, batchUpdateProgress, deleteWordProgress, getProgressStats)
  - [x] Update service references from direct instantiation to this.progressService
  - [x] Remove direct ProgressService import/instantiation

- [x] Update `AuthController.js` to use dependency injection
  - [x] Convert to class with constructor accepting authService
  - [x] Convert all export const functions to class methods (5/5: register, login, refresh, logout, getCurrentUser)
  - [x] Update service references to this.authService
  - [x] Convert helper methods (setRefreshTokenCookie, clearRefreshTokenCookie) to class methods

- [x] Update `ConversationController.js` to use dependency injection
  - [x] Convert to class with constructor
  - [x] Accept conversationService, geminiService, ttsService via DI
  - [x] Convert router.post() to class methods (4/4: generateConversation, healthCheck, generateText, generateAudio)

- [x] Update `TtsController.js` to use dependency injection
  - [x] Convert to class with constructor
  - [x] Accept ttsService, gcsService via DI
  - [x] Convert router.post() to class methods (1/1: getTtsAudio)

- [x] Remove all business logic from controllers (move to services)
- [x] Keep only: request validation, response formatting, status codes

### Create New VocabularyController

- [x] Create `apps/backend/src/api/controllers/VocabularyController.js` (implemented: apps/backend/src/api/controllers/VocabularyController.js)

  ```javascript
  export class VocabularyController {
    constructor(vocabularyService, progressService) {
      this.vocabularyService = vocabularyService;
      this.progressService = progressService;
    }

    // GET /api/v1/vocabulary/lists
    async listVocabularyLists(req, res) { ... }

    // GET /api/v1/vocabulary/lists/:listId
    async getVocabularyList(req, res) { ... }

    // GET /api/v1/vocabulary/lists/:listId/words
    async getWordsForList(req, res) { ... }

    // GET /api/v1/vocabulary/lists/:listId/progress
    async getListProgress(req, res) {
      const { listId } = req.params;
      const userId = req.userId; // from auth middleware

      const list = await this.vocabularyService.getListById(listId);
      const words = await this.vocabularyService.getWordsForList(listId);
      const wordIds = words.map(w => w.wordId);

      const stats = await this.progressService.calculateMasteryStats(
        userId,
        listId,
        wordIds
      );

      res.json({
        listId,
        listName: list.name,
        ...stats
      });
    }

    // GET /api/v1/vocabulary/search?q=food&difficulty=beginner&tags=daily
    async searchLists(req, res) { ... }
  }
  ```

### Update Routes

- [x] Move `apps/backend/src/routes/` → `apps/backend/src/api/routes/`
- [x] Update all route files to use new controller instances with DI
  - [x] progressRoutes.js - ProgressController with ProgressService + ProgressRepository DI
  - [x] authRoutes.js - AuthController with AuthService + AuthRepository + JwtService + PasswordService DI
  - [x] conversationRoutes.js (new) - ConversationController with CachedConversationService + infrastructure clients DI
  - [x] ttsRoutes.js (new) - TtsController with CachedTTSService + GCSClient DI
- [x] Updated main routes/index.js to import from new route files
- [x] Copied middleware to api/middleware/ for clean architecture separation
- [x] Wrapped all routes with asyncHandler and .bind(controller)
- [x] Deleted legacy controllers (authController, conversationController, progressController, ttsController)
- [x] Deleted legacy routes/ folder
- [x] Updated apps/backend/src/index.js to use api/routes/index.js
- [x] Add new vocabulary routes (implemented: apps/backend/src/api/routes/vocabularyRoutes.js)
  - [x] GET /api/v1/vocabulary/lists
  - [x] GET /api/v1/vocabulary/lists/:listId
  - [x] GET /api/v1/vocabulary/lists/:listId/words
  - [x] GET /api/v1/vocabulary/search
  - [x] GET /api/v1/vocabulary/lists/:listId/progress (protected)

- [x] Fixed import paths across api/ folder structure
  - [x] Fixed config imports (../../config/index.js)
  - [x] Fixed utils imports (../../utils/)
  - [x] Fixed infrastructure imports (../../infrastructure/)
  - [x] Fixed middleware imports

- [x] Installed csv-parse package for vocabulary parsing

**Phase 4 & 5 Commits:**

- `f54ca60` - refactor(story-13-6): convert controllers to class-based DI pattern (Phase 5)
- `865e9af` - refactor(story-13-6): wire routes with DI + cleanup legacy files (Phase 5)

---

## 📚 Phase 6: OpenAPI Documentation (1.5 hours)

### Install Dependencies

- [ ] Install swagger packages
  ```bash
  npm install swagger-jsdoc swagger-ui-express --save
  npm install @types/swagger-jsdoc @types/swagger-ui-express --save-dev
  ```

### Generate OpenAPI Spec

- [ ] Create `apps/backend/src/api/docs/openapi.js`
  - [ ] Define OpenAPI 3.1 configuration
  - [ ] Add security schemes (JWT Bearer)
  - [ ] Configure swagger-jsdoc to scan routes

- [ ] Add JSDoc annotations to route files

  ```javascript
  /**
   * @swagger
   * /api/v1/vocabulary/lists:
   *   get:
   *     summary: Get all vocabulary lists
   *     tags: [Vocabulary]
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *       - in: query
   *         name: difficulty
   *         schema:
   *           type: string
   *       - in: query
   *         name: tags
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *     responses:
   *       200:
   *         description: List of vocabulary lists
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/VocabularyList'
   */
  ```

- [ ] Define schema components in `apps/backend/src/api/docs/schemas.js`
  - [ ] Progress schema
  - [ ] VocabularyList schema
  - [ ] Word schema
  - [ ] User schema
  - [ ] Error response schema

### Swagger UI Setup

- [ ] Add Swagger UI routes to `apps/backend/src/index.js`

  ```javascript
  import swaggerUi from "swagger-ui-express";
  import { swaggerSpec } from "./api/docs/openapi.js";

  app.use("/api-docs", swaggerUi.serve);
  app.get("/api-docs", swaggerUi.setup(swaggerSpec));
  app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));
  ```

- [ ] Test Swagger UI at `http://localhost:3001/api-docs`

---

## 🧪 Phase 7: Update Tests (2 hours)

### Repository Tests

- [ ] Create `apps/backend/tests/infrastructure/repositories/ProgressRepository.test.js`
  - [ ] Test all CRUD operations
  - [ ] Mock Prisma client
  - [ ] Verify query filters

- [ ] Create `apps/backend/tests/infrastructure/repositories/VocabularyRepository.test.js`
  - [ ] Test list loading
  - [ ] Test CSV parsing
  - [ ] Test search/filter logic
  - [ ] Test caching behavior

### Service Tests (Update Existing)

- [ ] Update `apps/backend/tests/unit/ProgressService.test.js`
  - [ ] Mock repository interface (not Prisma directly)
  - [ ] Test `calculateMasteryStats()` method
  - [ ] Verify spaced repetition algorithm unchanged
  - [ ] Ensure 100% coverage on business logic

- [ ] Create `apps/backend/tests/unit/VocabularyService.test.js`
  - [ ] Mock repository interface
  - [ ] Test search/filter methods
  - [ ] Test distinct tag/difficulty extraction

### Controller/Integration Tests

- [ ] Update `apps/backend/tests/unit/progressController.test.js`
  - [ ] Mock service layer (not Prisma)
  - [ ] Test HTTP request/response mapping
  - [ ] Verify status codes and error handling

- [ ] Create `apps/backend/tests/unit/vocabularyController.test.js`
  - [ ] Test all vocabulary endpoints
  - [ ] Verify list progress calculation integration

- [ ] Create `apps/backend/tests/integration/vocabulary.test.js`
  - [ ] End-to-end vocabulary API tests
  - [ ] Test CSV parsing with real files
  - [ ] Verify OpenAPI spec compliance

### OpenAPI Contract Tests

- [ ] Create `apps/backend/tests/integration/openapi.test.js`
  - [ ] Validate all endpoints return responses matching OpenAPI schema
  - [ ] Test Swagger UI renders without errors
  - [ ] Verify `/api-docs.json` is valid OpenAPI 3.1

---

## 📖 Phase 8: Documentation (1 hour)

### .NET Migration Guide

- [ ] Create `docs/guides/dotnet-migration.md`
  - [ ] Architecture layer mapping (TS → C#)
  - [ ] Code examples for common patterns
  - [ ] Repository interface → EF Core translation
  - [ ] Service class → C# service translation
  - [ ] OpenAPI spec reuse instructions
  - [ ] Database schema migration notes
  - [ ] Authentication/JWT migration

### Update Existing Docs

- [ ] Update `apps/backend/README.md`
  - [ ] Document new folder structure
  - [ ] Explain clean architecture layers
  - [ ] Add Swagger UI usage instructions
  - [ ] Update development setup steps

- [ ] Update `apps/backend/docs/api-spec.md`
  - [ ] Add new vocabulary endpoints
  - [ ] Reference OpenAPI spec as source of truth
  - [ ] Add link to Swagger UI

- [ ] Update `docs/architecture.md`
  - [ ] Document clean architecture adoption
  - [ ] Update backend architecture diagram
  - [ ] Explain separation of concerns

### Code Documentation

- [ ] Add file header comments to all new files (use File Summary Template)
- [ ] Ensure all services have JSDoc class descriptions
- [ ] Document repository interfaces thoroughly

---

.5 hours)

### Create Unified API Client (Per TODO.md)

- [ ] Create `apps/frontend/src/config/api.ts`
  - [ ] Export `API_CONFIG` with `baseURL`, `timeout`, `withCredentials`
  - [ ] Export `getApiUrl()` helper function

- [ ] Create `apps/frontend/src/services/apiClient.ts`
  - [ ] Implement `ApiClient.authRequest()` wrapper around `authFetch`
  - [ ] Implement `ApiClient.publicRequest()` for unauthenticated calls
  - [ ] Add TypeScript types for common request/response patterns

- [ ] Update existing service files to use `ApiClient`
  - [ ] `audioService.ts` - Remove `API_BASE` duplication, use `ApiClient.publicRequest()`
  - [ ] `conversationService.ts` - Remove `API_BASE` duplication, use `ApiClient.publicRequest()`
  - [ ] `progressService.ts` - Replace `authFetch` imports with `ApiClient.authRequest()`
  - [ ] `useAudioPlayback.ts` - Update to use centralized config

### Update Vocabulary Service for New Endpoints

- [ ] Update `apps/frontend/src/features/mandarin/services/vocabularyDataService.ts`
  - [ ] Replace CSV loading with backend API calls:
    - [ ] `fetchLists()` → `GET /api/v1/vocabulary/lists` (no more direct CSV access)
    - [ ] `fetchWords(listId)` → `GET /api/v1/vocabulary/lists/:listId/words`
    - [ ] `searchLists(query, filters)` → `GET /api/v1/vocabulary/search`
  - [ ] Use `ApiClient.publicRequest()` for all calls
  - [ ] Keep local CSV loading as **development fallback only** (when backend is down)
  - [ ] Remove dependency on public folder CSVs in production

- [ ] Clean up deprecated frontend utilities
  - [ ] `csvLoader.ts` - Mark as internal/dev-only utility
  - [ ] `vocabListHelpers.ts` - Client-side filtering replaced by backend API
  - [ ] Remove `public/data/vocabulary/` from production builds (optional - keep for dev)

### Update Progress Components

- [ ] Update `VocabularyCard.tsx` to use new `/api/v1/vocabulary/lists/:listId/progress` endpoint
  - [ ] Remove local `calculateListProgress()` function
  - [ ] Fetch pre-calculated progress from backend via `ApiClient.authRequest()`
  - [ ] Add loading/error states
  - [ ] Simplify component logic

### Environment Configuration

- [ ] Update `apps/frontend/.env.example`

  ```bash
  VITE_API_URL=http://localhost:3001
  # Set to Railway backend URL in production
  # Frontend fetches vocabulary from backend API, not GCS directly
  ```

- [ ] Update `apps/backend/.env.example`

  ```bash
  # GCS Configuration for Vocabulary Data
  GCS_VOCAB_BUCKET=mandarin-vocab-data
  GCS_ENABLED=true

  # Note: Uses existing GCS_CREDENTIALS_RAW (already configured)
  # No additional credentials needed
  ```

---

## ✅ Phase 10: Final Validation & Cleanup (1 hour)

### Quality Gates

- [ ] Run all tests: `npm test` (backend)
  - [ ] Unit tests: 100% passing
  - [ ] Integration tests: 100% passing
  - [ ] Coverage: >90% on core services

**New variables for Story 13-6:**

- `VOCABULARY_DATA_BASE_URL` - Base URL for vocabulary CSV files (default: frontend public folder)

**Existing variables (unchanged):**

- `DATABASE_URL` (Prisma)
- `JWT_SECRET` (Auth)
- `REDIS_URL` (Cache)
- `GOOGLE_TTS_CREDENTI (Backend)

- [ ] Verify Procfile unchanged: `web: node apps/backend/src/index.js`
- [ ] Check build command includes new folder structure
- [ ] Set environment variables:
  - [ ] `GCS_BUCKET_NAME=mandarin-vocab-data` (used by gcsService)
  - [ ] `GCS_ENABLED=true`
  - [ ] Verify `GCS_CREDENTIALS_RAW` is already set
- [ ] Test backend can access GCS bucket:
  - [ ] `GET /api/v1/vocabulary/lists` returns data from GCS
  - [ ] `GET /api/v1/vocabulary/lists/:listId/words` returns parsed CSV from GCS
- [ ] Test API endpoints on Railway staging environment
- [ ] Verify CORS allows requests from Vercel frontend (for API, not GCS)

### Vercel Deployment (Frontend)

- [ ] Set environment variables:
  - [ ] `VITE_API_URL=https://your-backend.railway.app`
  - [ ] **No GCS-related env vars needed** (backend handles GCS)
- [ ] Keep static vocabulary files in `public/data/vocabulary/` for development fallback
- [ ] Test end-to-end flow: **Frontend → Railway backend API → GCS → Backend → Frontend**
- [ ] Verify frontend never directly accesses GCS URLs

### Cross-Doc Alignment

- [ ] Verify story BR matches implementation
- [ ] Update story BR status to "Completed"
- [ ] Update implementation doc with final commit references
- [ ] Update epic README with story 13-6 completion

### Code Review Checklist

- [ ] No business logic in controllers ✓
- [ ] No Express imports in core/ services ✓
- [ ] No Prisma imports in core/ services ✓
- [ ] All repositories implement declared interfaces ✓
- [ ] All services accept dependencies via constructor (DI) ✓
- [ ] OpenAPI spec accessible at `/api-docs.json` ✓
- [ ] Swagger UI renders all endpoints correctly ✓
- [ ] .NET migration guide complete ✓

---

## 🚀 Deployment Considerations

### Environment Variables

**New variables for Story 13-6:**

- `GCS_ENABLED` - Feature flag for GCS (set to "true" in production, "false" in dev)

**Existing variables (reused):**

- `GCS_BUCKET_NAME` - Set to "mandarin-vocab-data" (gcsService uses this)
- `GCS_CREDENTIALS_RAW` - Service account credentials (already configured)
- `DATABASE_URL` (Prisma)
- `JWT_SECRET` (Auth)
- `REDIS_URL` (Cache)

**Frontend variables (no changes needed):**

- `VITE_API_URL` - Backend API base URL (already used)
- Frontend accesses vocabulary through backend API, not directly from GCS

2. **CSV Storage Location**: ✅ **Migrated to Google Cloud Storage**. Backend fetches from GCS and serves to frontend via API. Frontend never directly accesses GCS. Leverages existing `gcsService.js` infrastructure. Better security and control.

3. **Cache Strategy**: VocabularyRepository uses in-memory cache (1h TTL). Redis integration optional for multi-instance deployments.

4. **API Versioning**: All new endpoints use `/api/v1/` prefix for consistency with progress API.

5. **Frontend API Client**: Consolidate `API_BASE` repetition into centralized `ApiClient` wrapper per TODO.md. Prepares for future React Query/Axios migration.

6. **Data Source Strategy**: Backend reads vocabulary from GCS bucket using existing `gcsService.js`. Frontend calls backend API endpoints only. No direct GCS access from frontend.

---

## ❓ Open Questions

- [x] **Should we migrate CSV data to GCS before implementing backend APIs?** → Yes. Backend proxies GCS access to frontend via API.
- [x] **Should we consolidate API_BASE duplication in frontend?** → Yes. Create `ApiClient` wrapper per TODO.md as part of Story 13-6.
- [ ] Should we migrate CSV data to Prisma database tables? (Defer to separate story)
- [ ] Should we add rate limiting to vocabulary search endpoint? (Consider if performance issues arise)
- [ ] Should we support pagination for vocabulary lists? (Not needed yet - <50 lists)

### Follow-Up Stories (Post Story 13-6)

- **Epic 14 / Future Story: GCS Migration**
  - Migrate vocabulary CSV files from Vercel to Google Cloud Storage
  - Update VocabularyRepository to use GCS URLs
  - Add admin panel for uploading new vocabulary files
  - Estimated effort: 3-4 hours

- **Future Story: React Query + Axios Migration (from TODO.md)**
  - Replace `authFetch` with Axios interceptors
  - Implement React Query for caching/retry logic
  - Estimated effort: 12 hours (per TODO.md
- [ ] Test API endpoints on Railway staging environment

### Vercel Deployment (Frontend)

- [ ] Update frontend to point to Railway backend for vocabulary API
- [ ] Verify CORS headers allow new endpoints
- [ ] Test end-to-end flow in production

---

## 📊 Success Metrics

- [ ] All acceptance criteria met (from story BR)
- [ ] Test coverage maintained >90%
- [ ] OpenAPI spec validates without errors
- [ ] All existing endpoints continue to work
- [ ] New vocabulary endpoints functional
- [ ] Swagger UI accessible and usable
- [ ] .NET migration guide reviewed and approved

---

## 🔗 Related Documentation

- Business Requirements: `docs/business-requirements/epic-13-production-backend-architecture/story-13-6-clean-architecture.md`
- Implementation Doc: `docs/issue-implementation/epic-13-production-backend-architecture/story-13-6-clean-architecture.md`
- Code Conventions: `docs/guides/code-conventions.md`
- SOLID Principles: `docs/guides/solid-principles.md`
- Git Conventions: `docs/guides/git-convention.md`

---

## 📝 Notes & Decisions

### Architectural Decisions

1. **JavaScript vs TypeScript**: Keeping JavaScript for consistency with existing backend. TypeScript conversion can be separate story.

2. **CSV Storage Location**: ✅ **Migrated to Google Cloud Storage**. Backend fetches from GCS and serves to frontend via API. Frontend never directly accesses GCS. Leverages existing `gcsService.js` infrastructure. Better security and control.

3. **Shared Packages**: ✅ **Pure JS + .d.ts pattern**. Convert `@mandarin/shared-constants` to pure JavaScript with TypeScript definition files. No build step needed, better DX.

4. **Cache Strategy**: VocabularyRepository uses in-memory cache (1h TTL). Redis integration optional for multi-instance deployments.

5. **API Versioning**: All new endpoints use `/api/v1/` prefix for consistency with progress API.

6. **Frontend API Client**: Consolidate `API_BASE` repetition into centralized `ApiClient` wrapper per TODO.md. Prepares for future React Query/Axios migration.

7. **Data Source Strategy**: Backend reads vocabulary from GCS bucket using existing `gcsService.js`. Frontend calls backend API endpoints only. No direct GCS access from frontend.

---

## ❓ Open Questions

- [x] **Should we migrate CSV data to GCS before implementing backend APIs?** → Yes. Backend proxies GCS access to frontend via API.
- [x] **Should we consolidate API_BASE duplication in frontend?** → Yes. Create `ApiClient` wrapper per TODO.md as part of Story 13-6.
- [ ] Should we migrate CSV data to Prisma database tables? (Defer to separate story)
- [ ] Should we add rate limiting to vocabulary search endpoint? (Consider if performance issues arise)
- [ ] Should we support pagination for vocabulary lists? (Not needed yet - <50 lists)

5. **API Versioning**: All new endpoints use `/api/v1/` prefix for consistency with progress API.

6. **Frontend API Client**: Consolidate `API_BASE` repetition into centralized `ApiClient` wrapper per TODO.md.

### Open Questions

- [x] **Migrate CSV to GCS or keep in Vercel?** → GCS selected (Phase 0)
- [x] **Shared packages: Pure JS or TypeScript?** → Pure JS + .d.ts (Phase 0)
- [ ] Should we migrate CSV data to Prisma database tables later? (Defer - GCS sufficient for now)
- [ ] Should we add rate limiting to vocabulary search endpoint? (Consider if performance issues arise)
- [ ] Should we support pagination for vocabulary lists? (Not needed yet - <50 lists)

### Follow-Up Stories

- **Optional: Prisma Database Migration** - Migrate vocabulary from GCS to database tables (6-8 hours)
- **React Query + Axios** - Replace `authFetch` wrapper per TODO.md (12 hours)

---

**Plan Last Updated:** 2026-01-17  
**Status:** Ready for implementation  
**Key Decisions:** GCS migration (Phase 0), Pure JS + .d.ts for shared packages
