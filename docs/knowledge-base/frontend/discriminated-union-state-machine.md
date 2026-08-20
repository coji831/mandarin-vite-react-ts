---
purpose: Discriminated union state machines with useReducer
status: active
last-verified: 2026-07-21
type: guide
---

# Discriminated Union State Machines with useReducer

**Category:** Frontend Development
**Last Updated:** July 21, 2026

## Overview

A pattern for managing complex UI state machines using TypeScript discriminated unions with React's `useReducer`. Instead of juggling multiple boolean flags (`isLoading`, `isError`, `isEditing`, …) — which inevitably produce impossible combinations like `isLoading && isEditing === true` — you define every valid state as a single, type-safe union member.

This pattern was extracted from the Epic 20 Mnemonic Stories implementation, where a 9-state mnemonic section (Loading, Cached, Empty, Generating, Display, Editing, Error, Timeout, Pictograph) was managed entirely through a discriminated union + reducer combination.

---

## The Problem: Boolean Flags Don't Scale

A UI piece with 3 states needs 3 booleans; 9 states needs up to 9 booleans. The number of _illegal_ combinations grows exponentially:

```typescript
// ❌ Flag-based — what does isLoading=true + isEditing=true mean?
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
const [isEditing, setIsEditing] = useState(false);
const [isGenerating, setIsGenerating] = useState(false);
// 4 booleans → 16 possible combinations, most invalid
```

Every code path that updates flags must remember to reset the others. One missed `setIsError(false)` and the UI shows Error + Display simultaneously.

---

## The Pattern: Discriminated Union + Reducer

### 1. Define the State

Create a discriminated union where each member has a `type` discriminant. Each member carries only the data relevant to that state.

```typescript
type MnemonicState =
  | { type: "Loading" }
  | { type: "Cached"; story: string }
  | { type: "Empty" }
  | { type: "Generating" }
  | { type: "Display"; story: string; isEdited: boolean }
  | { type: "Editing"; story: string; previousStory: string; previousIsEdited: boolean }
  | { type: "Error"; message: string }
  | { type: "Timeout" }
  | { type: "Pictograph"; character: string };
```

**Key rules:**

- One member per UI state — no exceptions
- Only carry data the rendering needs (e.g., `Editing` carries `previousStory` so Cancel can restore it)
- Use `|` to make illegal states unrepresentable

### 2. Define Typed Actions

Each action carries a payload typed to what the reducer needs.

```typescript
type MnemonicAction =
  | { type: "LOADED_CACHED"; story: string }
  | { type: "LOADED_EDITED"; story: string }
  | { type: "NOT_FOUND" }
  | { type: "IS_PICTOGRAPH"; character: string }
  | { type: "LOAD_ERROR"; message: string }
  | { type: "GENERATE_START" }
  | { type: "GENERATE_SUCCESS"; story: string; isEdited: boolean }
  | { type: "GENERATE_ERROR"; message: string }
  | { type: "GENERATE_TIMEOUT" }
  | { type: "START_EDIT" }
  | { type: "EDIT_UPDATE"; story: string }
  | { type: "SAVE_SUCCESS"; story: string }
  | { type: "CANCEL_EDIT" }
  | { type: "RETRY" }
  | { type: "RESET" };
```

**Action naming conventions:**

- Past tense for results: `LOADED_CACHED`, `GENERATE_SUCCESS`, `GENERATE_TIMEOUT`
- Imperative for user intents: `START_EDIT`, `RETRY`, `RESET`
- Present tense for in-progress: `GENERATE_START`

### 3. Write the Reducer

A pure function: `(state, action) => state`. The switch exhaustively maps actions to new states.

