# Project Documentation

## Quick Links

| Resource                                                   | Description                                   |
| ---------------------------------------------------------- | --------------------------------------------- |
| [System Architecture](architecture.md)                     | High-level architecture overview              |
| [Guides Index](guides/getting-started/README.md)           | All development guides by category            |
| [Knowledge Base](knowledge-base/README.md)                 | Technical concepts and patterns               |
| [Templates](templates/README.md)                           | Documentation templates (BR, implementation)  |
| [Architecture](architecture.md)                            | System architecture, data flow, caching, auth |
| [Copilot Instructions](../.github/copilot-instructions.md) | AI agent operational playbook                 |

## Guides by Category

### 🚀 Getting Started

| Guide                                                            | Description                               |
| ---------------------------------------------------------------- | ----------------------------------------- |
| [Quick Start](guides/getting-started/quickstart.md)              | Get the project running in 5 minutes      |
| [Project Overview](guides/getting-started/project-overview.md)   | Monorepo structure, tech stack, workflow  |
| [Environment Setup](guides/getting-started/environment-setup.md) | All environment variables and credentials |

### ⚙️ Setup Guides

| Guide                                                        | Description                           |
| ------------------------------------------------------------ | ------------------------------------- |
| [Frontend Development](guides/setup/frontend-development.md) | Vite, React, TypeScript setup         |
| [Backend Development](guides/setup/backend-development.md)   | Express server setup and architecture |
| [Database](guides/setup/database.md)                         | PostgreSQL/Prisma configuration       |
| [Vite](guides/setup/vite.md)                                 | Vite proxy config and build settings  |
| [Linting](guides/setup/linting.md)                           | ESLint and Prettier setup             |
| [Redis](guides/setup/redis.md)                               | Redis caching setup                   |

### 📐 Conventions

| Guide                                                      | Description                         |
| ---------------------------------------------------------- | ----------------------------------- |
| [Frontend](guides/conventions/frontend.md)                 | Component patterns, naming, exports |
| [Backend](guides/conventions/backend.md)                   | Clean Architecture, DI patterns     |
| [API Client](guides/conventions/api-client.md)             | Service layer and error handling    |
| [State Management](guides/conventions/state-management.md) | Context + reducer patterns          |
| [Git](guides/conventions/git.md)                           | Branch strategy, commit conventions |
| [Security](guides/conventions/security.md)                 | Auth, validation, rate limiting     |

### 🧪 Testing

| Guide                                          | Description               |
| ---------------------------------------------- | ------------------------- |
| [Frontend Testing](guides/testing/frontend.md) | Jest + RTL patterns       |
| [Backend Testing](guides/testing/backend.md)   | Vitest, integration tests |

### 🔗 Integrations

| Guide                                                                   | Description                   |
| ----------------------------------------------------------------------- | ----------------------------- |
| [Frontend-Backend Integration](guides/integrations/frontend-backend.md) | Proxy, CORS, shared constants |
| [Gemini API](guides/integrations/gemini-api.md)                         | AI conversation generation    |

### ⚡ Operations

| Guide                                                     | Description                    |
| --------------------------------------------------------- | ------------------------------ |
| [Workflow](guides/operations/workflow.md)                 | Development workflow checklist |
| [Infrastructure](guides/operations/infrastructure.md)     | Terraform, deployment, CI/CD   |
| [Caching Patterns](guides/operations/caching-patterns.md) | Redis caching setup and tuning |
| [Deployment](guides/operations/deployment.md)             | Vercel + Railway deployment    |
| [Troubleshooting](guides/operations/troubleshooting.md)   | Common issues and solutions    |
| [Review Checklist](guides/operations/review-checklist.md) | Code review checklist          |

### 📚 References

| Guide                                                       | Description                               |
| ----------------------------------------------------------- | ----------------------------------------- |
| [Code Conventions](guides/references/code-conventions.md)   | Legacy code conventions (pre-restructure) |
| [Testing Guide](guides/references/testing-guide.md)         | Legacy testing guide                      |
| [Tooling Standards](guides/references/tooling-standards.md) | Tooling configuration reference           |
| [Supabase Setup](guides/references/supabase-setup-guide.md) | Legacy Supabase guide                     |

## Knowledge Base

| Article | Description |
| ------- | ----------- |

|

### Architecture

| Article                                                                              | Description                                         |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| [Backend Architecture](knowledge-base/backend/backend-architecture.md)               | Layered architecture, CORS, middleware patterns     |
| [Backend Shared Kernel Layer](knowledge-base/backend/backend-shared-kernel-layer.md) | Shared code contracts and kernel-layer design       |
| [Frontend Modular Monolith](knowledge-base/frontend/frontend-modular-monolith.md)    | Feature-based monorepo modular architecture         |
| [SOLID Principles](knowledge-base/practices/solid-principles.md)                     | Applying SOLID to React/TypeScript                  |
| [API Response Patterns](knowledge-base/backend/api-response-patterns.md)             | Standardized API response format and error handling |

### Frontend

