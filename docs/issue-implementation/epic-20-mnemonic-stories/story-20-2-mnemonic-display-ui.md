# Implementation 20-2: Mnemonic Display UI

**Last Updated:** July 21, 2026

## Implementation Status

- **Status**: Completed
- **PR**: epic-20-mnemonic-stories

## Technical Scope

Implement the mnemonic display UI within CharacterHub: a 📖 "View Story" button in HubActions (phase-gated to Phase 2+), a `HubMnemonicSection` component with 9 interaction states, a `Textarea` shared component for editing, and a `mnemonicService` for API calls. No standalone mnemonics page — all UI is embedded.

**Files to create:**

- `apps/frontend/src/features/character-hub/components/HubMnemonicSection.tsx` — main mnemonic component with all 9 states
- `apps/frontend/src/features/character-hub/components/HubMnemonicSection.css` — styles for all states
- `apps/frontend/src/features/character-hub/services/mnemonicService.ts` — API calls (GET, POST, PUT, DELETE)
- `apps/frontend/src/shared/components/Textarea/Textarea.tsx` — multiline text input
- `apps/frontend/src/shared/components/Textarea/Textarea.css` — Textarea styles
- `apps/frontend/src/shared/components/Textarea/Textarea.test.tsx` — unit tests
- `apps/frontend/src/shared/components/Textarea/index.ts` — barrel export

**Files to modify:**

- `apps/frontend/src/features/character-hub/components/CharacterHub.tsx` — Add HubMnemonicSection
- `apps/frontend/src/features/character-hub/components/HubActions.tsx` — Add 📖 button, phase-gated
- `apps/frontend/src/shared/components/index.tsx` — Export Textarea
- `.github/component-registry.json` — Add Textarea + HubMnemonicSection

## Implementation Details

### Component Hierarchy

```
CharacterHub.tsx (modal)
├── HubCharacterCard
├── HubInfoLine
├── HubRadicalSection        (existing)
├── HubMnemonicSection       ★ NEW — 9 states
├── HubEtymology             (existing)
├── HubReadings              (existing)
├── HubCommonWords           (existing)
├── HubActions               ★ MODIFIED — add 📖 button
└── ...
```

### 9-State State Machine

```typescript
type MnemonicState =
  | { type: "Loading" }
  | { type: "Cached"; story: string }
  | { type: "Empty" }
  | { type: "Generating" }
  | { type: "Display"; story: string; isEdited: boolean }
  | { type: "Editing"; story: string }
  | { type: "Error"; message: string }
  | { type: "Timeout" }
  | { type: "Pictograph"; character: string };

// State transitions:
// Empty → Loading (on 📖 click)
// Loading → Cached | Display | Empty | Error
// Cached → Display (instant render)
// Display → Editing (on ✏️)
// Display → Generating (on 🔄 confirm)
// Editing → Display (on 💾 save)
// Editing → Display (on ✖ cancel)
// Generating → Display | Error | Timeout
// Error → Empty (on 🔄 retry)
// Timeout → Empty (on retry)
// Pictograph → (terminal state)
```

### HubMnemonicSection Rendering Pattern

```tsx
function HubMnemonicSection({ character, phase }: Props) {
  if (phase < 2) return null; // Phase gate

  const [state, dispatch] = useReducer(mnemonicReducer, { type: "Empty" });

  return (
    <section aria-label={`Mnemonic story for ${character}`}>
      {state.type === "Empty" && (
        <button onClick={handleGenerate} aria-label="Generate mnemonic story for {character}">
          ✨ Generate Story
        </button>
      )}

      {state.type === "Generating" && (
        <div role="status" aria-live="polite">
          <Spinner /> <span>Creating mnemonic story…</span>
        </div>
      )}

      {state.type === "Display" && (
        <div className="hub-mnemonic__container" style={{ height: 180 }}>
          <p>{state.story}</p>
          <Button variant="icon" onClick={handleEdit} aria-label="Edit mnemonic story">
            ✏️
          </Button>
          <Button variant="icon" onClick={handleRegenerate} aria-label="Regenerate mnemonic story">
            🔄
          </Button>
        </div>
      )}

      {state.type === "Editing" && (
        <Textarea
          value={state.story}
          onChange={handleStoryChange}
          maxLength={5000}
          aria-label="Edit mnemonic story"
        />
      )}

      {state.type === "Error" && (
        <div role="alert">
          <p>
            Failed to load story. <Button onClick={handleRetry}>Retry</Button>
          </p>
        </div>
      )}

      {state.type === "Timeout" && (
        <div role="alert">
          <p>
            Generation timed out. <Button onClick={handleRetry}>Retry</Button>
          </p>
        </div>
      )}

      {state.type === "Pictograph" && (
        <p>
          This character is a simple pictograph — its meaning is directly represented by its form.
          No mnemonic needed.
        </p>
      )}
    </section>
  );
}
```

### Textarea Shared Component

```typescript
interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  rows?: number;
  className?: string;
  "aria-label"?: string;
}
```

## Architecture Integration

```
mnemonicService.ts → apiClient → GET/POST/PUT/DELETE /api/mnemonics/:character
       ↓
HubMnemonicSection (9-state state machine)
       ↓
CharacterHub (modal) + HubActions (📖 button)
       ↓
Phase gate: usePhaseGate() — Phase 2+ only
```