```typescript
function mnemonicReducer(state: MnemonicState, action: MnemonicAction): MnemonicState {
  switch (action.type) {
    case "LOADED_CACHED":
      return { type: "Cached", story: action.story };
    case "LOADED_EDITED":
      return { type: "Display", story: action.story, isEdited: true };
    case "NOT_FOUND":
      return { type: "Empty" };
    case "IS_PICTOGRAPH":
      return { type: "Pictograph", character: action.character };
    case "LOAD_ERROR":
      return { type: "Error", message: action.message };
    case "GENERATE_START":
      return { type: "Generating" };
    case "GENERATE_SUCCESS":
      return { type: "Display", story: action.story, isEdited: action.isEdited };
    case "GENERATE_ERROR":
      return { type: "Error", message: action.message };
    case "GENERATE_TIMEOUT":
      return { type: "Timeout" };
    case "START_EDIT": {
      // Guard: only start editing from Display or Cached
      if (state.type === "Display") {
        return {
          type: "Editing",
          story: state.story,
          previousStory: state.story,
          previousIsEdited: state.isEdited,
        };
      }
      if (state.type === "Cached") {
        return {
          type: "Editing",
          story: state.story,
          previousStory: state.story,
          previousIsEdited: false,
        };
      }
      return state; // No-op from any other state
    }
    case "EDIT_UPDATE": {
      if (state.type === "Editing") {
        return { ...state, story: action.story };
      }
      return state;
    }
    case "SAVE_SUCCESS":
      return { type: "Display", story: action.story, isEdited: true };
    case "CANCEL_EDIT": {
      if (state.type === "Editing") {
        return { type: "Display", story: state.previousStory, isEdited: state.previousIsEdited };
      }
      return state;
    }
    case "RETRY":
      return { type: "Empty" };
    case "RESET":
      return { type: "Loading" };
    default:
      return state;
  }
}
```

**Important patterns:**

- **Guards for conditional transitions**: `START_EDIT` only works from `Display` or `Cached`. From any other state, it's a no-op. This prevents impossible transitions at runtime.
- **Default as no-op**: `default: return state` — unknown actions don't crash the reducer.
- **Exhaustiveness not enforced by switch alone**: TypeScript narrows `action.type` but not `state.type` in a combined union. Use guards for conditional transitions.

### 4. Use in a Component

```typescript
const [state, dispatch] = useReducer(mnemonicReducer, { type: "Loading" });

// Dispatch actions from event handlers or effects
const handleGenerate = useCallback(async () => {
  dispatch({ type: "GENERATE_START" });
  try {
    const result = await mnemonicService.generateMnemonic(character);
    dispatch({ type: "GENERATE_SUCCESS", story: result.story, isEdited: result.isEdited });
  } catch {
    dispatch({ type: "GENERATE_ERROR", message: "Failed to generate." });
  }
}, [character]);

// Render based on current state
const renderContent = () => {
  switch (state.type) {
    case "Loading":
      return <MnemonicLoading />;
    case "Display":
      return <MnemonicDisplay story={state.story} />;
    case "Error":
      return <MnemonicError message={state.message} />;
    // ... handle all states
    default:
      return null;
  }
};
```

---

## Sub-Component Extraction

When the switch in `renderContent` grows beyond ~30 lines, extract each state's rendering into its own sub-component. This keeps the parent focused on orchestration:

| State                | Sub-Component        | Props                                                      |
| -------------------- | -------------------- | ---------------------------------------------------------- |
| Loading / Generating | `MnemonicLoading`    | `character`, `isGenerating?`                               |
| Display / Cached     | `MnemonicDisplay`    | `character`, `story`, `isEdited`, `onEdit`, `onRegenerate` |
| Empty                | `MnemonicEmpty`      | `character`, `onGenerate`                                  |
| Editing              | `MnemonicEditing`    | `character`, `story`, `dispatch`, `onSave`, `onCancelEdit` |
| Error / Timeout      | `MnemonicError`      | `character`, `message?`, `isTimeout?`, `onRetry`           |
| Pictograph           | `MnemonicPictograph` | `character`, `glyph`                                       |

Each sub-component can be independently tested and storyboarded. Memoize the parent with `React.memo` to prevent re-renders when the parent component re-renders for unrelated reasons:

```typescript
const MnemonicSectionInner = React.memo(function MnemonicSectionInner({
  character,
}: {
  character: string;
}) {
  // ...
});
```

---

## Phase Gating

Feature gating by phase level is handled with an early return pattern at the top of the component. This is not part of the state machine — it's a structural gate that prevents the component from mounting at all:

```typescript
export function HubMnemonicSection({ character }: Props) {
  const { phaseGate } = usePhaseGate();
  const defaultPhase = import.meta.env.DEV ? 3 : 1;
  const effectivePhase = phaseGate?.currentPhase ?? defaultPhase;

  if (effectivePhase < 2) return null; // 🚪 Phase gate

  return <MnemonicSectionInner character={character} />;
}
```

**Key points:**

