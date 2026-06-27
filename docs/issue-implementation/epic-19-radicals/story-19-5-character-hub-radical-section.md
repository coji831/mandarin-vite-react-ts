# Implementation 19-5: Character Hub Radical Section

**Last Updated:** June 27, 2026

## Technical Scope

Extend the existing CharacterDetailHub shared component with a new HubRadicalSection that shows the radical decomposition of the current character, phase-gated for Phase 2+ users.

**Files to create:**

- `apps/frontend/src/shared/components/CharacterDetailHub/HubRadicalSection.tsx` — radical decomposition section

**Files to modify:**

- `apps/frontend/src/shared/components/CharacterDetailHub/CharacterDetailHub.tsx` — add HubRadicalSection rendering + import usePhaseGate()

## Implementation Details

### Phase-Gated Conditional Rendering

```typescript
// CharacterDetailHub.tsx — add HubRadicalSection after existing sections
function CharacterDetailHub({ character, onClose }: CharacterDetailHubProps) {
  const { phaseGate } = usePhaseGate();
  const currentPhase = phaseGate?.currentPhase ?? 1;

  return (
    <div className="character-detail-hub">
      <HubBackdrop onClick={onClose} />
      <div className="hub-content">
        <CharacterHero character={character} />
        <StrokeSection character={character} />

        {/* NEW: phase-gated radical decomposition section */}
        {currentPhase >= 2 && (
          <HubRadicalSection character={character} />
        )}

        <HubActions character={character} />
      </div>
    </div>
  );
}
```

**Note:** `CharacterDetailHub.tsx` must import `usePhaseGate()` from `@/shared/hooks/usePhaseGate`. This is a NEW dependency for this component — it currently does not use phase gating.

### HubRadicalSection Component

```typescript
// HubRadicalSection.tsx
function HubRadicalSection({ character }: HubRadicalSectionProps) {
  const radicals = useRadicalDecomposition(character);

  // Gracefully hide when no radical data available
  if (!radicals || radicals.length === 0) return null;

  return (
    <div className="hub-section hub-radical-section">
      <h3 className="hub-section__title">Radical Decomposition</h3>
      <div className="hub-radical-list">
        {radicals.map((radical) => (
          <div key={radical.id} className="hub-radical-item">
            <span className="hub-radical-glyph">{radical.glyph}</span>
            <div className="hub-radical-info">
              <span className="hub-radical-name">{radical.name_pinyin}</span>
              <span className="hub-radical-meaning">{radical.meaning}</span>
            </div>
            <button
              className="hub-radical-link"
              onClick={() => navigateToRadicalDetail(radical.id)}
              title="View radical detail"
            >
              →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Radical Decomposition Data Lookup

```typescript
// Hook or utility to look up radical decomposition for a character
// Uses radical-character-mapping.json (reverse lookup: character → radicals)
function useRadicalDecomposition(character: string): RadicalData[] | null {
  const [radicals, setRadicals] = useState<RadicalData[] | null>(null);

  useEffect(() => {
    // Load radical-character-mapping.json
    // Find entry where character appears in hsk_characters array
    // Return matching radical definitions
    loadRadicalMapping().then((mapping) => {
      const radicalIds = mapping[character] || [];
      if (radicalIds.length === 0) {
        setRadicals(null);
        return;
      }
      // Load radical data for each ID
      Promise.all(radicalIds.map((id) => loadRadicalData(id))).then(setRadicals);
    });
  }, [character]);

  return radicals;
}
```

## Architecture Integration

```
CharacterDetailHub (existing shared component)
  ├── Backdrop
  ├── CharacterHero
  ├── StrokeSection
  ├── HubRadicalSection ← NEW (phase-gated, Phase 2+)
  │   ├── Radical glyph, pinyin, meaning
  │   └── Clickable → navigates to /learn/radicals?radical=rad_XXXX
  ├── HubActions
  └── [Future sections]

Data source: content/radicals/radical-character-mapping.json (reverse mapping)
Phase gate: usePhaseGate() → currentPhase >= 2
Navigation: React Router navigate() + radicalsStore.setSelectedRadical()
```

## Technical Challenges & Solutions

### Challenge: Cross-Context Navigation — Hub Radical Section to Radical Detail

**Problem:** When a user taps a radical link in the Hub's radical decomposition section, they need to navigate to that radical's detail. The Hub is a portal overlay that can open from any context, so the navigation target isn't a simple route change.

**Solution:** The Hub radical section dispatches to the radicals store. If the user is already on the radicals page, the detail card opens inline. If on a different page, the Hub closes first, then navigates to `/learn/radicals?radical=rad_XXXX` with a query parameter that auto-selects the radical and opens its detail card.

## Actual Implementation Notes

The `HubRadicalSection` was placed in `apps/frontend/src/features/character-hub/components/` (not in `shared/components/` as originally planned) since the CharacterDetailHub was already refactored into the `character-hub` feature folder. The section uses **dual-source lookup**:

1. **HSK character data** — Characters in `content/characters/` contain a `radicals` field listing component radical IDs.
2. **CharacterRadical API** — The backend `CharacterRadical` model (Prisma) provides a many-to-many mapping between characters and radicals, loaded via `useRadicalDecomposition()` → `radicalsService.fetchCharacterRadicals()`.

This dual approach ensures comprehensive coverage: the static character JSON provides the primary radical decomposition, while the API can supplement with additional or verified mappings.
