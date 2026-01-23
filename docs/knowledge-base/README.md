# Technical Knowledge Base

**Last Updated:** January 9, 2026  
**Purpose:** Transferable concepts, patterns, and techniques applicable beyond this project

> **Use this when:** You want to understand WHY patterns exist, learn transferable skills, or apply concepts to other projects.  
> **For project-specific setup:** See [`docs/guides/`](../guides/) for step-by-step instructions for THIS codebase.

---

## 🎯 Guides vs. Knowledge Base

| Question                               | → Guides | → Knowledge Base |
| -------------------------------------- | -------- | ---------------- |
| How do I setup THIS project?           | ✅       | ❌               |
| How do I implement X in THIS codebase? | ✅       | ❌               |
| What are best practices for Y?         | ❌       | ✅               |
| How does Z pattern work in general?    | ❌       | ✅               |
| Contains THIS project's file paths?    | ✅       | ❌               |
| Contains reusable code patterns?       | ❌       | ✅               |

---

## 📚 Categories

### Frontend Patterns

- **[React Patterns](./frontend-react-patterns.md)** — Context API, Router, React Strict Mode patterns
- **[Advanced React Patterns](./frontend-advanced-patterns.md)** — useReducer, context splitting, selectors, reducer composition
- **[State Management](./frontend-state-management.md)** — Normalized state, localStorage strategies, data loading patterns
- **[UI & Component Patterns](./frontend-ui-patterns.md)** — Card-based UI, search/filter, responsive design
- **[Data Migration](./frontend-data-migration.md)** — localStorage migrations, user identification strategies
- **[Development Server Concepts](./frontend-development-server.md)** — Dev proxy architecture, cookie forwarding, HMR

### Backend Patterns

- **[Architecture Patterns](./backend-architecture.md)** — Clean Architecture, CORS deep dive, layered architecture
- **[Advanced Backend Patterns](./backend-advanced-patterns.md)** — Service layer interfaces, CQRS, event sourcing
- **[Authentication Concepts](./backend-authentication.md)** — JWT, OAuth, session strategies, security best practices
- **[PostgreSQL Concepts](./backend-database-postgres.md)** — Advanced PostgreSQL features, indexing strategies
- **[SQLite Concepts](./backend-database-sqlite.md)** — Lightweight database use cases, embedded DB patterns
- **[Cloud Database Patterns](./backend-database-cloud.md)** — Connection pooling, PgBouncer, cloud providers

### Integration Patterns

- **[Google Cloud Services](./integration-google-cloud.md)** — TTS, Storage, Gemini AI integration patterns
- **[Caching Strategies](./integration-caching.md)** — Redis patterns, cache-aside, fail-open strategies, base64 binary storage, SHA256 cache keys

### Infrastructure Concepts

- **[Deployment Strategies](./infra-deployment.md)** — Serverless vs. containers, CI/CD patterns
- **[Configuration Management](./infra-configuration-management.md)** — Environment variables, validation, security
- **[Git Workflow Strategies](./git-workflow.md)** — Conventional Commits, branching models, trunk-based development
- **[Git Workflow Strategies](./git-workflow.md)** — Conventional Commits, branching models, trunk-based development

### General Principles

- **[SOLID Principles](./solid-principles.md)** — Software design principles for maintainable code
- **[Documentation Patterns](./documentation-patterns.md)** — Technical writing, architecture docs, decision records
- **[Planning & Estimation Strategies](./planning-estimation-strategies.md)** — Complexity multipliers, estimation frameworks, work breakdown
- **[Testing ES Modules with Jest](./testing-es-modules-jest.md)** — Manual mocks, stateful factories, ioredis-mock patterns
- **[.NET Patterns](./dotnet-patterns.md)** — ASP.NET Core, EF Core (coming after Epic 14)

---

## 💡 How to Use This Knowledge Base

1. **Learning**: Read concepts to understand WHY patterns exist
2. **Reference**: Look up patterns when designing new features
3. **Teaching**: Share with team members for skill development
4. **Transfer**: Apply patterns to other projects beyond this codebase

---

**For project-specific instructions**, see:

- [Guides Index](../guides/README.md) - Step-by-step setup for THIS project
- [Architecture](../architecture.md) - THIS project's architecture overview
- [Business Requirements](../business-requirements/) - Feature specifications
- [Implementation Docs](../issue-implementation/) - Technical implementation details

---

## 🔍 Quick Lookup Table