- The gate lives in a _wrapper_ component, separate from the stateful inner component
- The wrapper handles only gating; the inner component handles all state
- In dev, default to a high phase so Storybook and development always see the feature
- `return null` renders nothing — clean, no layout shift

---

## Timeout Handling with Refs

When an async operation (like AI story generation) has a client-side timeout, use refs to prevent stale state updates after the timeout fires:

```typescript
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const timedOutRef = useRef(false);
const mountedRef = useRef(true);

const handleGenerate = useCallback(async () => {
  dispatch({ type: "GENERATE_START" });

  timedOutRef.current = false;

  timeoutRef.current = setTimeout(() => {
    if (mountedRef.current) {
      timedOutRef.current = true;
      dispatch({ type: "GENERATE_TIMEOUT" });
    }
  }, GENERATE_TIMEOUT_MS);

  try {
    const result = await mnemonicService.generateMnemonic(character);
    if (!mountedRef.current) return;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;

    // Guard: don't dispatch success if timeout already fired
    if (!timedOutRef.current) {
      dispatch({ type: "GENERATE_SUCCESS", story: result.story, isEdited: result.isEdited });
    }
  } catch {
    if (!mountedRef.current) return;
    clearTimeout(timeoutRef.current);
    if (!timedOutRef.current) {
      dispatch({ type: "GENERATE_ERROR", message: "Failed to generate." });
    }
  }
}, [character]);
```

**Why three refs?**

| Ref           | Purpose                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------- |
| `mountedRef`  | Prevents dispatch after unmount (React 18 strict mode, race conditions)                  |
| `timedOutRef` | Flags that timeout has already fired, so success/error don't overwrite the Timeout state |
| `timeoutRef`  | Stores the timeout ID for cleanup                                                        |

---

## ARIA Patterns

Each state section needs appropriate ARIA attributes for screen readers:

| State                      | ARIA                                                              |
| -------------------------- | ----------------------------------------------------------------- |
| Loading / Generating       | `role="status"` + `aria-label="Loading mnemonic for {character}"` |
| Error / Timeout            | `role="alert"`                                                    |
| Display                    | `aria-label="Mnemonic story for {character}"`                     |
| Interactive elements       | Each button: `aria-label="Edit mnemonic story"`                   |
| Disabled pictograph button | `aria-disabled="true"` + tooltip                                  |

Example:

```typescript
<div role="status" aria-label={`Loading mnemonic for ${character}`}>
  <Spinner />
  <p>Loading story…</p>
</div>

<div role="alert">
  <p>Failed to load story.</p>
  <Button aria-label="Retry loading mnemonic">Retry</Button>
</div>
```

---

## Trade-Offs

### Pros

- **Impossible states are unrepresentable** — you cannot render Loading + Editing simultaneously
- **Compile-time safety** — TypeScript narrows the union in each switch case, so `state.story` is only accessible when the state actually has a story
- **Predictable transitions** — every action has exactly one effect; no cascading `setState` calls
- **Testable** — the reducer is a pure function; unit tests just call `reducer(state, action)` and assert the result
- **Debuggable** — logging every action + resulting state gives a complete state machine trace
- **Scalable** — adding a 10th state means adding one union member, one or two actions, and one switch case

### Cons

- **Boilerplate** — more files and types compared to a few `useState` calls
- **Learning curve** — team members must understand discriminated unions and reducer patterns
- **Overkill for 2-3 states** — useState with a single union `type Status = "idle" | "loading" | "error"` is often sufficient
- **No built-in guards** — TypeScript doesn't enforce transition validity at compile time; you must write runtime guards (e.g., `START_EDIT` only from `Display`)

---

## When to Use This Pattern

Use a discriminated-union state machine when:

- The UI has **4+ distinct states** that cannot be simplified
- States share **no visual structure** (Loading ≠ Error ≠ Display)
- Transitions are **complex** (e.g., from Editing you can go to Display or stay in Editing)
- You need **exhaustive test coverage** of all state transitions

Use simpler patterns (`useState` with a 2-3 value union, or Zustand) when:

- The UI has only 2-3 states (loading, error, success)
- States share rendering structure (e.g., just swapping a data prop)
- The component is internal to a single file and unlikely to grow

---

## Related

- [Project Workflow & Quality Gates](../../../.github/instructions/project-workflow.instructions.md) — how `usePhaseGate` works across features
- [React useReducer docs](https://react.dev/reference/react/useReducer)
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
