# Implementation 18-2: Pinyin System Guide

> Template note: headings include markers like `[Required]` and `[Optional]` to indicate guidance. When creating published/read docs, remove those bracketed tokens from the headings.

## Technical Scope

Interactive pinyin chart with 21 initials + 38 finals grids, tone-colored combination display with 5-tone row (1st–Neutral), and TTS audio via `useAudioPlayback` (moved to `shared/hooks/`) with pinyin→character audio mapping. Shared `PinyinCell` component (flex-row, content-sized). Static JSON data loaded from `public/data/foundations/pinyin.json` and `pinyin-audio-map.json`. Mobile-responsive layout (max-width 800px, centered, flex-wrap grids).

**Files created:**

```
apps/frontend/public/data/foundations/
├── pinyin.json              — 21 initials, 38 finals, ~310 combinations
└── pinyin-audio-map.json    — 1,125 pinyin→character mappings for TTS

apps/frontend/src/features/foundations/
├── components/
│   ├── PinyinCell.tsx        — Shared cell (flex-row, compact)
│   ├── InitialsGrid.tsx      — 21 initials using PinyinCell
│   ├── FinalsGrid.tsx        — 38 finals grouped by type (Simple/Compound/Nasal)
│   ├── CombinationDisplay.tsx — 5-tone row with labels
│   └── ToneCell.tsx           — Tone-colored vowel with play button
├── utils/
│   ├── pinyinUtils.ts        — TONE_COLORS, getCombination, tone helpers
│   └── pinyinAudioMap.ts     — loadPinyinAudioMap(), getPinyinAudioText()
└── types/index.ts            — PinyinInitial, PinyinFinal, PinyinCombination, PinyinData

apps/frontend/src/pages/learn/
├── PinyinTab.tsx             — Main interactive pinyin chart
└── PinyinTab.css             — Dark-theme compact styling

apps/frontend/src/shared/hooks/
└── useAudioPlayback.ts      — Moved from vocabulary (cross-feature extraction)
```

**Files modified:**

- `features/foundations/index.ts` — added component/hook/type exports
- `features/foundations/types/index.ts` — added pinyin type interfaces
- `features/foundations/utils/index.ts` — added pinyin utils exports
- `pages/learn/FoundationsPage.css` — centered tab content
- `pages/learn/PinyinTab.tsx` — replaced placeholder with full implementation
- `shared/hooks/index.ts` — added useAudioPlayback export
- `features/vocabulary/hooks/index.ts` — re-export useAudioPlayback from shared
- `features/vocabulary/components/Basic.tsx` — import via barrel
- `features/vocabulary/components/PlayButton.tsx` — import via barrel
- `.gitignore` — exclude `.github/agents/` and `verification-artifacts/`

## Implementation Details

```typescript
// TONE_COLORS — applied to tone mark in each combination cell
export const TONE_COLORS: Record<number, string> = {
  1: "#FF4444", // red — 1st tone (high level)
  2: "#FF8C00", // orange — 2nd tone (rising)
  3: "#4CAF50", // green — 3rd tone (dipping)
  4: "#2196F3", // blue — 4th tone (falling)
  0: "#9E9E9E", // gray — neutral tone
};
```

