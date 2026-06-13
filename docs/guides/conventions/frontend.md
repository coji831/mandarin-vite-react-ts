# Frontend Conventions

**Last Updated:** June 12, 2026  
**Purpose:** Frontend coding standards, conventions, and patterns  
**Audience:** Frontend developers

> **When to read this:** When you need to follow frontend code style, naming, import patterns, or project structure conventions.

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
- Use the CSV-based vocabulary system with `csvLoader.ts`

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
> - Clean architecture layers (Controllers, Services, Repositories)
> - Middleware patterns (auth, error handling)
> - Error logging & scoping best practices
> - Dependency injection setup
> - Service & repository patterns
> - Backend testing patterns

**Quick Reference:**

```javascript
// Controller: Thin, HTTP only
router.post('/login', async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  res.json(result);
});

// Service: Business logic, stateless
async login(email, password) {
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
import { examplesApi } from "services/examplesApi";
import { API_CONFIG } from "config/api";
import { csvLoader } from "utils/csvLoader";

// ❌ Avoid - Relative paths (harder to maintain)
import { examplesApi } from "../../../services/examplesApi";
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

**ESM requires `.js` extensions:**

```javascript
// ✅ Correct - Include .js extension
import { AuthService } from "./services/AuthService.js";

// ❌ Incorrect - Missing extension (Node ESM error)
import { AuthService } from "./services/AuthService";
```

## Project Structure

- `apps/frontend/src/features/`: Feature modules (auth, dashboard, gamification, quiz, vocabulary)
- `apps/frontend/src/pages/`: Route-level page orchestrators
- `apps/frontend/src/router/`: React Router configuration
- `apps/frontend/src/shared/`: Cross-cutting layer (api, components, config, constants, layouts)
- `apps/frontend/public/data/`: Static data files
  - `apps/frontend/public/data/vocabulary/`: CSV vocabulary files (HSK3.0)
  - `apps/frontend/public/data/examples/`: Example sentences and usage
- `apps/frontend/src/utils/`: Utility functions (includes `csvLoader.ts`)

## Testing Practices

- Put tests next to the code they test
- Use Vitest and React Testing Library
- Name test files as `ComponentName.test.tsx` or `file.test.ts`

## Documentation Organization

- High-level docs in [./](./)
- Feature docs in `../src/features/<feature>/docs/`

- Use [docs/business-requirements/](../../business-requirements/) for business requirements and planning
- Use [docs/issue-implementation/](../../issue-implementation/) for technical implementation docs

## CSV Vocabulary Format

- Store CSV vocabulary files in `../public/data/vocabulary/hsk3.0/band1/`
- Follow the standard format: `No,Chinese,Pinyin,English`
- Process with `csvLoader.ts` utility in `../src/utils/`
- Document any structure changes in implementation docs

## Commit Message & Pull Request Standards

- Use clear, descriptive commit messages
