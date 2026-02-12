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

- **Frontend:** **React** with **TypeScript**
- **Build Tool:** **Vite**
- **Routing:** **React Router** with nested routes
- **State Management:** Reducer-based architecture with Context API
  - Split contexts for performance optimization
  - Normalized state with granular selectors
  - Composed sub-reducers (lists, user, ui)
- **Testing:** **Jest** with React Testing Library
- **Styling:** CSS with modular organization
- **Service Layer:** Unified, type-safe service interfaces for audio, conversation, and data management
- **Backend:** Node.js/Express deployed to Railway with:
  - PostgreSQL database (Supabase)
  - JWT authentication with httpOnly cookies and refresh token rotation
  - Multi-user support with per-user progress tracking and database persistence
  - Redis caching layer (Upstash) for TTS and conversation responses
  - Google Cloud TTS and Gemini API integration
  - Clean architecture (Controllers/Services/Repositories)
  - RESTful API architecture
- **Infrastructure:**
  - Frontend: Vercel (React + Vite, deployed from main branch)
  - Backend: Railway (Express + PostgreSQL + Redis)
  - Caching: Upstash Redis (production) with graceful fallback
  - Database: Supabase (PostgreSQL with connection pooling)
  - Storage: Google Cloud Storage (TTS audio and conversation caching)
  - APIs: Google Cloud TTS, Gemini AI for conversation generation and AI-powered quiz feedback

## 🚀 Installation & Getting Started

This project uses **npm workspaces** for monorepo management. Follow these steps to get started:

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/coji831/mandarin-vite-react-ts.git
   ```
2. **Navigate to the project directory:**
   ```bash
   cd mandarin-vite-react-ts
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
   This installs dependencies for all workspaces (frontend, backend, and shared packages).

### Development

**Run both frontend and backend concurrently:**

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

**Or run them separately:**

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

### Build

```bash
# Build all workspaces
npm run build

# Build frontend only (for production)
npm run build:frontend
```

### Testing

```bash
npm run test
```

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
│   ├── frontend/                    # React + Vite frontend application
│   │   ├── src/
│   │   │   ├── features/            # Feature modules (mandarin learning)
│   │   │   ├── pages/               # Page components
│   │   │   ├── components/          # Reusable UI components
│   │   │   ├── router/              # React Router configuration
│   │   │   ├── services/            # API service layer
│   │   │   └── types/               # TypeScript type definitions
│   │   ├── public/data/             # Static vocabulary CSVs and examples
│   │   ├── vite.config.ts           # Vite configuration
│   │   └── package.json             # Frontend dependencies
│   └── backend/                     # Node.js + Express backend API
│       ├── src/
│       │   ├── api/                 # HTTP layer (controllers, routes, middleware)
│       │   ├── core/                # Business logic (services, repositories)
│       │   ├── config/              # Environment configuration
│       │   └── utils/               # Shared utilities
│       ├── prisma/                  # Database schema and migrations
│       ├── tests/                   # Integration and unit tests
│       ├── Procfile                 # Railway deployment config
│       └── package.json             # Backend dependencies
├── packages/
│   ├── shared-types/                # Shared TypeScript types
│   └── shared-constants/            # Shared constants (API routes, etc.)
├── docs/
│   ├── architecture.md              # System architecture overview
│   ├── guides/                      # Setup and development guides
│   ├── knowledge-base/              # Transferable technical concepts
│   ├── business-requirements/       # Epic and story specifications
│   └── issue-implementation/        # Technical implementation details
├── terraform/                       # Infrastructure as code (future)
├── .env.local                       # Environment variables (gitignored)
├── .env.example                     # Environment template (committed)
└── package.json                     # Root workspace configuration
```

### Workspaces

- **@mandarin/frontend** - React application with Vite (`apps/frontend/`)
- **@mandarin/backend** - Express API server deployed to Railway (`apps/backend/`)
- **@mandarin/shared-types** - Shared TypeScript type definitions (`packages/shared-types/`)
- **@mandarin/shared-constants** - Shared constants and configuration (`packages/shared-constants/`)

## 📚 Documentation

- [System Overview](docs/architecture.md)
- [Coding Standards](docs/conventions.md)
- [Design Decisions](docs/issues/)
- [Development & Documentation Workflow](docs/workflow.md)
- [Business Requirements (Epics, Stories, PRs)](docs/business-requirements/README.md)
- [Technical Implementation Details](docs/issue-implementation/README.md)
- Feature Design
  - [Mandarin](apps/frontend/src/features/mandarin/docs/design.md)

## 🔧 Environment Variables

This project uses a **single `.env.local` file at the project root** for both frontend and backend configuration.

**Setup:**

1. Copy the example file:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in required values (see `.env.example` for detailed instructions):
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` and `JWT_REFRESH_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `REDIS_URL` - Redis connection (optional for development, caching falls back gracefully)
   - `GOOGLE_TTS_CREDENTIALS_RAW` - Google Cloud service account JSON
   - `VITE_API_URL` - Backend API URL (http://localhost:3001 for development)

**First-time Database Setup:**

After configuring environment variables, initialize the database:

```bash
npx prisma migrate dev
```

For detailed configuration instructions, see [Environment Setup Guide](docs/guides/environment-setup-guide.md).

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Code Conventions:** Follow patterns in [Code Conventions Guide](docs/guides/code-conventions.md)
2. **Git Workflow:** Use Conventional Commits as described in [Git Convention Guide](docs/guides/git-convention.md)
3. **Documentation:** Update relevant docs when making changes
4. **Testing:** Add tests for new features and bug fixes

For detailed workflow, see [Workflow Guide](docs/guides/workflow.md).

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

For detailed deployment instructions, see [Backend Setup Guide](docs/guides/backend-setup-guide.md).

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