```typescript
// PinyinCell — shared compact cell (flex-row, content-sized)
interface PinyinCellProps {
  label: string;
  subtitle?: string;
  isSelected?: boolean;
  toneColor?: string;
  disabled?: boolean;
  onClick?: () => void;
}

function PinyinCell({ label, subtitle, isSelected, toneColor, disabled, onClick }: PinyinCellProps) {
  return (
    <div
      className={`pinyin-cell ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      style={toneColor ? { color: toneColor } : undefined}
    >
      <span className="pinyin-cell-label">{label}</span>
      {subtitle && <span className="pinyin-cell-subtitle">{subtitle}</span>}
    </div>
  );
}
```

```typescript
// getPinyinAudioText — maps pinyin syllable to Chinese character for TTS
export function getPinyinAudioText(pinyin: string): string {
  if (!audioMap) return pinyin; // fallback to raw pinyin → browser TTS
  return audioMap[pinyin] ?? pinyin;
}
```

```typescript
// PinyinTab — main component: select initial → select final → hear 5 tones
function PinyinTab() {
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  const [selectedFinal, setSelectedFinal] = useState<string | null>(null);
  const { playWordAudio, isLoading } = useAudioPlayback();

  const combination = selectedInitial && selectedFinal
    ? getCombination(selectedInitial, selectedFinal)
    : null;

  const handlePlayAudio = useCallback(async (text: string) => {
    const chinese = getPinyinAudioText(text);
    await playWordAudio({ chinese, fallbackToBrowserTTS: true });
  }, [playWordAudio]);

  return (
    <div className="pinyin-tab">
      <h3>Initials (声母)</h3>
      <InitialsGrid
        initials={PINYIN_DATA.initials}
        selected={selectedInitial}
        onSelect={(i) => { setSelectedInitial(i); handlePlayAudio(i.pinyin); }}
      />
      <h3>Finals (韵母)</h3>
      <FinalsGrid
        finals={PINYIN_DATA.finals}
        selected={selectedFinal}
        onSelect={(f) => setSelectedFinal(f)}
      />
      {combination && (
        <CombinationDisplay
          initial={selectedInitial!}
          final={selectedFinal!}
          tones={combination.tones}
          onPlayTone={(pinyin) => handlePlayAudio(pinyin)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
```

## Architecture Integration

```
PinyinTab
  ├── InitialsGrid (21 cells, PinyinCell with IPA)
  ├── FinalsGrid (38 cells, PinyinCell, grouped by type)
  └── CombinationDisplay (5-tone row)
       └── ToneCell (tone-colored vowel, play ▶ on hover)
            └── useAudioPlayback.playWordAudio({ chinese: mappedChar })
                 └── AudioService.fetchWordAudio → Backend /v1/tts

Data:
  pinyin.json → cached module-level, loaded once
  pinyinAudioMap.json → getPinyinAudioText() maps pinyin → Chinese char for TTS
```

## Technical Challenges & Solutions

### Challenge 1: Cross-feature audio dependency

**Problem:** `usePinyinAudio` in foundations imported `useAudioPlayback` from vocabulary, creating a cross-feature dependency.

**Root Cause:** `useAudioPlayback` was originally scoped inside `features/vocabulary/hooks/`, but the pinyin tab (in `features/foundations/`) needed the same audio playback logic.

**Solution:** Moved `useAudioPlayback` to `shared/hooks/` — both features now import from shared. Vocabulary barrel re-exports for backward compatibility.

```typescript
// apps/frontend/src/shared/hooks/useAudioPlayback.ts
// Extracted from features/vocabulary/hooks/ — no functional changes

// apps/frontend/src/features/vocabulary/hooks/index.ts
export { useAudioPlayback } from "../../../shared/hooks";
```

**Lesson:** Audio playback is a cross-cutting concern. Shared hooks should live in `shared/hooks/` from the start. Feature-specific wrappers can live in feature folders.

### Challenge 2: TTS doesn't support pinyin text

**Problem:** Backend TTS (`POST /v1/tts`) expects Chinese characters (e.g., "八"), but pinyin syllables (e.g., "bā") are Latin text.

**Root Cause:** Google Cloud TTS is configured for `zh-CN` language. It cannot synthesize Latin/alphanumeric text as spoken Chinese.

**Solution:** Created `pinyinAudioMap.json` with 1,125 entries mapping each tone-marked pinyin to a common Chinese character with that pronunciation. `getPinyinAudioText()` handles lookup with fallback to raw pinyin → browser TTS.

```typescript
// pinyin-audio-map.json (abbreviated)
{
  "bā": "八",
  "bá": "拔",
  "bǎ": "把",
  "bà": "爸",
  // ... 1,125 entries total
}

// pinyinAudioMap.ts
export function getPinyinAudioText(pinyin: string): string {
  if (!audioMap) return pinyin;
  return audioMap[pinyin] ?? pinyin;
}
```

**Lesson:** When integrating TTS with non-Chinese input, always check what the TTS engine can actually synthesize. A lookup map is simple and reliable.

### Challenge 3: Wireframe alignment — grid layout

**Problem:** Initials grid needed to match the 2-row wireframe layout (11 initials + 10 initials), but a simple CSS grid stretched cells unevenly.

**Root Cause:** Default grid behavior distributes available width equally, making cells unnecessarily wide and mismatching the compact wireframe design.

**Solution:** Extracted `PinyinCell` component with `flex: 0 0 auto` (content-sized), flex-wrap grids for natural wrapping without stretching.

```css
.pinyin-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.pinyin-cell {
  flex: 0 0 auto;
  padding: 0.4rem 0.6rem;
}
```

**Lesson:** For variable-width label grids, flex-wrap with content-sized items is more predictable than CSS Grid with fixed columns.

### Challenge 4: Layout too tall

**Problem:** The pinyin tab consumed excessive vertical space with large gaps and column-direction cells, requiring scrolling on a standard viewport.

**Root Cause:** Initial styling used generous spacing (1.5rem gaps) and column-direction layouts in cells.

**Solution:** Reduced gaps (1.5rem→0.75rem), switched cells to flex-row, reduced cell height (54px→36px), added max-width 800px, centered tab content.

**Lesson:** Reference grids benefit from compact layouts — users scan visually, not interact with each cell simultaneously. Optimize for information density.

## Testing Implementation

- **Visual**: Tone colors verified against TONE_COLORS scheme
- **Visual**: Grid layout matches wireframe (2-row initials, grouped finals)
- **Functional**: Click initial → plays audio, select initial+final → shows tone row
- **Build**: `tsc --noEmit` passes, `npm test` passes

## Implementation Status

- **Status**: Completed
- **PR**: TBD (branch: epic-18-foundations)
- **Key Commit**: c094047
- **Last Update**: June 18, 2026
