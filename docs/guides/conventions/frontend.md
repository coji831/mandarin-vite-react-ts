# Frontend Conventions

**Last Updated:** August 7, 2026  
**Purpose:** Frontend coding standards, conventions, and patterns  
**Audience:** Frontend developers

> **When to read this:** When you need to follow frontend code style, naming, import patterns, or project structure conventions.

## Shared Component Catalog

> **Authoritative source:** `.github/component-registry.json` — the machine-checked catalog of all shared components, verified via `npm run check:registry-stories` (gate 7 in `.github/instructions/project-workflow.instructions.md`).
>
> All shared components live in `apps/frontend/src/shared/components/` and are re-exported through the `shared/components` barrel. This document does NOT maintain a parallel component list — consult the registry for the current catalog.

## Code Style & Patterns

- Use TypeScript for all React code
- Use functional components and React hooks
- Prefer named function declarations for components (e.g., `function MyComponent() {}`) over `const MyComponent: React.FC = () => {}`
- Use `type` for type definitions instead of `interface` unless extending external types
- Use ES module import/export syntax (`import ... from ...`, `export ...`) for all code
- Always use explicit type annotations for function parameters, return values, and variables where type inference is not obvious
- Avoid using `any` type; prefer strict, specific types and leverage TypeScript's type system for safety

- Keep each feature in its own folder under `apps/frontend/src/features/`
- Put route constants in `apps/frontend/src/shared/constants/paths.ts`
- Use React Router for navigation and routing
- Consume vocabulary through the backend words API via the service layer (`apiClient`) — all vocabulary lives in the database; local CSV files are not read at runtime

## API Client & Integration Patterns

> **Reference:** See [API Client Patterns](./api-client.md) for axiosClient, error handling, and service patterns.

**Quick Reference:**

```typescript
import { apiClient } from "services";
const response = await apiClient.get<ProgressData>("/api/v1/progress");
const data = response.data; // Direct access — no wrapper
```

## Backend Conventions & Architecture

> **Reference:** See [Backend Conventions](./backend.md) for:
>
> - Module architecture patterns (Controllers, Services, Repositories)
> - Middleware patterns (auth, error handling)
> - Error logging & scoping best practices
> - Dependency injection setup
> - Service & repository patterns
> - Backend testing patterns

**Quick Reference:**

```typescript
// Controller: Thin, HTTP only
router.post('/login', async (req: Request, res: Response) => {
  const result = await authService.login(req.body.email, req.body.password);
  res.json(result);
});

// Service: Business logic, stateless
async login(email: string, password: string) {
  const user = await this.userRepository.findByEmail(email);
  if (!user) throw new AuthError('User not found');
  return { user, token: this.jwt.generateToken(user.id) };
}
```

## State Management Conventions

> **Reference:** See [State Management Patterns](./state-management.md) for:
>
> - Reducer file patterns and action type naming
> - Action creator hooks with memoization
> - Selector patterns and memoization best practices
> - Error boundaries for rendering errors
> - State shape normalization patterns
> - Complete testing examples (reducer, hook, component)

**Quick Reference:**

```typescript
// 1. Select data with fallback
const words = useProgressState((s) => s.lists?.wordsById ?? {});

// 2. Get memoized action creators
const { markWordLearned } = useProgressActions();

// 3. Dispatch in handlers
const handleMark = (id: string) => markWordLearned(id);

// 4. Memoize expensive selectors
const sortedWords = useMemo(() => {
  return Object.values(words).sort((a, b) => a.pinyin.localeCompare(b.pinyin));
}, [words]);
```

## Security Conventions

> **Reference:** See [Security Conventions](./security.md) for:
>
> - Credential management (no secrets in code)
> - XSS & SQLi prevention (React auto-escaping, Prisma parameterized queries)
> - Security logging patterns (failed login attempts, PII protection)
> - CSP headers and Content-Security-Policy best practices

**Quick Reference:**

```typescript
// ✅ SAFE — React auto-escapes all content by default
function Display({ text }: { text: string }) {
  return <div>{text}</div>;
}

// ❌ DANGEROUS — Never render unsanitized HTML
// <div dangerouslySetInnerHTML={{ __html: userInput }} />
```

