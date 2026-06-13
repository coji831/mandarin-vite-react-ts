# PinyinPal: A Modern Mandarin Learning App 🇨🇳

**Repository:** `mandarin-vite-react-ts`

PinyinPal is an interactive web application designed to help new learners master the fundamentals of Mandarin Chinese, with a specific focus on pinyin, tones, and character recognition. This project is built using modern web technologies to create a fast, responsive, and engaging learning experience.

## ✨ Key Features

- **Interactive Flashcards:** Practice vocabulary with pinyin, characters, and English definitions with audio playback.
- **Vocabulary Lists:** Browse HSK-level vocabulary organized by difficulty with card-based interface.
- **Quiz System:** Daily review quizzes with spaced repetition algorithm for optimal retention.
- **Progress Tracking:** Unified spaced repetition supporting both flashcard confidence ratings and quiz results.
- **Gamification:** Study streaks with 48-hour grace period, milestone badges (7/30/100/365 days), XP rewards, and mystery boxes.
- **Leech Detection:** Automatic identification of struggling vocabulary (5+ consecutive failures) for targeted practice.
- **AI-Generated Conversations:** Context-aware conversation generation with word usage examples and audio playback.
- **Audio & TTS Integration:** Robust service layer with Google Cloud TTS backend and browser TTS fallback for reliability.
- **Multi-User Support:** Per-user progress tracking with database persistence and cross-device synchronization via backend API.
- **Performance-Optimized State:** Split contexts with normalized state and granular selectors for scalability.

## 🛠️ Tech Stack

| Layer          | Technology                            |
| -------------- | ------------------------------------- |
| **Frontend**   | React + TypeScript (Vite)             |
| **Backend**    | Node.js + Express                     |
| **Database**   | PostgreSQL (Supabase) + Prisma        |
| **Cache**      | Redis (Upstash)                       |
| **Auth**       | JWT with httpOnly cookies             |
| **APIs**       | Google Cloud TTS, Gemini AI           |
| **Deployment** | Vercel (frontend) + Railway (backend) |

> **Detailed breakdown:** See [Project Overview](docs/guides/getting-started/project-overview.md#tech-stack)

## 🚀 Quick Start

```bash
git clone https://github.com/coji831/mandarin-vite-react-ts.git
cd mandarin-vite-react-ts
npm install
npm run dev    # Frontend: http://localhost:5173  Backend: http://localhost:3001
```

> **Full setup guide:** See [Project Overview → Quick Start](docs/guides/getting-started/project-overview.md) for environment configuration, database setup, and troubleshooting.

### Useful Commands

| Command                | Description              |
| ---------------------- | ------------------------ |
| `npm run dev`          | Start frontend + backend |
| `npm run dev:frontend` | Frontend only            |
| `npm run dev:backend`  | Backend only             |
| `npm run build`        | Build all workspaces     |
| `npm test`             | Run tests                |

## 🗺️ Future Vision & Roadmap

This project is more than just a Mandarin learning tool; it's designed with scalability and future growth in mind.

**Completed Milestones:**

- ✅ **Multi-User Architecture:** Production-ready backend with authentication, database persistence, and Redis caching
- ✅ **Cross-Device Sync:** Users can access their progress from any device via JWT authentication

**Next Steps:**

- **Polyglot Expansion:** The core architecture is being built to easily support the addition of other languages, allowing PinyinPal to become a multi-language learning platform.
- **Micro-Frontend Conversion:** We plan to explore converting the application into a micro-frontend architecture. This would allow different features (e.g., flashcards, tone drills) to be developed and deployed independently, making the project more robust and maintainable for a larger community.
- **.NET Backend Migration:** Planned migration to ASP.NET Core 8 for improved performance on CPU-intensive operations (Epic xx).

## 📁 Project Structure

This project uses a **monorepo structure** with npm workspaces:

```
mandarin-vite-react-ts/
├── apps/
│   ├── frontend/          # React + Vite (port 5173)
│   └── backend/           # Express API (port 3001)
├── packages/
│   ├── shared-types/      # Shared TypeScript types
│   └── shared-constants/  # Shared constants
├── docs/                  # Architecture, guides, KB, BRs
└── terraform/             # Infrastructure as Code
```

### Workspaces

| Package                      | Location                     | Purpose                     |
| ---------------------------- | ---------------------------- | --------------------------- |
| `@mandarin/frontend`         | `apps/frontend/`             | React + Vite SPA            |
| `@mandarin/backend`          | `apps/backend/`              | Express API server          |
| `@mandarin/shared-types`     | `packages/shared-types/`     | TypeScript type definitions |
| `@mandarin/shared-constants` | `packages/shared-constants/` | Shared constants            |

> **Detailed structure:** See [Project Overview → Monorepo Layout](docs/guides/getting-started/project-overview.md#monorepo-layout) for full directory tree.

## 📚 Documentation

- [System Overview](docs/architecture.md)
- [Code Conventions](docs/guides/references/code-conventions.md)
- [Backend Conventions](docs/guides/conventions/backend.md)
- [Frontend Conventions](docs/guides/conventions/frontend.md)
- [Development & Documentation Workflow](docs/guides/operations/workflow.md)
- [Business Requirements (Epics, Stories, PRs)](docs/business-requirements/README.md)
- [Technical Implementation Details](docs/issue-implementation/README.md)
- Feature Design
  - [Mandarin](apps/frontend/src/features/mandarin/docs/design.md)

## 🔧 Environment Variables

This project uses a **single `.env.local` file at the project root** for both frontend and backend configuration.

```bash
cp .env.example .env.local
```

> **Full variable reference:** See [Environment Setup Guide](docs/guides/getting-started/environment-setup.md) for all required and optional variables, including database, auth, Redis, and Google Cloud configuration.

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Code Conventions:** Follow patterns in [Code Conventions Guide](docs/guides/conventions/backend.md)
2. **Git Workflow:** Use Conventional Commits as described in [Git Convention Guide](docs/guides/conventions/git.md)
3. **Documentation:** Update relevant docs when making changes
4. **Testing:** Add tests for new features and bug fixes

For detailed workflow, see [Workflow Guide](docs/guides/operations/workflow.md).

## 🚀 Deployment

**Production Deployment:**

- **Frontend:** Deployed to Vercel (automatic deployment from main branch)
- **Backend:** Deployed to Railway with PostgreSQL and Redis
- **Live App:** [https://mandarin-vite-react-ts.vercel.app/](https://mandarin-vite-react-ts.vercel.app/)

**Deploy Your Own:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/coji831/mandarin-vite-react-ts)

**Manual Deployment:**

```bash
# Frontend (Vercel CLI)
npm install -g vercel
vercel

# Backend (Railway CLI)
npm install -g @railway/cli
railway up
```

For detailed deployment instructions, see [Backend Development Guide](docs/guides/setup/backend-development.md).

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