| Article                                                                                  | Description                                                                  |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [Frontend React Patterns](knowledge-base/frontend/frontend-react-patterns.md)            | React/TypeScript component and hook patterns                                 |
| [Frontend State Management](knowledge-base/frontend/frontend-state-management.md)        | Context API, reducers, normalized state                                      |
| [Frontend UI Patterns](knowledge-base/frontend/frontend-ui-patterns.md)                  | Reusable UI component patterns and conventions                               |
| [Frontend Development Server](knowledge-base/frontend/frontend-development-server.md)    | Dev proxy mechanics, cookie forwarding, CORS                                 |
| [Frontend Data Migration](knowledge-base/frontend/frontend-data-migration.md)            | Data migration strategies and patterns                                       |
| [Strategy Pattern on the Frontend](knowledge-base/frontend/strategy-pattern-frontend.md) | Using the Strategy pattern for per-type evaluation logic in React/TypeScript |

### Backend

| Article                                                                            | Description                                      |
| ---------------------------------------------------------------------------------- | ------------------------------------------------ |
| [Backend Authentication](knowledge-base/backend/backend-authentication.md)         | JWT auth, refresh tokens, cookie-based sessions  |
| [Backend Database PostgreSQL](knowledge-base/backend/backend-database-postgres.md) | PostgreSQL setup, connection pooling, migrations |

### Testing

| Article                                                                                  | Description                                     |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [Testing ES Modules (Jest)](knowledge-base/testing/testing-es-modules-jest.md)           | Jest ESM configuration and common pitfalls      |
| [Testing ES Modules (Vitest)](knowledge-base/testing/testing-es-modules-vitest.md)       | Vitest ESM setup and monorepo testing           |
| [Vitest Monorepo Conflicts](knowledge-base/testing/vitest-monorepo-version-conflicts.md) | Resolving Vitest version conflicts in monorepos |

### Learning Science

| Article                                                                                               | Description                                       |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| [Adult Mandarin Learning Roadmap](knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md)  | Pedagogical framework and curriculum sequence     |
| [Spaced Repetition Algorithms](knowledge-base/learning-theory/spaced-repetition-algorithms.md)        | SRS algorithm deep dive                           |
| [Vocabulary Retention Research](knowledge-base/learning-theory/vocabulary-retention-research.md)      | Research on vocabulary acquisition and retention  |
| [Gamification Psychology](knowledge-base/learning-theory/gamification-psychology-learning.md)         | Psychological principles behind gamified learning |
| [Cognitive Science: Active Recall](knowledge-base/learning-theory/cognitive-science-active-recall.md) | Active recall as a learning strategy              |

### Integration

| Article                                                                               | Description                                     |
| ------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [Google Cloud Integration](knowledge-base/infrastructure/integration-google-cloud.md) | Google Cloud services (TTS, Gemini) integration |
| [Caching Integration](knowledge-base/infrastructure/integration-caching.md)           | Redis caching strategies and patterns           |

### Other

| Article                                                                                         | Description                                     |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [Documentation Patterns](knowledge-base/practices/documentation-patterns.md)                    | How business and technical docs work together   |
| [Planning & Estimation](knowledge-base/practices/planning-estimation-strategies.md)             | Effort estimation and planning strategies       |
| [TypeScript Error Handling](knowledge-base/backend/typescript-error-handling.md)                | Error handling patterns in TypeScript           |
| [Git Workflow](knowledge-base/practices/git-workflow.md)                                        | Git branching strategies and workflows          |
| [Infrastructure Deployment](knowledge-base/infrastructure/infra-deployment.md)                  | Deployment infrastructure and CI/CD patterns    |
| [Infrastructure Configuration](knowledge-base/infrastructure/infra-configuration-management.md) | Infrastructure-as-code configuration management |

## Project Management

| Area                                            | Description                      |
| ----------------------------------------------- | -------------------------------- |
| [Business Requirements](business-requirements/) | Epic and story BR documents      |
| [Issue Implementation](issue-implementation/)   | Technical implementation details |

## Feature Documentation

Feature-specific docs live in feature folders under `apps/frontend/src/features/` and `apps/backend/src/modules/`:

- **Auth**: [`apps/frontend/src/features/auth/`](../apps/frontend/src/features/auth/)
- **Dashboard**: [`apps/frontend/src/features/dashboard/`](../apps/frontend/src/features/dashboard/)
- **Foundations**: [`apps/frontend/src/features/foundations/`](../apps/frontend/src/features/foundations/)
- **Gamification**: [`apps/frontend/src/features/gamification/`](../apps/frontend/src/features/gamification/)
- **Quiz**: [`apps/frontend/src/features/quiz/`](../apps/frontend/src/features/quiz/)
- **Review**: [`apps/frontend/src/features/review/`](../apps/frontend/src/features/review/)
- **Vocabulary**: [`apps/frontend/src/features/vocabulary/`](../apps/frontend/src/features/vocabulary/)
- **Backend API Spec**: [`apps/backend/docs/api/`](../apps/backend/docs/api/)
- **Backend Design**: [`apps/backend/docs/design.md`](../apps/backend/docs/design.md)

