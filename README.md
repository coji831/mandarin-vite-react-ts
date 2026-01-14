# PinyinPal: A Modern Mandarin Learning App 🇨🇳

**Repository:** `mandarin-vite-react-ts`

PinyinPal is an interactive web application designed to help new learners master the fundamentals of Mandarin Chinese, with a specific focus on pinyin, tones, and character recognition. This project is built using modern web technologies to create a fast, responsive, and engaging learning experience.

## ✨ Key Features

- **Interactive Flashcards:** Practice vocabulary with pinyin, characters, and English definitions with audio playback.
- **Vocabulary Lists:** Browse HSK-level vocabulary organized by difficulty with card-based interface.
- **AI-Generated Conversations:** Context-aware conversation generation with word usage examples and audio playback.
- **Audio & TTS Integration:** Robust service layer with Google Cloud TTS backend and browser TTS fallback for reliability.
- **Multi-User Support:** Per-user progress tracking with automatic localStorage persistence and mastery indicators.
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
  - JWT authentication with httpOnly cookies
  - Multi-user support with per-user progress tracking
  - Google Cloud TTS and Gemini API integration
  - RESTful API architecture
- **Infrastructure:**
  - Frontend: Vercel (React + Vite)
  - Backend: Railway (Express + PostgreSQL)
  - Future: Planned migration to ASP.NET Core 8

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

- **Polyglot Expansion:** The core architecture is being built to easily support the addition of other languages, allowing PinyinPal to become a multi-language learning platform.
- **Micro-Frontend Conversion:** We plan to explore converting the application into a micro-frontend architecture. This would allow different features (e.g., flashcards, tone drills) to be developed and deployed independently, making the project more robust and maintainable for a larger community.

## 📁 Project Structure

This project uses a **monorepo structure** with npm workspaces:

```
mandarin-vite-react-ts/
├── apps/
│   ├── frontend/          # React + Vite frontend application
│   │   ├── src/           # Frontend source code
│   │   │   ├── features/mandarin/  # Main Mandarin learning feature
│   │   │   ├── pages/     # Page components
│   │   │   ├── router/    # Routing configuration
│   │   │   └── types/     # TypeScript types
│   │   ├── public/data/   # Static vocabulary and example data
│   │   └── package.json   # Frontend dependencies
│   └── backend/           # Node.js + Express backend API
│       ├── src/           # Backend source code
│       ├── api/           # Serverless functions for Vercel
│       └── package.json   # Backend dependencies
├── packages/
│   ├── shared-types/      # Shared TypeScript types
│   └── shared-constants/  # Shared constants (API endpoints, etc.)
├── docs/                  # Project documentation
└── package.json           # Root workspace configuration
```

### Workspaces

- **@mandarin/frontend** - React application with Vite (`apps/frontend/`)
- **@mandarin/backend** - Express API server (`apps/backend/`)
- **@mandarin/shared-types** - Shared TypeScript type definitions (`packages/shared-types/`)
- **@mandarin/shared-constants** - Shared constants and configuration (`packages/shared-constants/`)

### Legacy Directories

The following directories contain legacy code and will be removed after full migration:

- `api/` - Old serverless functions (consolidated into `apps/backend/api`)
- `local-backend/` - Old Express server (consolidated into `apps/backend`)
- `src/` - Old frontend code (moved to `apps/frontend/src`)

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

Create `.env` files in the appropriate workspace directories:

- `apps/backend/.env` - Backend environment variables (Google Cloud credentials, database URLs)
- `apps/frontend/.env` - Frontend environment variables (optional)

## 🤝 Contributing

We welcome contributions of all kinds! If you want to help, please check out our **`CONTRIBUTING.md`** file for details on our code of conduct and the process for submitting pull requests.

## 🚀 Deployment

Deploy your own Vite project with Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel/vercel/tree/main/examples/vite-react&template=vite-react)

_Live Example: https://vite-react-example.vercel.app_

### Deploying From Your Terminal

You can deploy your new Vite project with a single command from your terminal using [Vercel CLI](https://vercel.com/download):

```shell
$ vercel
```

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
