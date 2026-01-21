# Frontend Context Rules

**Auto-activated when working in**: `apps/frontend/`

---

## Component Patterns

### Component Structure
```typescript
// ✅ Use named function declarations
function VocabularyCard({ word, onSelect }: VocabularyCardProps) {
  const selectedWords = useProgressState(s => s.ui?.selectedWords ?? []);
  const { markWordLearned } = useProgressActions();

  return (
    <div className="vocabulary-card">
      {/* Component JSX */}
    </div>
  );
}

// ❌ Avoid React.FC pattern
const VocabularyCard: React.FC<Props> = (props) => { /* ... */ };
```

### Hook Usage Patterns
```typescript
// Custom hooks: camelCase with 'use' prefix
export function useVocabularyData() {
  const [data, setData] = useState<VocabWord[]>([]);
  // Hook logic
  return { data, isLoading, error };
}

// State hook: Always use selector pattern
const selectedList = useProgressState(s => s.ui?.selectedList ?? null);

// Action hook: Destructure stable actions
const { setSelectedList, markWordLearned } = useProgressActions();
```

### State Management in Components

**Context Pattern:**
```typescript
// Reading state (granular selectors)
const isLoading = useProgressState(s => s.ui?.isLoading ?? false);
const words = useProgressState(s => s.lists?.wordsById ?? {});

// Dispatching actions
const { markWordLearned, setError } = useProgressActions();

// ❌ Never read entire state
const state = useProgressState(s => s); // Causes unnecessary re-renders
```

**Progress State (Backend-Synced):**
- Source: `/api/v1/progress/*` with JWT auth
- Always use selectors: `selectWordsById(state)`
- Optimistic updates: UI updates before API response
- Server reconciliation: API response is authoritative

---

## Routing Patterns

### Route Definition
```typescript
// apps/frontend/src/router/Router.tsx
import { PATHS } from '@/constants/paths';

<Route path={PATHS.MANDARIN.ROOT} element={<MandarinLayout />}>
  <Route index element={<Navigate to={PATHS.MANDARIN.VOCABULARY_LIST} />} />
  <Route path={PATHS.MANDARIN.VOCABULARY_LIST} element={<VocabularyListPage />} />
  <Route path={PATHS.MANDARIN.FLASHCARDS} element={<FlashCardPage />} />
</Route>
```

### Navigation
```typescript
import { useNavigate } from 'react-router-dom';
import { PATHS } from '@/constants/paths';

const navigate = useNavigate();
navigate(PATHS.MANDARIN.FLASHCARDS.replace(':listId', listId));
```

---

## File Organization

```
apps/frontend/src/features/{feature}/
├── components/          # Feature-specific UI components
│   └── VocabularyCard.tsx
├── hooks/              # Custom hooks
│   ├── useProgressState.ts
│   └── useProgressActions.ts
├── pages/              # Route page components
│   ├── VocabularyListPage.tsx
│   └── FlashCardPage.tsx
├── reducers/           # State reducers
│   ├── rootReducer.ts
│   ├── listsReducer.ts
│   ├── uiReducer.ts
│   └── userReducer.ts
├── router/             # Feature routing
│   └── MandarinRoutes.tsx
├── types/              # TypeScript types
│   ├── state.ts
│   └── actions.ts
├── services/           # API service layer
│   ├── audioService.ts
│   └── conversationService.ts
└── docs/               # Feature documentation
    ├── design.md
    └── api-spec.md
```

---

## Service Layer Pattern

### API Services
```typescript
// apps/frontend/src/features/mandarin/services/audioService.ts
import { API_ROUTES } from '@shared/constants';
import { authFetch } from '@/utils/authFetch';

export async function generateAudio(text: string, voice: string): Promise<AudioResult> {
  const response = await authFetch(API_ROUTES.ttsAudio, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });

  if (!response.ok) {
    throw new Error('Audio generation failed');
  }

  return response.json();
}
```

### authFetch Wrapper
- Auto-refreshes JWT on 401
- Always uses `credentials: 'include'` for cookies
- Retries original request after refresh

---

## TypeScript Patterns

### Type Definitions
```typescript
// Use 'type' over 'interface'
export type WordProgress = {
  wordId: string;
  confidence: number;
  studyCount: number;
  nextReview: string;
};

// Normalized state shape
export type ProgressState = {
  wordsById: Record<string, WordProgress>;
  wordIds: string[];
};

// Action types with discriminated unions
export type ProgressAction =
  | { type: 'PROGRESS/LOAD_ALL'; payload: WordProgress[] }
  | { type: 'MARK_WORD_LEARNED'; payload: { id: string } }
  | { type: 'PROGRESS/UPDATE_WORD'; payload: WordProgress };
```

### Type Safety in Selectors
```typescript
// Explicit return type when needed
const selectedWords = useProgressState<string[]>(
  s => s.ui?.selectedWords ?? []
);

// Type inference works for simple cases
const isLoading = useProgressState(s => s.ui?.isLoading ?? false);
```

---

## Testing Patterns

### Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import { ProgressStateContext, ProgressDispatchContext } from '../context';

test('renders vocabulary card with word data', () => {
  const mockState = {
    lists: { wordsById: { '1': mockWord }, wordIds: ['1'] },
    ui: { selectedWords: [], isLoading: false },
    user: { userId: 'test' },
  };

  render(
    <ProgressStateContext.Provider value={mockState}>
      <ProgressDispatchContext.Provider value={jest.fn()}>
        <VocabularyCard word={mockWord} />
      </ProgressDispatchContext.Provider>
    </ProgressStateContext.Provider>
  );

  expect(screen.getByText(mockWord.chinese)).toBeInTheDocument();
});
```

### Hook Tests
```typescript
import { renderHook } from '@testing-library/react';
import { useProgressState } from '../hooks/useProgressState';

test('selector returns memoized value', () => {
  const { result, rerender } = renderHook(
    () => useProgressState(s => s.ui?.isLoading ?? false),
    { wrapper: TestProvider }
  );

  expect(result.current).toBe(false);
  // Test memoization and stability
});
```

---

## Common Pitfalls

### ❌ Don't
```typescript
// Reading entire state
const state = useProgressState(s => s);

// Mutating state directly
state.ui.isLoading = true;

// Using React.FC
const Component: React.FC<Props> = () => {};

// Missing fallbacks in selectors
const words = useProgressState(s => s.lists.wordsById); // Can crash
```

### ✅ Do
```typescript
// Granular selectors with fallbacks
const isLoading = useProgressState(s => s.ui?.isLoading ?? false);

// Immutable updates via actions
const { setLoading } = useProgressActions();
setLoading(true);

// Named function declarations
function Component({ prop }: Props) {}

// Always provide fallbacks
const words = useProgressState(s => s.lists?.wordsById ?? {});
```

---

## Related Documentation

- Component patterns: @docs/knowledge-base/frontend-react-patterns.md
- Advanced patterns: @docs/knowledge-base/frontend-advanced-patterns.md
- State management: @docs/knowledge-base/frontend-state-management.md
- UI patterns: @docs/knowledge-base/frontend-ui-patterns.md
- Dev server setup: @docs/guides/vite-configuration-guide.md
- Testing guide: @docs/guides/testing-guide.md