## Templates

- [Epic Business Requirements](templates/epic-business-requirements-template.md)
- [Story Business Requirements](templates/story-business-requirements-template.md)
- [Epic Implementation](templates/epic-implementation-template.md)
- [Story Implementation](templates/story-implementation-template.md)
- [Feature Design](templates/feature-design-template.md)
- [Commit Message](templates/commit-message-template.md)
- [File Summary](templates/file-summary-template.md)

## Contributing

To contribute to documentation:

- Use templates from [docs/templates](templates/)
- Follow commit conventions in [Git Guide](guides/conventions/git.md)
- Follow the [Workflow Guide](guides/operations/workflow.md)
- Update this index and related READMEs as needed
- **XP System**: +10 base per correct answer, +5 bonus for 7+ day streaks, 500 XP daily cap
- **Mystery Boxes**: 5% drop rate on 7-day multiples, random rewards (50 XP / 1 freeze / rare badge)
- **API Endpoints**: `GET /api/v1/progress/streak`, `POST /api/v1/progress/streak/freeze`, `GET /api/v1/gamification/badges`

**AI Feedback System:**

- **Purpose**: Personalized error explanations for incorrect quiz answers using Gemini API
- **Delivery**: Auto-generated inline with answer submission (`POST /api/v1/quiz/session/:sessionId/answer`); only returned when incorrect
- **Error Classification**: Tone errors (mā vs mǎ), character confusion (妈 vs 马), meaning mix-ups
- **Caching**: Redis 24-hour TTL, cache key per word+answer combination, ~70-80% cost reduction
- **Timeout Protection**: 3-second limit with graceful fallback to generic messages
- **Rate Limiting**: 10 requests/minute per user to prevent API abuse
- **Security**: Input sanitization (XSS prevention), JWT authentication required
- **Standalone Endpoint**: `POST /api/v1/quiz/feedback` (available for direct AI feedback requests)

## Deployment Architecture

**Production Environment:**

| Component | Platform | Trigger          | Runtime                     |
| --------- | -------- | ---------------- | --------------------------- |
| Frontend  | Vercel   | Push to `main`   | Node.js 20 (Vite build)     |
| Backend   | Railway  | Push to `main`   | Node.js 20 (Express server) |
| Database  | Supabase | Manual migration | PostgreSQL 15               |
| Cache     | Upstash  | Always-on        | Redis 7                     |

**Development Environment:**

- **Frontend**: Vite dev server (port 5173) with HMR
- **Backend**: Express with `tsx watch` (port 3001) hot reload
- **Proxy**: Vite proxies `/api/*` to localhost:3001 for seamless development

**CI/CD:**

- Automatic deployments on push to `main`
- Backend runs Prisma migrations on release (`railway.toml`)
- Frontend builds via Vercel with automatic preview URLs

**See deployment guides:**

- Backend: [Backend Development Guide](./guides/setup/backend-development.md#deployment)
- Environment variables: [Environment Setup Guide](./guides/getting-started/environment-setup.md)

## Testing Strategy

**Backend (Vitest):**

- **Unit Tests**: Services, repositories, utilities (mocked dependencies)
- **Integration Tests**: Full API flows with test database (transactional isolation)
- **Coverage Target**: >80% for business logic

**Frontend (Jest + React Testing Library):**

- **Component Tests**: Render behavior, user interactions, accessibility
- **Hook Tests**: Custom hooks with `renderHook` utility
- **Integration Tests**: Feature flows with mocked backend

**See testing guides:** [Frontend Testing](./guides/testing/frontend.md) | [Backend Testing](./guides/testing/backend.md)

## Key Architecture Patterns

**Backend:**

- **Clean Architecture**: Controllers → Services → Repositories (strict layer boundaries)
- **Repository Pattern**: Abstracts Prisma ORM, enables testing with mocks
- **Dependency Injection**: Services receive dependencies via constructor/factory
- **Fail-Open Caching**: Redis failures degrade gracefully to API calls

📖 **Deep Dive:** [Backend Architecture Patterns](./knowledge-base/backend/backend-architecture.md) - Layered architecture, CORS, middleware patterns

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

**Last Updated:** January 29, 2026

### Frontend: WordExamplesPanel Component (Story 16.2)

- **Location:** `apps/frontend/src/features/word/components/WordExamplesPanel.tsx`
- **Purpose:** Display 3–5 examples inline with on-demand TTS playback
- **Data Flow:**
  `     useExamples (custom hook)
       ↓ [in-memory 60s dedupe + sessionStorage cache]
       ↓ POST /api/examples (Story 16.1)
WordExamplesPanel (render list)
       ↓ [user clicks Play]
       ↓ GET /api/examples/audio (mocked, Story 16.3 integrates real)
audioService.playAudio()`
- **Performance:** Cached payloads <500ms (sessionStorage hit); skeleton UX reduces perceived latency
- **Accessibility:** ARIA labels, keyboard focus, `role=list/listitem`
- **Analytics:** Tracks `examples_shown`, `example_played` (stub service, ready for real backend)
