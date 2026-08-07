# Project Documentation

## Quick Links

| Resource                                                   | Description                                                |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| [System Architecture](architecture.md)                     | High-level architecture overview, data flow, caching, auth |
| [Guides Index](guides/getting-started/README.md)           | All development guides by category                         |
| [Knowledge Base](knowledge-base/README.md)                 | Technical concepts and patterns                            |
| [Templates](templates/README.md)                           | Documentation templates (BR, implementation)               |
| [Copilot Instructions](../.github/copilot-instructions.md) | AI agent operational playbook                              |

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

### 🗄️ Data & Content

| Guide                                         | Description                                                   |
| --------------------------------------------- | ------------------------------------------------------------- |
| [Seed Pipeline](guides/data/seed-pipeline.md) | 29-step hash-gated delta seed pipeline, runbook, verification |

### 📐 Conventions

| Guide                                                      | Description                         |
| ---------------------------------------------------------- | ----------------------------------- |
| [Frontend](guides/conventions/frontend.md)                 | Component patterns, naming, exports |
| [Backend](guides/conventions/backend.md)                   | Modulith Architecture, DI patterns  |
| [API Client](guides/conventions/api-client.md)             | Service layer and error handling    |
| [State Management](guides/conventions/state-management.md) | Context + reducer patterns          |
| [Git](guides/conventions/git.md)                           | Branch strategy, commit conventions |
| [Security](guides/conventions/security.md)                 | Auth, validation, rate limiting     |

### 🧪 Testing

| Guide                                          | Description                             |
| ---------------------------------------------- | --------------------------------------- |
| [Frontend Testing](guides/testing/frontend.md) | Vitest + React Testing Library patterns |
| [Backend Testing](guides/testing/backend.md)   | Vitest, integration tests               |

### 🔗 Integrations

| Guide                                                                        | Description                                                           |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [Frontend-Backend Integration](guides/integrations/frontend-backend.md)      | Proxy, CORS, shared constants                                         |
| [Gemini API](guides/integrations/gemini-api.md)                              | AI conversation generation                                            |
| [Storybook–Production Alignment](guides/integrations/storybook-alignment.md) | Maintaining zero drift between Storybook stories and production pages |

### 🎨 Design

| Guide                                                             | Description                                               |
| ----------------------------------------------------------------- | --------------------------------------------------------- |
| [Visual Design Workflow](guides/design/visual-design-workflow.md) | Storybook-first design workflow and token management      |
| [Design Reasoning](guides/design/design-reasoning.md)             | Design philosophy ("Warm Minimalism") and UX fundamentals |

### ⚡ Operations

| Guide                                                     | Description                    |
| --------------------------------------------------------- | ------------------------------ |
| [Workflow](guides/operations/workflow.md)                 | Development workflow checklist |
| [Infrastructure](guides/operations/infrastructure.md)     | Terraform, deployment, CI/CD   |
| [Caching Patterns](guides/operations/caching-patterns.md) | Redis caching setup and tuning |
| [Deployment](guides/operations/deployment.md)             | Vercel + Railway deployment    |
| [Troubleshooting](guides/operations/troubleshooting.md)   | Common issues and solutions    |
| [Review Checklist](guides/references/review-checklist.md) | Code review checklist          |

### 📚 References

| Guide                                                       | Description                               |
| ----------------------------------------------------------- | ----------------------------------------- |
| [Code Conventions](guides/references/code-conventions.md)   | Legacy code conventions (pre-restructure) |
| [Testing Guide](guides/references/testing-guide.md)         | Legacy testing guide                      |
| [Tooling Standards](guides/setup/tooling-standards.md)      | Tooling configuration reference           |
| [Supabase Setup](guides/references/supabase-setup-guide.md) | Legacy Supabase guide                     |

## Knowledge Base

### Architecture

| Article                                                                              | Description                                         |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| [Backend Architecture](knowledge-base/backend/backend-architecture.md)               | Layered architecture, CORS, middleware patterns     |
| [Backend Shared Kernel Layer](knowledge-base/backend/backend-shared-kernel-layer.md) | Shared code contracts and kernel-layer design       |
| [Frontend Modular Monolith](knowledge-base/frontend/frontend-modular-monolith.md)    | Feature-based monorepo modular architecture         |
| [SOLID Principles](knowledge-base/practices/solid-principles.md)                     | Applying SOLID to React/TypeScript                  |
| [API Response Patterns](knowledge-base/backend/api-response-patterns.md)             | Standardized API response format and error handling |

### Frontend

| Article                                                                                            | Description                                                                  |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [Frontend React Patterns](knowledge-base/frontend/frontend-react-patterns.md)                      | React/TypeScript component and hook patterns                                 |
| [Frontend State Management](knowledge-base/frontend/frontend-state-management.md)                  | Context API, reducers, normalized state                                      |
| [Frontend UI Patterns](knowledge-base/frontend/frontend-ui-patterns.md)                            | Reusable UI component patterns and conventions                               |
| [Frontend Development Server](knowledge-base/frontend/frontend-development-server.md)              | Dev proxy mechanics, cookie forwarding, CORS                                 |
| [Frontend Data Migration](knowledge-base/frontend/frontend-data-migration.md)                      | Data migration strategies and patterns                                       |
| [Strategy Pattern on the Frontend](knowledge-base/frontend/strategy-pattern-frontend.md)           | Using the Strategy pattern for per-type evaluation logic in React/TypeScript |
| [Discriminated Union State Machines](knowledge-base/frontend/discriminated-union-state-machine.md) | Type-safe UI state machines with `useReducer`                                |
| [Storybook MSW Handlers](knowledge-base/frontend/storybook-msw-handlers.md)                        | DRY MSW handler factories for every story state                              |
| [URL Search-Param Persistence Rule](knowledge-base/frontend/frontend-url-search-params.md)         | Route-scoped URL sub-state, replace/push, shareable deep links               |
| [Hub Entity-ID Contract](knowledge-base/frontend/hub-entity-id-contract.md)                        | content_id vs glyph-keyed hub/API entity identifiers                         |

