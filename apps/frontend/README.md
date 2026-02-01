# Frontend Application

React + TypeScript + Vite application for PinyinPal Mandarin learning platform.

## Architecture

**Feature-Based Organization**: Self-contained feature modules with collocated components, hooks, reducers, and services.

```
apps/frontend/src/
├── features/                    # Feature modules
│   └── mandarin/               # Mandarin learning feature
│       ├── components/         # Feature-specific components
│       ├── contexts/           # State management (Context + useReducer)
│       ├── hooks/              # Custom hooks (actions, selectors)
│       ├── reducers/           # State reducers (lists, progress, user, ui)
│       ├── services/           # API clients (audio, conversation, progress)
│       ├── types/              # TypeScript type definitions
│       ├── utils/              # Feature utilities
│       ├── router/             # Feature routing
│       ├── pages/              # Feature pages
│       └── docs/               # Feature design documentation
├── components/                  # Shared UI components
│   ├── common/                 # Reusable primitives
│   └── docs/                   # Component API documentation
├── pages/                       # Top-level page components
├── router/                      # React Router configuration
├── services/                    # Global services
├── types/                       # Shared TypeScript types
├── utils/                       # Shared utilities
└── App.tsx                      # Application root
```

**Design Principles:**

- **Split Contexts**: Separate contexts for lists, progress, user, and UI to minimize re-renders
- **Normalized State**: `Record<id, item>` pattern for O(1) lookups
- **Granular Selectors**: Never select entire root state; always use specific selectors
- **Collocated Features**: Keep feature code together (components, hooks, reducers, services)
- **Service Abstraction**: All API calls go through service layer for testability

## Purpose

- **Development**: Fast refresh with Vite HMR for instant feedback
- **Production**: Optimized bundle deployed to Vercel with code splitting
- **Learning Platform**: Interactive UI for vocabulary, flashcards, and conversations
- **State Management**: Performance-optimized with split contexts and normalized state

## Features

- ✅ **Feature-Based Architecture**: Self-contained mandarin learning module
- ✅ **Split Context State**: Separate contexts for lists, progress, user, UI
- ✅ **Normalized State**: Record-based data structures for performance
- ✅ **React Router v6**: Nested routes with type-safe navigation
- ✅ **Service Layer**: Abstracted API clients for audio, conversation, progress
- ✅ **Authentication**: JWT-based auth with automatic token refresh
- ✅ **Responsive Design**: Mobile-first CSS with modular organization
- ✅ **Testing**: Jest + React Testing Library for components and hooks

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev  # Runs on http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Set in `.env.local` at project root:

```env
# Backend API URL
VITE_API_URL=http://localhost:3001  # Development
# VITE_API_URL=https://your-backend.railway.app  # Production (set in Vercel)
```

**Key Points:**

