# System Architecture

> **Purpose:** High-level system design decisions, architectural patterns, and technology choices.  
> **For Implementation Details:** See feature-specific docs in `apps/backend/docs/` and `apps/frontend/src/features/*/docs/`.

## Table of Contents

- [Overview](#overview)
- [Monorepo Structure](#monorepo-structure)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Data Flow & Integration](#data-flow--integration)
- [Caching Strategy](#caching-strategy)
- [Authentication & Multi-User](#authentication--multi-user)
- [Quiz & Review System](#quiz--review-system)
- [External Services](#external-services)

---

## Overview

PinyinPal is a **full-stack Mandarin learning platform** built with:

- **Frontend**: React 19.1.0 + TypeScript + Vite (deployed to Vercel)
- **Backend**: Node.js + Express (deployed to Railway)
- **Database**: PostgreSQL with Prisma ORM (hosted on Neon)
- **Cache**: Redis (Upstash) for API response caching
- **External APIs**: Google Cloud TTS, Google Cloud Storage, Gemini AI

**Architecture Style:** Monorepo with npm workspaces, Modulith (Modular Monolith) on backend, Feature-Based Frontend

## Monorepo Structure

```
mandarin-vite-react-ts/
├── apps/
│   ├── frontend/          # React application (Vite + TypeScript)
│   └── backend/           # Express API (Node.js + Prisma)
├── packages/
│   ├── shared-types/      # Shared TypeScript interfaces
│   ├── shared-constants/  # API routes, HSK levels, regex patterns
│   └── shared-utils/      # Shared utility functions
├── docs/                  # Architecture, guides, business requirements
├── content/              # Version-controlled content (aggregate JSON files)
│   ├── manifest.json     # Content manifest
│   ├── characters/       # characters.json + index.json (aggregate, not per-entity)
│   ├── radicals/         # radicals.json + index.json
│   ├── words/            # words.json + index.json
│   ├── pinyin/ strokes/ tones/ references/   # Reference data sets
│   └── seed/             # Seed pipeline source — phase1/, phase2/ aggregate JSON
└── terraform/             # Infrastructure as Code (GCS, IAM)
```

**See detailed structure:**

- Backend: [apps/backend/README.md](../apps/backend/README.md)
- Frontend: [apps/frontend/README.md](../apps/frontend/README.md)

## Backend Architecture

**Pattern:** Modulith (Modular Monolith) — modules pick their own internal pattern

**Layer Separation (Modular Monolith):**

- **App Layer** (`src/app/`): Entry point, DI composition root (`container.ts`), route registration (`routes.ts`)
- **Module Layer** (`src/modules/*/`): Per-domain modules containing `api/` (controllers/routes), `services/` or `use-cases/` (business logic), `repositories/` (data access), `types/` (typed interfaces)
  - Current modules (13): `audio`, `auth`, `characters`, `foundations`, `health`, `mnemonics`, `phonetic-clusters`, `progression`, `quiz`, `radicals`, `readers`, `review`, `words`
  - **`modules/audio/`** — the audio capability (renamed from the scaffolded `modules/tts` — capability modules are named after the capability, never the provider): HTTP-free `AudioService` facade → `AudioSynthesizer.synthesizeToPath` (path-parameterized exists-or-synthesize primitive) → `AudioPathCache` (Redis path cache + per-key single-flight) → `AudioUrlSigner` (signed URLs). HTTP mapping lives in `modules/audio/api/` and mounts the public `POST /v1/tts` wire path.
- **Shared Layer** (`src/shared/`): Cross-cutting — `infrastructure/` (external clients, cache, database, security), `middleware/`, `utils/`, `config/`. **Never contains capability logic**: `shared/infrastructure/external/` holds Tier-0 raw clients (`GCSClient`, `GoogleTTSClient`, `GeminiClient`) and the Tier-1 resilient `GeminiService` (relocated from `shared/services/`). `shared/services/` and `shared/tts/` are retired.

**Dependency Rule:** API → Services/Use-Cases → Repositories → Infrastructure, never reverse

**Key Design Decisions:**

1. **Single Express App** (dev + prod): Unified behavior, no dual-backend maintenance
2. **ESM Modules**: TypeScript source uses `.ts` files; the `.js` extension in import paths refers to compiled output (Node.js ESM requires file extensions in imports)
3. **Dependency Injection**: Constructor injection with direct instantiation at composition root
4. **Fail-Open Caching**: Redis failures never block requests (degrades to API calls)
5. **Repository Pattern**: All database access through repositories (abstracts Prisma)
6. **Types Directory**: Each module has `types/` with barrel re-exports; no `Record<string, unknown>` casts, no `as unknown as` double casts

**See detailed documentation:**

- Backend structure: [apps/backend/README.md](../apps/backend/README.md)
- Backend design decisions: [apps/backend/docs/design.md](../apps/backend/docs/design.md)
- API specification: [apps/backend/docs/api-spec.md](../apps/backend/docs/api-spec.md)
- Database schema: [apps/backend/DATABASE.md](../apps/backend/DATABASE.md)

## Frontend Architecture

**Pattern:** Feature-Based Organization with Context API state management

**Structure:**

- **Features** (`src/features/`): Self-contained modules
  - **Auth**: User authentication and session management (LoginForm, RegisterForm, AuthContext)
  - **Dashboard**: Learning statistics and activity overview (DashboardGuest, DashboardSections, DashboardWelcome)
  - **Foundations**: Phase 1 learning path with Pinyin, Tones, Strokes, and Animations reference content
  - **PhoneticClusters** (`features/phonetic-clusters`): DB-driven phonetic family browsing — cluster membership from `GET /v1/phonetic-clusters` with HSK filtering
  - **Quiz**: Strategy-pattern-based quiz engine (`QuizStrategy` interface with `AudioToPinyinAndToneStrategy`) for audio-to-pinyin-and-tone assessment with progress tracking
  - **Review**: Strategy-driven SRS flip-card practice (`ReviewStrategy` interface with `PinyinReviewStrategy` + `ToneReviewStrategy`) for pinyin and tone identification with interval-doubling spaced repetition
  - **Radicals** (`features/radicals`): Radical browser, detail cards, and dual radical/phonetic trees (Phase 2 preview / Phase 3 full expansion)
  - **Character Hub**: Character detail panel with identity card, mnemonics, radicals, readings, common words, and stroke animation
  - **Word Hub** (`features/word-hub`): Word detail panel — pinyin, definitions, HSK badge, constituent character chips, and measure words (量词) fetched via `GET /v1/words/:id/measure-words`
  - **LexicalHub** (`features/lexical-hub`): Entity detail hub — modal overlay hosting a registry of entity-specific detail panels (CharacterHub, WordHub); opened from anywhere via `openHub()` in `shared/hub-entry`
  - **Readers** (`features/readers`): Graded readers — passage browsing/reading, reading sessions, bookmarks, and in-text word lookup via `WordPopover` → LexicalHub
- **Pages** (`src/pages/`): Route-level page orchestrators
  - `pages/learn/`: Learn section pages (FoundationsPage with 4 sub-tabs, ContentPlaceholderPage for locked sections)
- **Router** (`src/router/`): React Router configuration
  - `LearnRoutes.tsx`: Phase-gated route definitions for the `/learn/*` section with redirects from deprecated routes
- **Shared Layer** (`src/shared/`): Cross-cutting concerns
  - **api/**: HTTP client (axiosClient, aliased as `services`)
  - **audio/**: Transport-only playback core — `AudioManager` (app-wide singleton), `AudioEngine` (HTMLAudio), `BrowserTTS` (SpeechSynthesis), `AudioUrlCache`, playback strategies, and feature-free `contracts/` (default word `AudioBehavior`). It plays `PlayableItem[]` with ordered candidates; fallback policy is DATA (`candidates`), never a resolver. Never imports features/modules.
  - **components/**: Reusable UI primitives (Button, Input, ToggleSwitch, Skeleton, ClassificationBadge, MnemonicCard, etc.)
  - **config/**: Application configuration (API_CONFIG)
  - **constants/**: Path constants, tone maps
  - **hooks/**: Shared React hooks (usePhaseGate for phase-gating access, useReview for SRS review sessions, useAudioManager / useAudioItemPlayback for audio playback)
  - **layouts/**: AppLayout, LearnLayout (phase-gated route navigation with locked tab indicators)

### Component Hierarchy

The frontend follows a strict layering for component decomposition:

```mermaid
flowchart TD
    P[Page Route] --> FO[Feature Orchestrator]
    FO --> FC[Feature Components]
    FC --> SH[Shared UI Components]
    SH --> PR[Primitives]

    subgraph "src/pages/"
        P
    end
    subgraph "src/features/<feature>/components/"
        FC
    end
    subgraph "src/shared/components/"
        SH
    end
    subgraph "HTML + CSS Variables"
        PR
    end

    style P fill:#3b82f6,color:#fff
    style FO fill:#8b5cf6,color:#fff
    style FC fill:#10b981,color:#fff
    style SH fill:#f59e0b,color:#fff
    style PR fill:#6b7280,color:#fff
```

**Rules:**

1. **Pages** (`src/pages/`) — Route-level orchestrators, minimal JSX, delegates to features
2. **Feature components** (`src/features/<feature>/components/`) — Domain-specific compositions of shared UI
3. **Shared UI** (`src/shared/components/`) — Reusable primitives (Button, Input, Card patterns), never feature-specific
4. **Primitives** — Raw HTML elements styled with CSS variables from `globals.css`

**Before creating any component:**

1. Check `src/shared/components/index.tsx` — does a shared component already exist?
2. Check `DESIGN.md` — are there design tokens or component specs to follow?
3. Can the component be decomposed further? (If it does >2 things, split it)

**State Management:**

- **Pattern**: React Context + useReducer with split contexts and reducer composition
- **Provider Hierarchy**:
  ```
  BrowserRouter → AuthProvider (auth) → AppLayout → LearnLayout → ProgressProvider (quiz) + UserIdentityProvider (quiz)
  ```
- **Persistence**: Backend API (PostgreSQL) for progress, localStorage for device identity
- **Zustand Stores**: shared stores in `src/shared/store/` (`userStore`, `uiStore`, `hubStore`) plus feature-scoped stores (e.g. `mnemonicStore`, `quizSessionStore`, `readingStore`, `audioStore`, dashboard phase-gates/activity)
- **Architecture**: Reducer composition with normalized state shape

**See detailed documentation:**

- Frontend structure: [apps/frontend/README.md](../apps/frontend/README.md)
- Feature modules: [apps/frontend/src/features/README.md](../apps/frontend/src/features/README.md)
- Frontend development guide: [Frontend Development Guide](./guides/setup/frontend-development.md)

#### Custom Data Fetching Hook

Custom data-fetching hooks (e.g., `useExamples`) with in-memory dedup and sessionStorage cache.

### Accessibility

**WCAG 2.1 AA compliance** for accessibility (ARIA labels, keyboard navigation, 44px+ touch targets, semantic HTML).

## Data Flow & Integration

**Content (static reference data) and User Data (dynamic progress) are separated at the storage layer and joined at query time.** See [Architecture Overview](../docs/architecture.md#content-data-flow) for the full design.

**Client → Server:**

```
Frontend Service → fetch(API_ROUTES.ttsAudio) → Vite Dev Proxy (dev) → Backend Controller
                                                 ↓
                                          Direct Request (prod)
```

**Backend Layers:**

```
Controller → Service (business logic) → Repository (database)
                ↓                            ↓
         External Client              Prisma ORM
         (Google TTS, Gemini)         (PostgreSQL)
                ↓
         Redis Cache (optional)
```

**Shared Constants:** `packages/shared-constants` ensures frontend/backend use identical API routes

**FE `shared/audio` ↔ BE `modules/audio` are peers in naming/responsibility only** — there is no cross-app import between them. The real seam is HTTP (`POST /v1/tts`, `POST /v1/readers/passages/:id/audio`) + `@mandarin/shared-types`. Frontend `shared/audio` is a transport adapter (playback + browser-TTS fallback) that plays `PlayableItem[]` and holds **no resolver concept** — fallback policy is expressed as data (ordered `candidates` per item) via feature-owned `AudioBehavior` contracts (the default word contract lives in `shared/audio/contracts/`; the passage contract is readers-owned). Backend `modules/audio` is the synthesis orchestrator (Google TTS + GCS + Redis) behind an HTTP-free capability module. Direction rule: shared never imports features/modules; cross-imports between shared modules go through barrels only (both enforced by `npm run check:module-boundaries`).

The passage-audio wire contract lives in `@mandarin/shared-types`: `AudioSource` (`"gcs" | "ondemand" | "failed"`), `SentenceAudioResult` (`{ url, source }`), and `PassageAudioResponse` (`{ audioUrls: Record<number, SentenceAudioResult> }`) — used by `POST /v1/readers/passages/:id/audio`. On-demand passage audio writes to `tts/{passageHash}/{i}.mp3` (identical to a future pre-gen path, `D4`); older on-demand objects from the word-namespace (`tts/{hash}.mp3`) are no longer referenced — a harmless cold cache, no migration needed.

**See detailed integration:**

- Vite proxy config: [Vite Setup Guide](./guides/setup/vite.md)
- Backend setup: [Backend Development Guide](./guides/setup/backend-development.md)

### Content Data Flow

Static content (characters, words, radicals, etc.) follows a separate path from dynamic user data:

```
┌──────────────────────────┐    ┌──────────────────────┐    ┌──────────────────┐
│ content/seed/phase2/*.json│ ──►│  prisma/seed.ts       │ ──►│  Prisma Models    │
│ (aggregate JSON, Git)     │    │  (bulk createMany)   │    │  (PostgreSQL)     │
└──────────────────────────┘    └──────────────────────┘    └────────┬─────────┘
                                                                     │
┌───────────────────┐     ┌──────────────────┐                       │
│  review_log table │ ◄── │  CRUD Progress   │                       │
│  (append-only)    │     │  API             │                       │
└───────────────────┘     └──────────────────┘                       │
                                                                     ▼
                                                            ┌───────────────────┐
                                                            │  Query API        │
                                                            │  (via Repositories)│
                                                            └───────────────────┘
```

**Key principles:**

- Content is authored as **aggregate JSON files** under `content/` (e.g., `content/characters/characters.json`, `content/words/words.json`) plus phase-based seed sources in `content/seed/phase2/` — not one JSON file per entity
- **All-in-DB**: content is bulk-loaded into Prisma tables by the seed pipeline; production reads content via Prisma repositories, never from JSON files at request time
- Entity relationships are stored in DB junction tables (CharacterRadical, WordCharacter, MeasureWordWord, etc.)
- Dynamic user data uses CRUD with an append-only `review_log` side-effect table
- The Read Model pre-joins content + relationships + progress for query optimization
- GCS is used for **binary assets only** (TTS audio); the legacy `ContentItem` registry table and its `ContentIndexService` sync were removed in migration `20260724160000_drop_deprecated_models`

#### Seed Pipeline (all-in-DB)

`apps/backend/prisma/seed.ts` reads the per-table aggregate JSON files from `content/seed/phase2/` and bulk-inserts them into Prisma tables with `prisma.<model>.createMany({ skipDuplicates: true })` (idempotent — safe to re-run). Run via `npx prisma db seed` from `apps/backend`. The pipeline has **26 steps** in strict foreign-key order; the reference tables added in migration `20260731045648_add_reference_tables` seed first (**Radical** 20, **Tone** 5, **PinyinPhoneme** 50, **TonePair** 6, **ToneRule** 3 — steps 2–6), then Characters → Readings/Radicals → WordCharacters → MeasureWordWord, etc. Production reads content through Prisma repositories only — `content/` is authoring source, never a runtime read. GCS serves binary assets only.

See the canonical reference: [Seed Pipeline Guide](./guides/data/seed-pipeline.md) (26-step order + FK table, regeneration flow, runbook, verification, idempotency rules).

## Caching Strategy

**Pattern:** Cache-Aside with Fail-Open

**Cached Resources:**

- **TTS Audio**: Redis stores the GCS **file path** keyed by SHA256 hash (`tts:path:{hash}`, 24-hour TTL); the MP3 audio lives in GCS, and returned signed URLs are short-lived (1-hour TTL, `TTS_SIGNED_URL_TTL_SECONDS = 3600`) and re-signed on every read
- **AI Feedback**: 24-hour TTL, keyed per word+answer combination
- **Due Words**: 5-minute TTL per user
- **Quiz Attempts**: Results cached per user
- **Mnemonic Stories**: 30-day TTL (AI-generated), no expiry (user-edited); stampede prevention via Redis SETNX

**Performance:**

- **Hit Rate**: 75% (TTS) after warmup
- **Latency**: <20ms (cache hit) vs 1.5-5s (API call + generation)
- **Cost Savings**: >50% reduction in Google Cloud API costs

**Error Handling:**

- Redis failures return `null` (treated as cache miss)
- Requests always complete, using live API if cache unavailable
- Monitoring via `/api/v1/health` endpoint exposes hit/miss metrics

**See detailed implementation:**

- Redis caching guide: [Caching Patterns Guide](./guides/operations/caching-patterns.md)

## Authentication & Multi-User

**Pattern:** JWT with Refresh Token Rotation

**Token Strategy:**

- **Access Token**: 15-minute expiration, httpOnly cookie, used for API auth
- **Refresh Token**: 7-day expiration, stored in database, rotated on each refresh
- **Rotation**: Prevents replay attacks (each refresh issues new token, invalidates old)

**Password Security:**

- bcrypt hashing with cost factor 10
- Rate limiting: 5 login attempts per minute per IP

**Progress Isolation:**

- All progress records filtered by `userId` (from JWT claims)
- Foreign key constraints ensure referential integrity
- Unique constraint on `(userId, wordId)` prevents duplicates

**Cross-Device Sync:**

- Progress automatically synced to PostgreSQL via `/api/v1/progress/*` endpoints
- Frontend uses optimistic updates (immediate UI response, server reconciliation)

**See detailed implementation:**

- Auth system: [apps/backend/docs/api-spec.md](../apps/backend/docs/api-spec.md#authentication)
- Environment setup: [Environment Setup Guide](./guides/getting-started/environment-setup.md)

## Quiz & Review System

The platform has two distinct assessment systems. **Quiz** is a timed, auto-scored assessment for phase gating — strategy-pattern-based with `QuizAttempt` records. **Review** is a self-paced, self-rated spaced repetition system using SM-2 with active recall (prompt → type pinyin → select tone → self-rate retention).

### Phase Gating

Users progress through 4 learning phases (Blueprint → Core 300 → Network → Advanced Fluidity), each with gate quizzes to unlock the next. Phase gate state is stored server-side (persisted `PhaseGate` row, updated when a gate quiz is passed).

#### Progression Gates

Computed per-user gate status is served by `GET /api/v1/progression/gates` (`ROUTE_PATTERNS.progressionGates`). Unlike the persisted `PhaseGate` row (which only reflects quiz-pass updates), this endpoint **re-evaluates each gate against current data**, so it surfaces gates that were passed outside the quiz flow:

- **`phase2Gate`** — IME Simulator score ≥80% (`GATE_THRESHOLDS.IME_SIMULATOR_MIN_SCORE = 20` of 25); already-passed users are grandfathered.
- **`characterCountGate`** — ≥500 distinct characters learned (`CharacterProgress` rows with `confidence > 0`).
- **`phase3To4Gate`** — comprehension: ≥60% on the passage comprehension quiz AND ≥90% known-word ratio in a passage at the learner's HSK level; falls back to a 5-question qualification quiz when no passage exists at that level.

The route uses `optionalAuth` — **guest users receive an all-passed response**; authenticated users get the computed per-user status. All threshold values live in `apps/backend/src/config/gate-thresholds.ts` (`GATE_THRESHOLDS`) — no magic numbers in service code.

> **Known gap (Epic 21):** `/v1/progression/gates` currently has **no frontend route consumer** — the UI reads the persisted `/v1/progression/phase-gate` instead. A gate passed outside the quiz flow (e.g. the ≥500 character-count gate) is computed server-side but not yet surfaced in the UI.

### Leech Detection

Items with repeated failures are flagged as "leeches" for targeted Pareto-based review.

### Backend Modules

- **Mnemonics module**: CRUD + AI generation of mnemonic stories per character via Gemini API, with 30-day caching and stampede prevention. Endpoints: `GET /api/v1/mnemonics/:glyph`, `POST /api/v1/mnemonics/:glyph`, `PUT /api/v1/mnemonics/:glyph`
- **Quiz module**: Strategy-based quiz engine, generates questions from content data, evaluates answers, manages attempt lifecycle
- **Progression module**: Handles phase gating, foundation progress tracking, quiz attempt coordination with pass threshold evaluation
- **Review module**: Builds review items from content files and SRS state, manages SM-2 scheduling

**See detailed documentation:**

- Strategy pattern implementation: [Strategy Pattern (Frontend)](./knowledge-base/frontend/strategy-pattern-frontend.md)
- Spaced repetition algorithm: [Spaced Repetition Algorithms](./knowledge-base/learning-theory/spaced-repetition-algorithms.md)
- API specification: [apps/backend/docs/api-spec.md](../apps/backend/docs/api-spec.md#progress-tracking-endpoints)

## External Services

**Google Cloud Platform:**

| Service             | Purpose                                    | Client Location                                                          | Configuration                |
| ------------------- | ------------------------------------------ | ------------------------------------------------------------------------ | ---------------------------- |
| Text-to-Speech      | Audio generation for vocabulary            | `src/shared/infrastructure/external/GoogleTTSClient.ts`                  | `GOOGLE_TTS_CREDENTIALS_RAW` |
| Cloud Storage (GCS) | Audio/file storage                         | `src/shared/infrastructure/external/GCSClient.ts`                        | `GCS_BUCKET_NAME`            |
| Gemini AI           | AI feedback, examples, mnemonic generation | `src/shared/infrastructure/external/GeminiClient.ts` via `GeminiService` | `GEMINI_API_CREDENTIALS_RAW` |

**Upstash Redis:**

- **Purpose**: API response caching (TTS, AI feedback, quiz sessions, due words)
- **Client**: `src/shared/infrastructure/cache/CacheService.ts`
- **Configuration**: `REDIS_URL` (from Upstash)

**Neon PostgreSQL:**

- **Purpose**: User accounts, progress tracking, authentication, gamification
- **Client**: Prisma ORM (`src/shared/infrastructure/database/client.ts`)
- **Configuration**: `DATABASE_URL`
- **Key Tables**: `User`, `Session`, `Character`, `CharacterReading`, `CharacterRadical`, `Word`, `WordCharacter`, `MeasureWord`, `MeasureWordWord`, `Passage`, `ReadingSession`, `Bookmark`, `PinyinSyllable`, `MnemonicStory`, `ReviewItem`, `ReviewLog`, `QuizAttempt`, `QuizAttemptAnswer`, `FoundationProgress`, `RadicalProgress`, `PhaseGate`, `StudyStreak`

**Gamification System:**

Gamification (partial): a `StudyStreak` table exists and a ProgressPage placeholder UI renders streak/badge/XP sections, but there is no gamification module or API surface yet.

**AI Feedback System:**

Personalized error explanations for incorrect quiz answers via Gemini API, with Redis caching and timeout protection.

## Deployment Architecture

**Production Environment:**

| Component | Platform | Trigger          | Runtime                     |
| --------- | -------- | ---------------- | --------------------------- |
| Frontend  | Vercel   | Push to `main`   | Node.js 20 (Vite build)     |
| Backend   | Railway  | Push to `main`   | Node.js 20 (Express server) |
| Database  | Neon     | Manual migration | PostgreSQL 17               |
| Cache     | Upstash  | Always-on        | Redis 7                     |

**Development Environment:**

- **Frontend**: Vite dev server (port 5173) with HMR
- **Backend**: Express with `tsx watch` (port 3001) hot reload
- **Proxy**: Vite proxies `/api/*` to localhost:3001 for seamless development

**CI/CD:**

- Automatic deployments on push to `main`
- Backend runs Prisma migrations before deploy (`railway.toml` `preDeployCommand`)
- Frontend builds via Vercel with automatic preview URLs

**See deployment guides:**

- Backend: [Backend Development Guide](./guides/setup/backend-development.md#deployment)
- Environment variables: [Environment Setup Guide](./guides/getting-started/environment-setup.md)

## Testing Strategy

**Backend (Vitest):**

- **Unit Tests**: Services, repositories, utilities (mocked dependencies)
- **Integration Tests**: Full API flows with test database (transactional isolation)
- **Coverage**: Testing follows the Testing Trophy (unit → integration → E2E); no hard coverage gate is mandated.

**Frontend (Vitest + React Testing Library):**

- **Component Tests**: Render behavior, user interactions, accessibility
- **Hook Tests**: Custom hooks with `renderHook` utility
- **Integration Tests**: Feature flows with mocked backend

**See testing guides:** [Frontend Testing](./guides/testing/frontend.md) | [Backend Testing](./guides/testing/backend.md)

## Key Architecture Patterns

**Backend:**

- **Modulith Architecture**: Self-contained modules under src/modules/<name>/. Each module selects its internal pattern (Clean Architecture, CRUD, CQRS) based on business complexity. See backend-architecture.md for details.
- **Repository Pattern**: Abstracts Prisma ORM, enables testing with mocks
- **Dependency Injection**: Services receive dependencies via constructor/factory
- **Fail-Open Caching**: Redis failures degrade gracefully to API calls

📖 **Deep Dive:** [Backend Architecture Patterns](./knowledge-base/backend/backend-architecture.md) - Modulith Architecture, module patterns, CORS

**Frontend:**

- **Feature-Based**: Self-contained modules with own components/hooks/services
- **Split Context**: Separate state/dispatch contexts prevent unnecessary re-renders
- **Reducer Composition**: Domain sub-reducers combined into root reducer
- **Normalized State**: `itemsById` + `itemIds` for O(1) lookups, immutable updates

**Shared:**

- **Monorepo**: Shared types/constants ensure API contract consistency
- **Fail-Fast Validation**: Input validation at API boundary (controllers)
- **Structured Logging**: Consistent log format for debugging and monitoring

## Related Documentation

- **Implementation Details**: [docs/issue-implementation/](./issue-implementation/)
- **Business Requirements**: [docs/business-requirements/](./business-requirements/)
- **Development Guides**: [docs/guides/](./guides/)
- **Knowledge Base**: [docs/knowledge-base/](./knowledge-base/)

- **Code Conventions**: [Backend Conventions](./guides/conventions/backend.md)

---

**Last Updated:** August 2, 2026
