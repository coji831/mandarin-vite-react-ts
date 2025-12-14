# Technical Knowledge Base - Index

**Last Updated:** December 9, 2025  
**Purpose:** Quick-reference guides for techniques, patterns, and integrations used in this project

> **Use this when:** You need to remember "how did we implement X?" or want to apply a pattern to a new feature.  
> **Not code documentation:** These guides focus on concepts and minimal examples, not production code walkthroughs.

---

## 📚 Categories

### Getting Started

- **[Quick Start](./quickstart.md)** — Get running in 5 minutes
- **[Vite Setup](./vite-setup.md)** — Vite + React + TypeScript configuration
- **[Testing Setup](./testing-setup.md)** — Jest + React Testing Library
- **[Linting Setup](./linting-setup.md)** — ESLint + Prettier code quality
- **[Git Workflow](./git-workflow.md)** — Conventional Commits, branching
- **[Troubleshooting](./troubleshooting.md)** — Common issues & solutions

### Frontend Development

- **[React Patterns](./frontend-react-patterns.md)** — Context API, Router, component patterns
- **[Advanced React Patterns](./frontend-advanced-patterns.md)** — useReducer, context splitting, selectors, reducer composition
- **[State Management](./frontend-state-management.md)** — Normalized state, localStorage, data loading
- **[UI & Component Patterns](./frontend-ui-patterns.md)** — Card-based UI, search/filter, responsive design
- **[Data Migration](./frontend-data-migration.md)** — localStorage migrations, user identification, data refactoring

### Backend Development

- **[Architecture Patterns](./backend-architecture.md)** — Clean Architecture, dependency injection
- **[Advanced Backend Patterns](./backend-advanced-patterns.md)** — Service layer interfaces, monorepo, error handling
- **[PostgreSQL Setup & Migrations](./backend-database-postgres.md)** — Production database setup with Prisma
- **[SQLite for Local Development](./backend-database-sqlite.md)** — Lightweight dev setup, generic onboarding
- **[Cloud Database Providers](./backend-database-cloud.md)** — Railway, Supabase, Render, managed databases
- **[Authentication](./backend-authentication.md)** — JWT, bcrypt, security best practices

### Third-Party Integrations

- **[Google Cloud Services](./integration-google-cloud.md)** — TTS, Storage, Gemini AI
- **[Caching Strategies](./integration-caching.md)** — Redis patterns, cache-aside

### Infrastructure & Deployment

- **[Deployment](./infra-deployment.md)** — Vercel setup, environment variables
- **[.NET Patterns](./dotnet-patterns.md)** — ASP.NET Core, EF Core (coming after Epic 14)

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
| User identification     | [Data Migration](./frontend-data-migration.md)     | User/Device ID         |
| Clean architecture      | [Architecture Patterns](./backend-architecture.md) | Clean Architecture     |
| Service layer           | [Advanced Backend](./backend-advanced-patterns.md) | Service Interfaces     |
| Monorepo setup          | [Advanced Backend](./backend-advanced-patterns.md) | npm Workspaces         |
| Error handling          | [Advanced Backend](./backend-advanced-patterns.md) | Error Middleware       |
| Database queries        | [PostgreSQL Setup](./backend-database-postgres.md) | Prisma Queries         |
| User authentication     | [Authentication](./backend-authentication.md)      | JWT + bcrypt           |
| Mandarin audio          | [Google Cloud](./integration-google-cloud.md)      | Text-to-Speech         |
| File storage            | [Google Cloud](./integration-google-cloud.md)      | Cloud Storage          |
| AI conversations        | [Google Cloud](./integration-google-cloud.md)      | Gemini AI              |
| API caching             | [Caching Strategies](./integration-caching.md)     | Redis Patterns         |
| Deployment              | [Deployment](./infra-deployment.md)                | Vercel                 |
| Secrets                 | [Deployment](./infra-deployment.md)                | Environment Variables  |

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
- **After Epic 14** — Will add .NET patterns guide

---

**Related:**

- [Strategic Roadmap](../business-requirements/ROADMAP-STRATEGIC.md) — Timeline and milestones
- [Architecture Overview](../architecture.md) — System design
- [Code Conventions](../guides/code-conventions.md) — Coding standards