- **`VITE_API_URL`**: Backend API base URL. Uses Vite dev proxy in development (`/api` → `http://localhost:3001`).
- **Prefix**: All frontend environment variables must start with `VITE_` to be exposed to the client.
- **Security**: Never put secrets in frontend environment variables (they're bundled into client code).

## State Management

### Split Context Architecture

The app uses **separate contexts** to prevent unnecessary re-renders:

- **`VocabListsContext`**: Vocabulary lists and words (normalized `listsById`, `wordsById`)
- **`ProgressContext`**: User progress tracking (progress by word ID)
- **`UserContext`**: Authentication state (user info, tokens, login status)
- **`UIContext`**: UI state (selected list, search query, loading states)

### State Access Pattern

```typescript
// ✅ CORRECT: Use granular selectors
const lists = useVocabListsState((s) => s.listsById);
const list = useVocabListsState((s) => s.listsById[listId]);

// ❌ INCORRECT: Never select entire root state
const state = useVocabListsState((s) => s); // Causes re-renders on any change
```

### Action Creators

```typescript
// Use action hooks for state updates
const { addList, updateList } = useVocabListsActions();
const { markAsLearned } = useProgressActions();

// Actions return void and update context state
addList({ id: "hsk1", name: "HSK Level 1" });
```

**Full Documentation**: See [src/features/mandarin/docs/design.md](src/features/mandarin/docs/design.md) for complete state architecture.

## Routing

### Route Structure

```
/ (App Layout)
├── / (Home)
├── /mandarin
│   ├── /lists (Vocabulary Lists)
│   ├── /lists/:listId (List Detail)
│   ├── /flashcards/:listId (Flashcard Practice)
│   └── /conversation/:wordId (AI Conversation)
├── /login
└── /register
```

**Path Constants**: All routes defined in `src/constants/paths.ts` for type safety.

**Navigation**: Use `useNavigate()` hook with path constants:

```typescript
import { PATHS } from "@/constants/paths";
navigate(PATHS.MANDARIN.LISTS);
navigate(PATHS.MANDARIN.FLASHCARDS(":listId"));
```

## Services

### API Service Layer

All backend communication goes through service modules:

- **`audioService.ts`**: TTS audio fetching with caching
- **`conversationService.ts`**: AI conversation generation and audio
- **`progressService.ts`**: User progress sync with backend (JWT auth required)

### Service Usage

```typescript
import { audioService } from "@/features/mandarin/services/audioService";
import { conversationService } from "@/features/mandarin/services/conversationService";

// Fetch TTS audio
const audioUrl = await audioService.getAudioUrl("你好", "zh-CN-Standard-A");

// Generate conversation
const conversation = await conversationService.generateConversation("你好", "word-123");
```

**Authentication**: Services use `authFetch` wrapper for automatic token refresh on 401 responses.

## Development Workflow

### Adding a New Feature

1. Create feature folder under `src/features/`
2. Add components, hooks, reducers, services
3. Create context provider and action hooks
4. Add routes to `src/router/`
5. Write tests for reducers, hooks, components
6. Document in feature `docs/design.md`

### State Management Checklist

- [ ] Define reducer in `reducers/`
- [ ] Export actions from `hooks/useActions.ts`
- [ ] Export selectors from `hooks/useState.ts`
- [ ] Add reducer to context provider
- [ ] Write reducer tests
- [ ] Write hook tests (memoization)
- [ ] Update feature design doc

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Location**: Tests colocated with source files (`*.test.ts`, `*.test.tsx`)

**Testing Philosophy**:

- **Reducers**: Pure function tests, no mocks needed
- **Hooks**: Test with `renderHook`, verify memoization
- **Components**: Test with RTL, mock contexts as needed
- **Integration**: Test user flows with full context stack

## Build & Deployment

### Production Build

```bash
npm run build
```

**Output**: `dist/` directory with optimized assets

**Build Features**:

- Code splitting by route
- Tree shaking for unused code
- Asset optimization (images, fonts)
- Source maps for debugging

### Deployment (Vercel)

**Automatic Deployment**:

- Push to `main` branch → Vercel builds and deploys
- Pull requests → Preview deployments

**Environment Variables** (set in Vercel dashboard):

```env
VITE_API_URL=https://your-backend.railway.app
```

**Build Settings**:

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Configuration Files

- **`vite.config.ts`**: Vite configuration with dev proxy, aliases, plugins
- **`tsconfig.json`**: TypeScript configuration (strict mode enabled)
- **`jest.config.js`**: Jest test configuration
- **`package.json`**: Dependencies and scripts

## Related Documentation

- **Feature Design**: [src/features/mandarin/docs/design.md](src/features/mandarin/docs/design.md)
- **API Specification**: [src/features/mandarin/docs/api-spec.md](src/features/mandarin/docs/api-spec.md)
- **System Architecture**: [../../docs/architecture.md](../../docs/architecture.md)
- **Code Conventions**: [../../docs/guides/code-conventions.md](../../docs/guides/code-conventions.md)
- **Vite Configuration**: [../../docs/guides/vite-configuration-guide.md](../../docs/guides/vite-configuration-guide.md)
- **Testing Guide**: [../../docs/guides/testing-guide.md](../../docs/guides/testing-guide.md)
- **React Patterns**: [../../docs/knowledge-base/frontend-react-patterns.md](../../docs/knowledge-base/frontend-react-patterns.md)
- **State Management**: [../../docs/knowledge-base/frontend-state-management.md](../../docs/knowledge-base/frontend-state-management.md)

## Troubleshooting

### Common Issues

**Port 5173 already in use**:

```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or change port in vite.config.ts
server: { port: 5174 }
```

**Module not found errors**:

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors after git pull**:

```bash
# Regenerate types
npm run build
```

**Cookies not working in development**:

- Verify Vite proxy is configured with `credentials: 'include'`
- Check backend CORS allows credentials
- See [Vite Configuration Guide](../../docs/guides/vite-configuration-guide.md)

**More Help**: See [Troubleshooting Guide](../../docs/guides/troubleshooting.md)
