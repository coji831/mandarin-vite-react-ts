# Project Conventions

## Code Style & Patterns

- Use TypeScript for all React code
- Use functional components and React hooks
- Prefer named function declarations for components (e.g., `function MyComponent() {}`) over `const MyComponent: React.FC = () => {}`
- Use `type` for type definitions instead of `interface` unless extending external types
- Use ES module import/export syntax (`import ... from ...`, `export ...`) for all code
- Always use explicit type annotations for function parameters, return values, and variables where type inference is not obvious
- Avoid using `any` type; prefer strict, specific types and leverage TypeScript's type system for safety
- Keep each feature in its own folder under [../src/features/](../src/features/)
- Put route constants in [../src/constants/paths.ts](../src/constants/paths.ts)
- Use React Router for navigation and routing
- Use the CSV-based vocabulary system with `csvLoader.ts`

## State Management Conventions

### Reducer Files

- **Naming**: `{domain}Reducer.ts` (e.g., `listsReducer.ts`, `uiReducer.ts`, `userReducer.ts`)
- **Exports**:
  - Reducer function: `export function {domain}Reducer(state, action)`
  - Action type union: `export type {Domain}Action = ActionType1 | ActionType2 | ...`
  - Initial state: `export const {domain}InitialState`
- **Structure**: Use switch statement with action types in `SCREAMING_SNAKE_CASE`
- **Action Type Naming**: Prefix with domain namespace
  - UI actions: `UI/SET_LOADING`, `UI/SET_ERROR`
  - Lists actions: `MARK_WORD_LEARNED`, `RESET`
  - User actions: `USER/SET_ID`, `USER/SET_PREF`
- **Location**: `src/features/{feature}/reducers/`

### Action Creators

- **Pattern**: Export from `useProgressActions()` hook, not standalone functions
- **Naming**: Verb-based, camelCase (e.g., `markWordLearned`, `setSelectedList`, `resetProgress`)
- **Signature**: Accept payload parameters directly, not action objects
  - ✅ Correct: `markWordLearned(id: string)`
  - ❌ Incorrect: `markWordLearned({ type: 'MARK_WORD_LEARNED', payload: { id } })`
- **Memoization**: All action creators must be memoized with minimal dependencies
- **Return**: Return object from hook with all action creators

### Selectors

- **Pattern**: Use `useProgressState(selector)` with inline arrow functions
- **State Access**: Always use slice pattern: `s.ui.*`, `s.lists.*`, `s.user.*`
  - ✅ Correct: `useProgressState(s => s.ui?.selectedWords ?? [])`
  - ❌ Incorrect: `useProgressState(s => s.selectedWords)` (legacy pattern)
- **Default Values**: Always provide fallback with `??` operator
- **Type Safety**: Type selector return value explicitly when needed
- **Performance**: Keep selectors focused—subscribe only to needed data

### State Shape Conventions

- **Root State**: `{ lists, user, ui }`
- **Normalized Data**: Use `{itemsById}` (lookup) + `{itemIds}` (order) pattern
  - Example: `{ wordsById: Record<WordId, WordEntity>, wordIds: WordId[] }`
- **No Duplication**: UI state references normalized data by ID, doesn't duplicate
- **Immutability**: Always use spread operators, never mutate state directly
- **Type Definitions**: Define state types in `types/` directory

### Example Usage

```typescript
// ✅ Correct Pattern
import { useProgressState, useProgressActions } from "../hooks";
import { RootState } from "../reducers/rootReducer";

function MyComponent() {
  // Granular selectors with type inference
  const selectedWords = useProgressState((s) => s.ui?.selectedWords ?? []);
  const loading = useProgressState((s) => s.ui?.isLoading ?? false);

  // Stable action creators
  const { markWordLearned, setSelectedList } = useProgressActions();

  // Use in handlers
  const handleMark = (id: string) => markWordLearned(id);
}

// ❌ Incorrect Pattern (Legacy)
const state = useProgressState((s) => s); // Don't read entire state
const words = state.selectedWords; // Don't use legacy top-level aliases
```

### Testing Conventions

- **Reducer Tests**: Test each action type in isolation
  - File: `__tests__/{reducer}.test.ts`
  - Pattern: Given state + action → assert new state
- **Hook Tests**: Test selector memoization and action creator stability
- **Component Tests**: Mock `useProgressState` and `useProgressActions`
  - Provide mock state via `ProgressStateContext.Provider`
  - Provide no-op dispatch via `ProgressDispatchContext.Provider`

## Routing Conventions

- Place page components in `pages` subdirectory of feature
- Use nested routes for complex features
- Define routes in feature's `router` directory
- Use path constants from `src/constants/paths.ts`
- Route parameters should be type-safe using generics
- Support browser history navigation