## Technical Challenges & Solutions

### Challenge: Variable-Length Stories Breaking Layout

**Problem:** Mnemonic stories can range from 1 sentence to 3 paragraphs. Without a fixed container, the CharacterHub layout shifts between characters.

**Solution:** Use a fixed-height container (e.g., `height: 180px`) with `overflow-y: auto` for the story display area. This follows the Data-Resilient UI Principle — the outer container dimensions are invariant regardless of story length.

### Challenge: 9-State Complexity

**Problem:** 9 states create many possible transitions. Missing edge cases (e.g., clicking Edit while Generating) could cause confusing UI states.

**Solution:** Use a `useReducer` with a typed state machine that explicitly defines valid transitions. Invalid actions (e.g., clicking Edit when state is Empty) are type-checked at compile time.

### Challenge: Stacked Modals

**Problem:** 📖 button is in RadicalDetailCard (a modal). Without closing it first, clicking 📖 opens CharacterHub on top — creating two stacked modals.

**Solution:** The 📖 click handler calls `onClose()` on RadicalDetailCard before calling `hubStore.open()`. This ensures the RadicalDetailCard is dismissed before CharacterHub appears.

## Completed Work

### Created Files

- `apps/frontend/src/features/character-hub/components/HubMnemonicSection.tsx` — Main mnemonic component with phase gate (Phase 2+) and useReducer-based 9-state machine
- `apps/frontend/src/features/character-hub/components/HubMnemonicSection.css` — Styles for all mnemonic states
- `apps/frontend/src/features/character-hub/components/mnemonic/index.ts` — Barrel exports for mnemonic sub-components
- `apps/frontend/src/features/character-hub/components/mnemonic/MnemonicDisplay.tsx` — Display + Cached states with story text, ✏️ Edit, 🔄 Regenerate buttons
- `apps/frontend/src/features/character-hub/components/mnemonic/MnemonicEditing.tsx` — Editing state with Textarea, 💾 Save, ✖ Cancel
- `apps/frontend/src/features/character-hub/components/mnemonic/MnemonicEmpty.tsx` — Empty state with ✨ Generate Story button
- `apps/frontend/src/features/character-hub/components/mnemonic/MnemonicError.tsx` — Error + Timeout states with retry
- `apps/frontend/src/features/character-hub/components/mnemonic/MnemonicLoading.tsx` — Loading + Generating states with spinner
- `apps/frontend/src/features/character-hub/components/mnemonic/MnemonicPictograph.tsx` — Pictograph info message
- `apps/frontend/src/features/character-hub/components/mnemonic/mnemonicReducer.ts` — Typed state machine reducer (9 states)
- `apps/frontend/src/features/character-hub/components/mnemonic/__tests__/HubMnemonicSection.test.tsx` — Tests for all 9 states and phase gating
- `apps/frontend/src/features/character-hub/constants/pictographs.ts` — PICTOGRAPH_CHARS constant moved to dedicated file
- `apps/frontend/src/features/character-hub/services/mnemonicService.ts` — Service layer with 4 API methods (GET, POST, PUT, DELETE)
- `apps/frontend/src/features/character-hub/services/__tests__/mnemonicService.test.ts` — Tests for all 4 API calls
- `apps/frontend/src/shared/components/Textarea/Textarea.tsx` — Shared multiline text input (forwardRef pattern)
- `apps/frontend/src/shared/components/Textarea/Textarea.css` — Textarea styles
- `apps/frontend/src/shared/components/Textarea/index.ts` — Barrel export
- `apps/frontend/src/shared/components/Textarea/__tests__/Textarea.test.tsx` — Unit tests

### Modified Files

- `.github/component-registry.json` — Added Textarea + HubMnemonicSection
- `apps/frontend/src/features/character-hub/components/CharacterHub.stories.tsx` — Added mnemonic MSW handlers
- `apps/frontend/src/features/character-hub/components/CharacterHub.tsx` — Added HubMnemonicSection with onCloseMnemonic callback
- `apps/frontend/src/features/character-hub/components/HubActions.tsx` — Added 📖 "View Story" button (phase-gated) with pictograph handling
- `apps/frontend/src/features/character-hub/components/__tests__/HubActions.test.tsx` — Added mnemonic button tests
- `apps/frontend/src/features/character-hub/components/index.ts` — Added HubMnemonicSection exports
- `apps/frontend/src/features/character-hub/services/index.ts` — Added mnemonicService + PICTOGRAPH_CHARS exports
- `apps/frontend/src/shared/components/index.tsx` — Added Textarea export

## Testing Implementation

- **Unit tests**: Textarea — rendering, placeholder, maxLength, disabled, ARIA labels
- **Unit tests**: mnemonicService — all 4 API calls with success/error responses
- **Unit tests**: HubMnemonicSection — all 9 states render correctly, phase gating
- **Storybook stories**: Textarea — default, with value, disabled, with error
- **Storybook stories**: HubMnemonicSection — Empty, Display, Editing, Error, Pictograph
- **Mobile test**: 320px viewport — verify no overflow
- **Accessibility check**: All interactive elements have correct ARIA labels
