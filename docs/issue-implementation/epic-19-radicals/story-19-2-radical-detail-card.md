# Implementation 19-2: Radical Detail Card

**Last Updated:** June 26, 2026

## Technical Scope

Build the expandable Radical Detail Card component that appears when a user taps a radical in the grid, including ExampleCharGrid with audio + Hub triggers, "See all" expand, and placeholder mnemonic button.

**Files to create:**

- `apps/frontend/src/features/radicals/components/RadicalDetailCard.tsx` — expandable detail card
- `apps/frontend/src/features/radicals/components/ExampleCharGrid.tsx` — example characters with audio + Hub triggers
- `apps/frontend/src/features/radicals/components/ExampleCharCell.tsx` — single character cell (glyph, audio, Hub click)

## Implementation Details

### Expandable Card Pattern

```typescript
// RadicalDetailCard renders below the grid when a radical is selected
// Uses CSS max-height transition for expand/collapse animation
// radicalsStore.selectedRadial controls visibility
function RadicalDetailCard({ radical, onClose }: RadicalDetailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllChars, setShowAllChars] = useState(false);

  const exampleChars = isExpanded || !showAllChars
    ? radical.metadata.hsk_characters.slice(0, 12)
    : radical.metadata.hsk_characters;

  return (
    <div className="radical-detail-card radical-detail-card--open">
      <button className="radical-detail-card__close" onClick={onClose}>×</button>
      <RadicalHero radical={radical} />
      <ExampleCharGrid characters={exampleChars} />
      {radical.metadata.hsk_characters.length > 12 && (
        <button onClick={() => setShowAllChars(!showAllChars)}>
          {showAllChars ? "Show less" : `See all (${radical.metadata.hsk_characters.length})`}
        </button>
      )}
      <button className="mnemonic-btn" disabled title="Coming in Epic 20">
        Generate Story
      </button>
    </div>
  );
}
```

### Hub Integration via hubStore

```typescript
import { useHubStore } from '@/shared/store/hubStore';

// In ExampleCharCell:
function ExampleCharCell({ character, pinyin }: ExampleCharCellProps) {
  const openHub = useHubStore((state) => state.openHub);

  return (
    <div className="example-char-cell">
      <button onClick={() => openHub(character)} className="char-glyph">
        {character}
      </button>
      <button onClick={() => AudioService.playWordAudio(character)} className="audio-btn">
        🔊
      </button>
      <span className="char-pinyin">{pinyin}</span>
    </div>
  );
}
```

### AudioService Reuse

```typescript
// Option A: Use the useAudioPlayback hook (recommended — handles lifecycle)
import { useAudioPlayback } from "@/shared/hooks/useAudioPlayback";
// Inside component:
const { playWordAudio } = useAudioPlayback();
// playWordAudio({ chinese: character, fallbackToBrowserTTS: true }) handles TTS

// Option B: Instantiate AudioService directly
import { AudioService } from "@/features/vocabulary/services";
const audioService = new AudioService();
// audioService.fetchWordAudio({ chinese: character }) returns { audioUrl }
```

## Architecture Integration

```
RadicalGrid → tap radical → radicalsStore.selectedRadical = radical
  → RadicalDetailCard renders below grid
    → ExampleCharGrid
      → ExampleCharCell × N (audio via AudioService, Hub via hubStore)
    → "See all" expand button
    → Mnemonic button (disabled, "Coming in Epic 20" tooltip)

Card close: tap outside (click backdrop) or tap × button
Dismiss animation: CSS transition on max-height
```

## Technical Challenges & Solutions

### Challenge: Cross-Context Navigation — Hub Radical Link to Radical Detail

**Problem:** When a user taps a radical link in the Character Detail Hub's radical decomposition section, they need to navigate to that radical's detail in the radicals feature. The Hub is a portal overlay that can open from any context — so the navigation target isn't a simple route change.

**Solution:** The Hub radical section opens the target radical's detail card by dispatching an event to the radicals store. If the user is already on the radicals page, the detail card opens inline. If they're on a different page, the Hub closes first, then navigates to `/learn/radicals?radical=rad_0001` with a query parameter that auto-selects the radical and opens its detail card.

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: `0895a56`
- **Completion Date**: June 26, 2026