### Backend

| Article                                                                            | Description                                                       |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [Backend Authentication](knowledge-base/backend/backend-authentication.md)         | JWT auth, refresh tokens, cookie-based sessions                   |
| [Backend Database PostgreSQL](knowledge-base/backend/backend-database-postgres.md) | PostgreSQL setup, connection pooling, migrations                  |
| [Module-Level Containers](knowledge-base/backend/module-level-containers.md)       | Per-module DI containers instead of a monolithic composition root |

### Testing

| Article                                                                                  | Description                                              |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [Testing ES Modules (Vitest)](knowledge-base/testing/testing-es-modules-vitest.md)       | Vitest ESM setup (covers Epics 13/14 migration)          |
| [Vitest Monorepo Conflicts](knowledge-base/testing/vitest-monorepo-version-conflicts.md) | Resolving Vitest version conflicts in monorepos          |
| [Storybook Tests via Vitest](knowledge-base/testing/storybook-addon-vitest.md)           | Running Storybook stories with `@storybook/addon-vitest` |

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

| Article                                                                                         | Description                                               |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [Documentation Patterns](knowledge-base/practices/documentation-patterns.md)                    | How business and technical docs work together             |
| [Planning & Estimation](knowledge-base/practices/planning-estimation-strategies.md)             | Effort estimation and planning strategies                 |
| [TypeScript Error Handling](knowledge-base/backend/typescript-error-handling.md)                | Error handling patterns in TypeScript                     |
| [Git Workflow](knowledge-base/practices/git-workflow.md)                                        | Git branching strategies and workflows                    |
| [Async Progressive Enrichment](knowledge-base/practices/async-progressive-enrichment.md)        | Lazy per-item enrichment so base data never blocks render |
| [Shared Data Model](knowledge-base/data/shared-data-model.md)                                   | Content, progress, and junction entities across epics     |
| [Infrastructure Deployment](knowledge-base/infrastructure/infra-deployment.md)                  | Deployment infrastructure and CI/CD patterns              |
| [Infrastructure Configuration](knowledge-base/infrastructure/infra-configuration-management.md) | Infrastructure-as-code configuration management           |

## Project Management

| Area                                            | Description                      |
| ----------------------------------------------- | -------------------------------- |
| [Business Requirements](business-requirements/) | Epic and story BR documents      |
| [Issue Implementation](issue-implementation/)   | Technical implementation details |

## Feature Documentation

Feature-specific docs live in feature folders under `apps/frontend/src/features/` and `apps/backend/src/modules/`:

- **Auth**: [`apps/frontend/src/features/auth/`](../apps/frontend/src/features/auth/)
- **CharacterHub**: [`apps/frontend/src/features/character-hub/`](../apps/frontend/src/features/character-hub/)
- **Dashboard**: [`apps/frontend/src/features/dashboard/`](../apps/frontend/src/features/dashboard/)
- **Foundations**: [`apps/frontend/src/features/foundations/`](../apps/frontend/src/features/foundations/)
- **LexicalHub**: [`apps/frontend/src/features/lexical-hub/`](../apps/frontend/src/features/lexical-hub/)
- **PhoneticClusters**: [`apps/frontend/src/features/phonetic-clusters/`](../apps/frontend/src/features/phonetic-clusters/)
- **Quiz**: [`apps/frontend/src/features/quiz/`](../apps/frontend/src/features/quiz/)
- **Radicals**: [`apps/frontend/src/features/radicals/`](../apps/frontend/src/features/radicals/)
- **Readers**: [`apps/frontend/src/features/readers/`](../apps/frontend/src/features/readers/)
- **Review**: [`apps/frontend/src/features/review/`](../apps/frontend/src/features/review/)
- **WordHub**: [`apps/frontend/src/features/word-hub/`](../apps/frontend/src/features/word-hub/)
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

**Gamification**: Study streak data model + Progress page placeholder UI; no gamification API yet. See [Gamification Psychology](knowledge-base/learning-theory/gamification-psychology-learning.md).

**AI Feedback**: AI-powered error explanations via Gemini API with Redis caching and timeout protection. See [Google Cloud Integration](knowledge-base/infrastructure/integration-google-cloud.md).

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
- Backend runs Prisma migrations on release (`railway.toml`)
- Frontend builds via Vercel with automatic preview URLs

**See deployment guides:**

- Backend: [Backend Development Guide](./guides/setup/backend-development.md#deployment)
- Environment variables: [Environment Setup Guide](./guides/getting-started/environment-setup.md)

## Testing Strategy

**Backend (Vitest):**

- **Unit Tests**: Services, repositories, utilities (mocked dependencies)
- **Integration Tests**: Full API flows with test database (transactional isolation)
- **Coverage**: No hard coverage gate; follows the Testing Trophy (unit → integration → E2E)

**Frontend (Vitest + React Testing Library):**

- **Component Tests**: Render behavior, user interactions, accessibility
- **Hook Tests**: Custom hooks with `renderHook` utility
- **Integration Tests**: Feature flows with mocked backend

**See testing guides:** [Frontend Testing](./guides/testing/frontend.md) | [Backend Testing](./guides/testing/backend.md)

## Key Architecture Patterns

**Backend:**

- **Modulith Architecture**: Self-contained modules, each choosing its own internal pattern
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
