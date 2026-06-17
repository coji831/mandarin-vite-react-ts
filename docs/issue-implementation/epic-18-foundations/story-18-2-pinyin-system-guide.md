# Implementation 18-2: Pinyin System Guide

> Template note: headings include markers like `[Required]` and `[Optional]` to indicate guidance. When creating published/read docs, remove those bracketed tokens from the headings.

## Technical Scope

Build the interactive pinyin chart with initials/finals grids, tone-colored combination display, and TTS audio integration.

**Files to create:**

- `apps/frontend/src/features/foundations/components/PinyinTab.tsx` — main tab component
- `apps/frontend/src/features/foundations/components/InitialsGrid.tsx` — 21-cell initials grid
- `apps/frontend/src/features/foundations/components/FinalsGrid.tsx` — 39-cell finals grid
- `apps/frontend/src/features/foundations/components/CombinationDisplay.tsx` — tone row for selected combination
- `apps/frontend/src/features/foundations/components/ToneCell.tsx` — individual tone-colored pinyin cell
- `apps/frontend/src/features/foundations/hooks/usePinyinAudio.ts` — TTS audio hook for pinyin sounds
- `apps/frontend/src/features/foundations/utils/pinyinUtils.ts` — combination logic, tone coloring
- `apps/frontend/src/features/foundations/types/index.ts` — PinyinSectionId, tone data types
- `apps/frontend/public/data/foundations/pinyin.json` — static data

## Implementation Details

```typescript
// PinyinTab.tsx
function PinyinTab() {
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  const [selectedFinal, setSelectedFinal] = useState<string | null>(null);
  const { playAudio, isLoading } = usePinyinAudio();

  const combination = selectedInitial && selectedFinal
    ? getCombination(selectedInitial, selectedFinal)
    : null;

  return (
    <div className="pinyin-tab">
      <h3>Initials (声母)</h3>
      <InitialsGrid
        initials={PINYIN_DATA.initials}
        selected={selectedInitial}
        onSelect={(i) => { setSelectedInitial(i); playAudio(i); }}
      />

      <h3>Finals (韵母)</h3>
      <FinalsGrid
        finals={PINYIN_DATA.finals}
        selected={selectedFinal}
        onSelect={(f) => { setSelectedFinal(f); }}
      />

      {combination && (
        <CombinationDisplay
          initial={selectedInitial!}
          final={selectedFinal!}
          tones={combination.tones}
          onPlayTone={(pinyin, tone) => playAudio(pinyin)}
        />
      )}
    </div>
  );
}
```

```typescript
// pinyinUtils.ts — Tone color mapping
export const TONE_COLORS: Record<number, string> = {
  1: "#FF4444", // red
  2: "#FF8C00", // orange
  3: "#4CAF50", // green
  4: "#2196F3", // blue
  0: "#9E9E9E", // gray
};

export function getCombination(initial: string, final: string) {
  return PINYIN_DATA.combinations.find((c) => c.initial === initial && c.final === final) ?? null;
}
```

```typescript
// usePinyinAudio.ts — Audio playback hook
function usePinyinAudio() {
  const { playWordAudio, isLoading } = useAudioPlayback();

  const playPinyinAudio = useCallback(
    async (pinyin: string) => {
      try {
        await playWordAudio({ chinese: pinyin, fallbackToBrowserTTS: true });
      } catch (error) {
        console.warn(`TTS failed for "${pinyin}", trying browser TTS`, error);
      }
    },
    [playWordAudio],
  );

  return { playAudio: playPinyinAudio, isLoading };
}
```

## Architecture Integration

```
PinyinTab
  ├── InitialsGrid (21 cells, clickable → TTS)
  ├── FinalsGrid (39 cells, clickable → selects)
  └── CombinationDisplay (tone row: 5 cells, tone-colored)
       └── usePinyinAudio → AudioService.playWordAudio → Backend /v1/tts

Data: public/data/foundations/pinyin.json (loaded via fetch, cached in memory)
```

## Technical Challenges & Solutions

```
Problem: TTS audio for 21 initials + 39 finals + all combinations could be slow to generate.
Solution: Preload first 10 common combinations on tab mount. Show loading spinner per cell
while audio generates. Use AudioService's built-in browser TTS fallback for instant playback.
```

## Testing Implementation

- Unit test: InitialsGrid renders 21 cells
- Unit test: FinalsGrid renders 39 cells
- Unit test: CombinationDisplay shows 5 tone cells for valid combination
- Unit test: getCombination returns null for invalid pairs
- Integration test: AudioService.playWordAudio called on cell click
- Visual test: Tone colors match TONE_COLORS scheme
