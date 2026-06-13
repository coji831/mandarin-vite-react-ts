# Project Overview

**Last Updated:** June 8, 2026
**Purpose:** High-level overview of the monorepo structure, tech stack, and development workflow
**Audience:** New developers joining the project

> **When to read this:** When you're new to the project and need to understand how the monorepo is organized and where to find things.

---

## Tech Stack

| Layer          | Technology                            | Purpose                                          |
| -------------- | ------------------------------------- | ------------------------------------------------ |
| **Frontend**   | React + TypeScript (Vite)             | UI components, state management, routing         |
| **Backend**    | Express.js + TypeScript               | REST API, authentication, business logic         |
| **Database**   | PostgreSQL + Prisma ORM               | Data persistence, migrations, type-safe queries  |
| **Cache**      | Redis (optional)                      | TTS caching, conversation caching, rate limiting |
| **Auth**       | JWT (access + refresh tokens)         | Cookie-based authentication                      |
| **Deployment** | Vercel (frontend) + Railway (backend) | Production hosting                               |

---

## Monorepo Layout

```
mandarin-vite-react-ts/
├── apps/
│   ├── frontend/          # React + Vite SPA (port 5173)
│   │   ├── src/
│   │   │   ├── features/  # Feature modules (mandarin, quiz, etc.)
│   │   │   ├── components/# Shared UI components
│   │   │   ├── hooks/     # Shared custom hooks
│   │   │   ├── services/  # API client and service layer
│   │   │   └── utils/     # Utility functions
│   │   └── public/data/   # CSV vocabulary files
│   └── backend/           # Express API server (port 3001)
│       ├── src/
        │   ├── app/       # Entry point, DI container, routes
        │   ├── modules/   # 8 business modules (auth, word, vocabulary, quiz, etc.)
        │   └── shared/    # Cross-cutting: infrastructure, middleware, config, utils
│       └── prisma/        # Schema, migrations, seeds
├── packages/
│   ├── shared-types/      # TypeScript types shared across apps
│   └── shared-constants/  # Constants shared across apps
├── docs/
│   ├── guides/            # Setup, conventions, testing, operations
│   ├── knowledge-base/    # Deep dives, patterns, architecture
│   └── templates/         # BR and implementation templates
└── public/data/           # CSV vocabulary data
```

---

## Key Commands

| Command         | Description                                         |
| --------------- | --------------------------------------------------- |
| `npm install`   | Install all workspace dependencies                  |
| `npm run dev`   | Start frontend (5173) + backend (3001) concurrently |
| `npm test`      | Run all tests (Jest + Vitest)                       |
| `npm run lint`  | Run ESLint across the monorepo                      |
| `npm run build` | Build all packages and apps                         |

---

## Where to Put Code

| What                     | Where                                                       |
| ------------------------ | ----------------------------------------------------------- |
| Frontend feature         | `apps/frontend/src/features/<feature>/`                     |
| Shared UI component      | `apps/frontend/src/components/`                             |
| Backend route/controller | `apps/backend/src/modules/<name>/api/`                      |
| Backend service          | `apps/backend/src/modules/<name>/services/` or `use-cases/` |
| Shared types             | `packages/shared-types/src/`                                |
| Documentation            | `docs/guides/` or `docs/knowledge-base/`                    |

---

## Reading Path

New developers should follow this path:

1. **[Quickstart](./quickstart.md)** — Get the frontend running in 5 minutes
2. **This document** — Understand the monorepo structure
3. **[Environment Setup](./environment-setup.md)** — Configure environment variables
4. **[Frontend Development](../setup/frontend-development.md)** — Frontend architecture and patterns
5. **[Backend Development](../setup/backend-development.md)** — Backend architecture and setup
6. **[Conventions](../conventions/frontend.md)** — Coding standards and naming rules

- **Git:** v2.30+ (check: `git --version`)

---

## 🚀 Frontend Setup (5 Minutes)

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/coji831/mandarin-vite-react-ts.git
cd mandarin-vite-react-ts

# Install dependencies (takes 1-2 minutes)
npm install
```

### 2. Start Development Server

```bash
# Start frontend
npm run dev
```

**✅ App is now running at:** `http://localhost:5173`

Open your browser and you should see the Mandarin learning app!

> **Note:** The frontend uses a Vite proxy to connect to the production backend by default. API features (vocabulary, flashcards, audio) work out of the box without backend setup.

---

## Basic Commands

```bash
# Development
npm run dev              # Start frontend (localhost:5173)

# Testing
npm test                 # Run all tests

# Production
npm run build           # Build for production
npm run preview         # Preview production build
```

---

## Next Steps

### Need Backend Development?

- **Run Local Backend:** See [Backend Development Guide](../setup/backend-development.md) for 10-minute backend setup

### Learn the Codebase

- **System Architecture:** [docs/architecture.md](../../architecture.md)
- **Frontend Architecture:** [apps/frontend/README.md](../../../apps/frontend/README.md)

### Explore Topics

- **Vite Configuration:** [Vite Setup Guide](../setup/vite.md)
- **Testing:** [Frontend Testing Guide](../testing/frontend.md) | [Backend Testing Guide](../testing/backend.md)
- **Frontend Conventions:** [Frontend Conventions](../conventions/frontend.md)
- **Git Workflow:** [Git Conventions](../conventions/git.md)

---

## Troubleshooting

### Port 5173 already in use

```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Module not found errors

```bash
npm install
```

### Changes not appearing

Press `Ctrl+Shift+R` (hard refresh) in browser

### More Issues?

See [Troubleshooting Guide](../operations/troubleshooting.md) for comprehensive solutions.

---

**You're all set! Start exploring the codebase.**
