# Implementation 18-5: Character Detail Hub (Phase 1 Minimal)

> Template note: headings include markers like `[Required]` and `[Optional]` to indicate guidance. When creating published/read docs, remove those bracketed tokens from the headings.

## Technical Scope

Build the Character Detail Hub as a shared React portal overlay with Phase 1 minimal variant: character hero, pinyin, audio, stroke animation, and save/review actions.

**Files to create:**

- `apps/frontend/src/shared/components/CharacterDetailHub/CharacterDetailHub.tsx` — main portal overlay
- `apps/frontend/src/shared/components/CharacterDetailHub/HubHeader.tsx` — character hero + pinyin + audio
- `apps/frontend/src/shared/components/CharacterDetailHub/StrokeSection.tsx` — inline Hanzi Writer
- `apps/frontend/src/shared/components/CharacterDetailHub/HubActions.tsx` — Save to Review / Mark Learned
- `apps/frontend/src/shared/components/CharacterDetailHub/hubStore.ts` — zustand store
- `apps/frontend/src/shared/components/CharacterDetailHub/index.ts` — barrel exports

**Shared pattern dependencies:**

- HanziWriterCanvas from Story 18.4 (reused for inline stroke animation)
- AudioService from vocabulary feature (reused for audio playback)
- Progress API (existing endpoint for SRS queue)

## Implementation Details

```typescript
// hubStore.ts — Zustand store for Hub state
interface HubState {
  isOpen: boolean;
  character: string | null;
  pinyin: string | null;
  triggerPosition?: { x: number; y: number }; // For scale-from animation
  open: (char: string, pinyin: string, position?: { x: number; y: number }) => void;
  close: () => void;
}

const useHubStore = create<HubState>((set) => ({
  isOpen: false,
  character: null,
  pinyin: null,
  triggerPosition: undefined,
  open: (character, pinyin, position) =>
    set({
      isOpen: true,
      character,
      pinyin,
      triggerPosition: position,
    }),
  close: () => set({ isOpen: false, character: null, pinyin: null }),
}));
```

```typescript
// CharacterDetailHub.tsx — Portal component
function CharacterDetailHub() {
  const { isOpen, character, pinyin, close } = useHubStore();

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, close]);

  if (!isOpen || !character) return null;

  return createPortal(
    <div className="hub-backdrop" onClick={close}>
      <div className="hub-panel" onClick={(e) => e.stopPropagation()}>
        <HubHeader character={character} pinyin={pinyin ?? ""} />
        <StrokeSection character={character} />
        <HubActions character={character} />
      </div>
    </div>,
    document.body
  );
}
```

```typescript
// HubActions.tsx
function HubActions({ character }: { character: string }) {
  const { saveToReview, markLearned, isSaving } = useProgressActions();

  return (
    <div className="hub-actions">
      <Button onClick={() => saveToReview(character)} disabled={isSaving}>
        💾 Save to Review
      </Button>
      <Button onClick={() => markLearned(character)} variant="secondary" disabled={isSaving}>
        ✅ Mark Learned
      </Button>
    </div>
  );
}
```

## Architecture Integration

```
Any trigger point (stroke anim tab, future radical browser, future reader, etc.)
  └── useHubStore.open(character, pinyin)
       └── CharacterDetailHub (React Portal → document.body)
            ├── HubHeader (character 64-72px + pinyin + 🔊 audio)
            ├── StrokeSection (reuses HanziWriterCanvas from Story 18.4)
            └── HubActions (Save to Review / Mark Learned)
                 └── Progress API → Backend

Phase gating: Hub checks usePhaseGate().currentPhase to determine visible sections
Phase 1: Only header + stroke + actions
Phase 2+: Also shows radical decomposition, mnemonic story
```

## Technical Challenges & Solutions

```
Problem: Portal components need to coordinate with the triggering component's scroll position
for the scale-up animation.
Solution: Pass triggerPosition from the click event. Use CSS transform-origin set to the
trigger coordinates for a natural-feeling scale-up animation from the tap point.

Problem: Hub must be accessible from any component without prop drilling.
Solution: Zustand store (hubStore) eliminates prop drilling. Any component imports
useHubStore and calls open() with the character data. No Context provider needed.
```

## Testing Implementation

- Unit test: Hub opens when store.isOpen = true
- Unit test: Hub closes on Esc key press
- Unit test: Hub closes on backdrop click
- Unit test: Save to Review calls progress API
- Unit test: Hub only renders Phase 1 sections for Phase 1 user
- Integration test: CharacterDetailHub renders as React Portal in document.body