## Audio Conventions

> **Core principle:** the shared `AudioManager` is a **pure transport** — it plays whatever `PlayableItem[]` it is given and holds **no resolver concept**. Fallback policy is expressed as **data** (an ordered `candidates` list per item), and consumer intent is supplied via **`AudioBehavior` contracts**.

- **Manager = pure transport** — `shared/audio` (`AudioManager` + `AudioEngine` + `BrowserTTS` + `AudioUrlCache` + strategies) only plays items and walks candidate lists. It never calls APIs and never decides what to play.
- **Fallback = data** — each `PlayableItem` carries an ordered `candidates` array (`{kind:"url"}` → `{kind:"tts"}` …). `candidates: []` means silent skip (advance, never a spinner). A URL that plays-but-errors calls `behavior.onUrlFailed` (→ `"fallback"`) and the manager advances to the next candidate.
- **Features own `AudioBehavior` contracts** — the passage behavior is readers-owned (`features/readers/audio/PassageAudioBehavior.ts`, `buildPassageAudioBehavior`); the default **word** contract is feature-free and lives in `shared/audio/contracts/` (`defaultWordBehavior`). `shared/audio` itself stays feature-free.
- **Barrel rule covers `features/readers/audio`** — `features/readers/audio/index.ts` is a re-export-only barrel, re-exported by the readers feature barrel (`features/readers/index.ts`).
- **No `useAuth` / `apiClient` in shared audio** — HTTP stays in the service layer (`shared/services/audio` for words, `features/readers/services/passageService.ts` for passages). `shared/audio` and its contracts never touch auth state or the HTTP client.
- **Hooks** — `useAudioManager({ behavior })` (behavior-driven orchestration; `shared/hooks/useAudioManager.ts`) and `useAudioItemPlayback` (per-item default word contract; `shared/hooks/useAudioItemPlayback.ts`).

---

## Routing Conventions

- Place page components in `pages` subdirectory of feature
- Use nested routes for complex features
- Define routes in feature's `router` directory
- Use path constants from `src/shared/constants/paths.ts`
- Route parameters should be type-safe using generics
- Support browser history navigation

## File & Folder Naming Standards

> **Reference:** See [Naming Standards](./naming-standards.md) for all backend and frontend file/folder naming rules.

## Export Pattern Rules

> **Note:** Prefer named exports; reserve default exports for page components only

### Named Exports (Preferred)

**Use for:** Components, hooks, services, utils, types

```typescript
// ✅ Correct - Named export
export function VocabularyCard(props: VocabularyCardProps) {}

// Import with specific name
import { VocabularyCard } from "../components/VocabularyCard";
```

### Default Exports (Reserved)

**Use ONLY for:** Page components (route targets)

```typescript
// ✅ Acceptable - Page component
export default function HomePage() {}

// Import without destructuring
import HomePage from "./pages/HomePage";
```

### Why Named Exports?

- **Tree-shaking:** Better dead code elimination
- **Refactoring:** IDE can track renames accurately
- **Consistency:** Same pattern everywhere
- **No confusion:** Clear what's being imported

### Migration from Mixed Exports

**Current anti-pattern (to fix):**

```typescript
// ❌ Incorrect - Both default + named
export function WordExamplesPanel() {}
export default WordExamplesPanel;
```

**Correct pattern:**

```typescript
// ✅ Correct - Named only
export function WordExamplesPanel() {}

// Update imports:
// import WordExamplesPanel from './WordExamplesPanel'; ← OLD
import { WordExamplesPanel } from "./WordExamplesPanel"; // ← NEW
```

### Barrel Exports

**Use `index.ts` for convenient re-exports:**

```typescript
// components/index.ts
export { VocabularyCard } from "./VocabularyCard";
export { FlashCard } from "./FlashCard";
export { ExampleList } from "./ExampleList";

// Usage
import { VocabularyCard, FlashCard } from "../components";
```

## Import Path Standards

> **Note:** Use Vite path aliases over relative paths for cleaner imports

### Frontend Path Aliases

**Configured in `vite.config.ts`:**