## Naming Rules

- Components: PascalCase (e.g., `MyComponent.tsx`)
- Variables/functions: camelCase (e.g., `myFunction`)
- Folders/files: kebab-case or lower-case (e.g., `my-feature`)
- Files that export a PascalCase component, type, hook, context, or similar should use PascalCase for the filename (e.g., `MyComponent.tsx`, `MyType.ts`, `MyHook.ts`, `MyContext.tsx`).
- Tests: match the file/component name with `.test.ts(x)` suffix

## Project Structure

- [../src/features/](../src/features/): Main features (e.g., mandarin)
- [../public/data/](../public/data/): Static data files
  - [../public/data/vocabulary/](../public/data/vocabulary/): CSV vocabulary files (HSK3.0)
  - [../public/data/examples/](../public/data/examples/): Example sentences and usage
- [../src/utils/](../src/utils/): Utility functions (includes `csvLoader.ts`)
- [../src/components/](../src/components/): Reusable UI components
- [../api/](../api/): Serverless functions (e.g., TTS)
- [../local-backend/](../local-backend/): Local development server

## Testing Practices

- Put tests next to the code they test
- Use Jest and React Testing Library (if available)
- Name test files as `ComponentName.test.tsx` or `file.test.ts`

## Documentation Organization

- High-level docs in [./](./)
- Feature docs in `../src/features/<feature>/docs/`
- Use [../docs/business-requirements/](../business-requirements/) for business requirements and planning
- Use [../docs/issue-implementation/](../issue-implementation/) for technical implementation docs

## CSV Vocabulary Format

- Store CSV vocabulary files in `../public/data/vocabulary/hsk3.0/band1/`
- Follow the standard format: `No,Chinese,Pinyin,English`
- Process with `csvLoader.ts` utility in `../src/utils/`
- Document any structure changes in implementation docs

## Authentication Patterns

### authFetch Wrapper

Use wrapper for automatic token refresh on protected endpoints:

```typescript
// src/utils/authFetch.ts
export async function authFetch(url: string, options?: RequestInit) {
  let response = await fetch(url, {
    ...options,
    credentials: "include", // Include cookies
  });

  // Auto-refresh on 401
  if (response.status === 401) {
    await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    // Retry original request
    response = await fetch(url, {
      ...options,
      credentials: "include",
    });
  }

  return response;
}
```

**Usage:**

```typescript
// Instead of fetch()
const response = await authFetch("/api/protected/resource");
```

### Background Token Refresh

Implement proactive refresh timer (5 minutes before expiry):

```typescript
// src/features/auth/hooks/useAuth.ts
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh every 10 minutes (tokens expire in 15)
    const refreshInterval = setInterval(async () => {
      try {
        await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("Background refresh failed:", error);
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  return { isAuthenticated };
}
```

### Auth State Restoration

Use `/me` endpoint for robust initial auth state:

```typescript
// On app mount
useEffect(() => {
  const restoreAuth = async () => {
    try {
      const response = await authFetch("/api/auth/me");
      if (response.ok) {
        const user = await response.json();
        dispatch({ type: "SET_USER", payload: user });
      }
    } catch (error) {
      // User not authenticated - normal flow
      dispatch({ type: "CLEAR_USER" });
    }
  };

  restoreAuth();
}, []);
```

### Security Logging

Structure failed login logs with context:

```typescript
// Backend: src/routes/auth.ts
import { logger } from "../utils/logger";

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await validateCredentials(email, password);

  if (!user) {
    // Log failed attempt with sanitized details
    logger.warn("Failed login attempt", {
      email: email.toLowerCase(),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      timestamp: new Date().toISOString(),
    });

    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Success flow...
});
```

**Key Points:**

- Sanitize email (lowercase, no sensitive data)
- Include IP for rate limiting/blocking
- Log user-agent for device tracking
- Use structured logging (JSON) for monitoring tools

### Protected Route Pattern

```typescript
// Backend: middleware/requireAuth.ts
import jwt from "jsonwebtoken";

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer token

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Apply to routes
app.get("/api/protected/resource", requireAuth, handler);
```

**Frontend Protected Component:**

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <>{children}</>;
}
```

### Reference

- **Source Story**: [Story 13.3: JWT Authentication System](../business-requirements/epic-13-production-backend-architecture/story-13-3-authentication.md)
- **Implementation**: Story 13.3 (commit e9b28c1)
- [Backend Setup Guide](./backend-setup-guide.md)
- [Testing Guide](./testing-guide.md)

## Commit Message & Pull Request Standards

- Use clear, descriptive commit messages