| Need                    | Guide                                              | Section                |
| ----------------------- | -------------------------------------------------- | ---------------------- |
| Get running fast        | [Quick Start](./quickstart.md)                     | 5-Minute Setup         |
| Vite config             | [Vite Setup](./vite-setup.md)                      | Configuration          |
| Testing setup           | [Testing Setup](./testing-setup.md)                | Jest + RTL             |
| Linting setup           | [Linting Setup](./linting-setup.md)                | ESLint + Prettier      |
| Git workflow            | [Git Workflow](./git-workflow.md)                  | Conventional Commits   |
| Common errors           | [Troubleshooting](./troubleshooting.md)            | Error Solutions        |
| Cookie/CORS issues      | [Troubleshooting](./troubleshooting.md)            | Cookie & CORS Auth     |
| Global state            | [React Patterns](./frontend-react-patterns.md)     | Context API            |
| useReducer              | [Advanced React](./frontend-advanced-patterns.md)  | useReducer Pattern     |
| Context splitting       | [Advanced React](./frontend-advanced-patterns.md)  | Context Splitting      |
| Selectors & memoization | [Advanced React](./frontend-advanced-patterns.md)  | Selector Pattern       |
| Reducer composition     | [Advanced React](./frontend-advanced-patterns.md)  | Reducer Composition    |
| Type-safe routing       | [React Patterns](./frontend-react-patterns.md)     | React Router           |
| Normalized data         | [State Management](./frontend-state-management.md) | Normalized State       |
| CSV loading             | [State Management](./frontend-state-management.md) | Data Loading           |
| Card-based UI           | [UI Patterns](./frontend-ui-patterns.md)           | Card UI & CSS Grid     |
| Search & filter         | [UI Patterns](./frontend-ui-patterns.md)           | Client-Side Search     |
| Responsive design       | [UI Patterns](./frontend-ui-patterns.md)           | Responsive Design      |
| Data migrations         | [Data Migration](./frontend-data-migration.md)     | localStorage Migration |
| Auth restoration        | [Data Migration](./frontend-data-migration.md)     | /me Endpoint Pattern   |
| User identification     | [Data Migration](./frontend-data-migration.md)     | User/Device ID         |
| Clean architecture      | [Architecture Patterns](./backend-architecture.md) | Clean Architecture     |
| Service layer           | [Advanced Backend](./backend-advanced-patterns.md) | Service Interfaces     |
| Monorepo setup          | [Advanced Backend](./backend-advanced-patterns.md) | npm Workspaces         |
| Error handling          | [Advanced Backend](./backend-advanced-patterns.md) | Error Middleware       |
| Database queries        | [PostgreSQL Setup](./backend-database-postgres.md) | Prisma Queries         |
| Connection pooling      | [PostgreSQL Setup](./backend-database-postgres.md) | Connection Stability   |
| Supabase setup          | [Supabase Setup](./supabase-setup-guide.md)        | Cloud Database         |
| User authentication     | [Authentication](./backend-authentication.md)      | JWT + bcrypt           |
| httpOnly cookies        | [Authentication](./backend-authentication.md)      | XSS Protection         |
| Mandarin audio          | [Google Cloud](./integration-google-cloud.md)      | Text-to-Speech         |
| File storage            | [Google Cloud](./integration-google-cloud.md)      | Cloud Storage          |
| AI conversations        | [Google Cloud](./integration-google-cloud.md)      | Gemini AI              |
| API caching             | [Caching Strategies](./integration-caching.md)     | Redis Patterns         |
| Cache fail-open         | [Caching Strategies](./integration-caching.md)     | Fail-Open vs Closed    |
| Binary data in Redis    | [Caching Strategies](./integration-caching.md)     | Base64 Storage         |
| Cache key hashing       | [Caching Strategies](./integration-caching.md)     | SHA256 Keys            |
| Jest with ES modules    | [Testing ES Modules](./testing-es-modules-jest.md) | Manual Mocks           |
| ioredis-mock tests      | [Testing ES Modules](./testing-es-modules-jest.md) | Integration Tests      |
| Deployment              | [Deployment](./infra-deployment.md)                | Vercel                 |
| Production cookies      | [Deployment](./infra-deployment.md)                | Cookie Configuration   |
| Secrets                 | [Deployment](./infra-deployment.md)                | Environment Variables  |
| Vite proxy cookies      | [Vite Setup](./vite-setup.md)                      | Cookie Forwarding      |

---

## 📖 How to Use

### For Quick Reference

1. Use **Quick Lookup Table** above to find the right guide
2. Jump to specific section
3. Copy minimal example

### For Learning

1. Read guides in order (frontend → backend → integrations → infra)
2. Each guide is 5-10 minutes read
3. Try examples in isolation before applying to project

### For New Projects

1. Pick relevant patterns from guides
2. Copy minimal examples as starting point
3. Adapt to new context

---

## 🎯 Guide Format

Each guide follows this structure:

- **When Adopted** — Which epic introduced it
- **Why** — Business/technical rationale
- **Use Case** — What problem it solves
- **Minimal Example** — Copy-paste ready code
- **Key Lessons** — What we learned
- **When to Use** — Decision criteria

---

## 🔄 Updates

- **Dec 9, 2025** — Split monolithic technical documentation into focused guides
- **Dec 14, 2025** — Renamed from cookbook to knowledge-base
- **Jan 16, 2026** — Added ES Modules + Jest testing patterns, enhanced caching strategies (fail-open, base64, SHA256)
- **After Epic 14** — Will add .NET patterns guide

---

**Related:**

- [Strategic Roadmap](../business-requirements/ROADMAP-STRATEGIC.md) — Timeline and milestones
- [Architecture Overview](../architecture.md) — System design
- [Code Conventions](../guides/code-conventions.md) — Coding standards
