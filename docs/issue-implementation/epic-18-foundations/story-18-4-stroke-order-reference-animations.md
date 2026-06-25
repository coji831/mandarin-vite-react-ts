# Implementation 18-4: Stroke Order Reference & Animations

> Template note: headings include markers like `[Required]` and `[Optional]` to indicate guidance. When creating published/read docs, remove those bracketed tokens from the headings.

## Status

- **Status**: Completed
- **Last Updated**: June 19, 2026
- **PR**: TBD

## Technical Scope

Build the Stroke Reference tab (8 basic strokes + 4 rules) and Stroke Animations tab (Hanzi Writer character search with full playback controls).

**Files to create:**

- `apps/frontend/src/features/foundations/components/StrokeReferenceTab.tsx` — basic strokes grid + rules
- `apps/frontend/src/features/foundations/components/StrokeAnimTab.tsx` — character search + animation
- `apps/frontend/src/features/foundations/components/BasicStrokesGrid.tsx` — 8-stroke grid component
- `apps/frontend/src/features/foundations/components/StrokeRulesCard.tsx` — 4 rules with examples
- `apps/frontend/src/features/foundations/components/CharacterSearchInput.tsx` — text input for character lookup
- `apps/frontend/src/features/foundations/components/HanziWriterCanvas.tsx` — wrapper around hanzi-writer
- `apps/frontend/src/features/foundations/components/AnimationControls.tsx` — play/pause/step/speed controls
- `apps/frontend/src/features/foundations/components/SuggestedCharacters.tsx` — quick-select buttons
- `apps/frontend/src/features/foundations/hooks/useHanziWriter.ts` — hanzi-writer lifecycle hook
- `apps/frontend/src/features/foundations/utils/strokeUtils.ts` — stroke display helpers
- `apps/frontend/public/data/foundations/strokes.json` — static data

**Dependencies to install:**

- `hanzi-writer` npm package (MIT license)

## Implementation Details

```typescript
// HanziWriterCanvas.tsx — Wrapper around hanzi-writer library
function HanziWriterCanvas({ character, onCharacterClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);

  useEffect(() => {
    if (!containerRef.current || !character) return;

    // Lazy-load hanzi-writer (already imported, but code-split at route level)
    writerRef.current = HanziWriter.create(containerRef.current, character, {
      width: 200,
      height: 200,
      padding: 10,
      strokeColor: TONE_COLORS[1], // Use tone color 1 (red) for strokes
      delayBetweenStrokes: 300,     // ms between automatic strokes
      delayBetweenLoops: 2000,      // ms between animation loops
    });

    return () => {
      writerRef.current?.destroy();
      writerRef.current = null;
    };
  }, [character]);

  return (
    <div
      ref={containerRef}
      className="hanzi-writer-container"
      onClick={() => onCharacterClick?.(character)}
      role="button"
      tabIndex={0}
      aria-label={`Stroke animation for ${character}`}
    />
  );
}
```

```typescript
// AnimationControls.tsx
function AnimationControls({ writer, speed, onSpeedChange }: Props) {
  return (
    <div className="animation-controls">
      <button onClick={() => writer?.play()}>▶ Play</button>
      <button onClick={() => writer?.pause()}>⏸ Pause</button>
      <button onClick={() => writer?.stepBack()}>⏪ Step Back</button>
      <button onClick={() => writer?.stepForward()}>⏩ Step Forward</button>
      <label>
        Speed:
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.5}
          value={speed}
          onChange={(e) => {
            const newSpeed = parseFloat(e.target.value);
            onSpeedChange(newSpeed);
            writer?.setSpeed(newSpeed);
          }}
        />
        <span>{speed}x</span>
      </label>
    </div>
  );
}
```

## Architecture Integration

```
StrokeReferenceTab
  ├── BasicStrokesGrid (8 cells: glyph + pinyin + meaning)
  └── StrokeRulesCard (4 rules: name + example character + description)

StrokeAnimTab
  ├── CharacterSearchInput (text input → search)
  ├── HanziWriterCanvas (SVG render area)
  │   └── AnimationControls (play/pause/step/speed)
  ├── StrokeBreakdown (list of component strokes)
  └── SuggestedCharacters (10 quick-select buttons)
       └── Click character → open CharacterDetailHub (Story 18.5)

Data: public/data/foundations/strokes.json
Library: hanzi-writer (npm, lazy-loaded with React.lazy)
```

## Technical Challenges & Solutions

### Challenge 1: Hanzi Writer CDN Data Loading

**Problem**: Hanzi Writer v3.x fetches character stroke data from `cdn.jsdelivr.net` via XHR. When the CDN is unreachable, the XHR returns `status === 0` and the library calls neither the success nor error callback — the initialization hangs forever.

**Root Cause**: The default XHR handler has a missing error path for `xhr.status === 0`.

**Solution**: Provided a custom `charDataLoader` using `fetch()` with a proper error path. Also added `onLoadCharDataError` callback for loading status.

**Impact**: Reliable initialization with clear error messages on network failure.

### Challenge 2: React DOM Conflict with Hanzi Writer

**Problem**: Hanzi Writer creates SVG elements directly inside a container div via refs. If the same div also has React children, React's reconciliation tries to `removeChild` nodes that Hanzi Writer already modified, causing `NotFoundError`.

**Root Cause**: Mixed ownership — React and external library both managing the same DOM subtree.

**Solution**: Separated the canvas container into a pure ref-managed div with no React children. Placeholder/error states are rendered as absolute-positioned overlays on top, not as children of the canvas div.

**Impact**: Zero DOM conflicts between React and Hanzi Writer.

### Challenge 3: Auto-Play Conflicts with Step Operations

**Problem**: The `onLoadCharDataSuccess` callback unconditionally called `animateCharacter()` on every data load. When `handleStepBack` called `writer.setCharacter()` (which re-triggers data loading), the auto-play overrode the step-back's intermediate stroke count, resetting `currentStroke` to `totalStrokes` and breaking step forward.

**Root Cause**: `setCharacter()` reuses the same LoadingManager and fires `onLoadCharDataSuccess`.

**Solution**: Added `shouldAutoPlayRef` flag — `true` on initial load, `false` during step operations, restored after the manual animation chain completes.

**Impact**: Auto-play works on initial character load; step forward/back work independently.

### Challenge 4: Architecture Refactoring (Modulith Pattern)

**Problem**: Page components accumulated hanzi-writer lifecycle logic, control handlers, and state management, violating the modulith separation of concerns.

**Solution**: Three-phase refactoring:

1. Extracted all hanzi-writer logic into `useHanziWriter` hook
2. Decomposed monolithic workspace into controlled components (`CharacterSearchBar`, `AnimationPanel`, `SuggestionPanel`)
3. Pages now own only lifted state (`character`) and compose components as pure layout orchestrators

**Impact**: Clean modulith boundaries. `features/` owns all logic, `pages/` owns only composition.

## Testing Implementation

- Unit test: BasicStrokesGrid renders 8 strokes
- Unit test: StrokeRulesCard renders 4 rules with correct example characters
- Unit test: CharacterSearchInput validates input is a single hanzi character
- Unit test: AnimationControls emits correct events for each button
- Integration test: Typing character triggers HanziWriter.create
- Integration test: Speed slider updates writer speed