```typescript
resolve: {
  alias: {
    features: path.resolve(__dirname, 'src/features'),
    src: path.resolve(__dirname, 'src'),
    utils: path.resolve(__dirname, 'src/utils'),
    config: path.resolve(__dirname, 'src/shared/config'),
    shared: path.resolve(__dirname, 'src/shared'),
    services: path.resolve(__dirname, 'src/shared/api'),
  }
}
```

**Usage:**

```typescript
// ✅ Preferred - Vite alias
import { apiClient } from "services";
import { API_CONFIG } from "config/api";

// ❌ Avoid - Relative paths (harder to maintain)
import { apiClient } from "../../../services";
import { API_CONFIG } from "../../../config/api";
```

**When to use relative paths:**

- Within same feature folder (short, clear)
- Importing sibling files: `import { utils } from './utils'`

### Backend Import Standards

**Use named imports for config:**

```javascript
// ✅ Correct - Named import
import { config } from "../../config/index.js";

// ❌ Incorrect - Default import (config exports named)
import config from "../../config/index.js";
```

**ESM requires `.js` extensions in import paths (referring to compiled output):**

```typescript
// ✅ Correct - Include .js extension
import { AuthService } from "./services/AuthService.js";

// ❌ Incorrect - Missing extension (Node ESM error)
import { AuthService } from "./services/AuthService";
```

## Project Structure

- `apps/frontend/src/features/`: Feature modules (auth, character-hub, dashboard, foundations, grammar, lexical-hub, phonetic-clusters, quiz, radicals, readers, review, word-hub)
- `apps/frontend/src/pages/`: Route-level page orchestrators
- `apps/frontend/src/router/`: React Router configuration
- `apps/frontend/src/shared/`: Cross-cutting layer (api, components, config, constants, layouts)
- `apps/frontend/public/data/vocabulary/`: HSK3.0 CSV files (legacy — not read at runtime)

## Testing Practices

- Put tests next to the code they test
- Use Vitest and React Testing Library
- Name test files as `ComponentName.test.tsx` or `file.test.ts`

## Documentation Organization

- High-level docs in [./](./)
- Feature docs in `../src/features/<feature>/docs/`

## Shared Components

> See [Shared Component Catalog](#shared-component-catalog) above — the authoritative catalog is `.github/component-registry.json` (machine-checked via `npm run check:registry-stories`). Do not maintain a parallel list here.
>
> All shared components live in `src/shared/components/` and are re-exported via the `shared/components` barrel. Prefer these over raw HTML elements.
>
> `Tabs` supports two style variants: `"default"` (filled tabs) and `"underline"` (underline-style tabs).

## Zustand Stores

- `hubStore` — LexicalHub overlay state (isOpen, currentEntity, navigationStack; open/close/back)
- `mnemonicStore` — Mnemonic story state (10-state machine: idle, loading, cached, empty, generating, display, editing, error, timeout, pictograph)

## CSS & Styling Conventions

- **CSS 3-file architecture**: `globals.css` = tokens + single-property utilities only; `components.css` = multi-property component patterns; `animations.css` = @keyframes + animation/transition classes. All three are imported via `globals.css`.
- **No `rem` values** — All sizing/spacing must use fixed global utility classes (`gap-*`, `p-*`, `font-*`, etc.) from `globals.css`. Only use a local CSS file if the style is truly uncommon, non-repeating, or cannot be expressed with utilities (e.g., `:hover` transitions, unique dimensions, custom animations).
- **1 component = 1 CSS file** — Each component with distinctive styles gets exactly one co-located `ComponentName.css` file. Shared patterns belong in `src/styles/components.css`. Do not create shared CSS files that serve multiple unrelated components.
- **Import through barrel files** — Imports must go through the feature's barrel (`index.ts`) when crossing directory boundaries. Direct relative imports between features or across sub-folders are not allowed. Only same-directory imports may be relative.

- Use [docs/business-requirements/](../../business-requirements/) for business requirements and planning
- Use [docs/issue-implementation/](../../issue-implementation/) for technical implementation docs

## Commit Message & Pull Request Standards

- Use clear, descriptive commit messages
