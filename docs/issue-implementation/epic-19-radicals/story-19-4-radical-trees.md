# Implementation 19-4: Radical Trees (Phase 3)

**Last Updated:** June 26, 2026

## Technical Scope

Build the RadicalTreesTab component with Phase 2 browse mode (character list for a selected radical) and Phase 3 tree mode (mastered radicals as expandable tree nodes with character branches), plus character-to-radical mapping data.

**Files to create:**

- `apps/frontend/src/features/radicals/components/RadicalTreesTab.tsx` — main tab component with mode switching
- `apps/frontend/src/features/radicals/components/TreeRootNode.tsx` — mastered radical tree root (Phase 3)
- `apps/frontend/src/features/radicals/components/BranchNode.tsx` — character node in tree (clickable → Hub)
- `apps/frontend/src/features/radicals/components/CharacterListNode.tsx` — flat character list (Phase 2)
- `content/radicals/radical-character-mapping.json` — radical ID → character glyph mapping

**Files to modify:**

- `apps/frontend/src/features/radicals/stores/radicalsStore.ts` — add trees-related state

## Implementation Details

### Tree Rendering

```typescript
// Phase 3 mode: mastered radicals as expandable tree roots
// Each root node expands to show character branches
function RadicalTreesTab() {
  const { phaseGate } = usePhaseGate();
  const [selectedRadical, setSelectedRadical] = useState<string | null>(null);

  if (phaseGate?.currentPhase < 3) {
    return <Phase2BrowseMode />; // Flat character list per radical
  }

  return <Phase3TreeMode />; // Mastered radicals as tree roots
}

// Phase3TreeMode fetches mastered radicals from RadicalProgress API
// then renders each as a TreeRootNode with expandable character branches
function Phase3TreeMode() {
  const { data: masteredRadicals } = useQuery({
    queryKey: ['radical-progress', 'mastered'],
    queryFn: () => radicalsService.getRadicalProgress()
      .then(progress => progress.filter(p => p.memorized)),
  });

  return (
    <div className="radical-trees">
      {masteredRadicals.map(radical => (
        <TreeRootNode key={radical.radicalId} radicalId={radical.radicalId} />
      ))}
    </div>
  );
}
```

### Hub Trigger Per Node

```typescript
// Each character node opens Character Detail Hub on click
import { useHubStore } from '@/shared/store/hubStore';

function BranchNode({ character, pinyin, meaning }: BranchNodeProps) {
  const openHub = useHubStore((state) => state.openHub);

  return (
    <div className="branch-node" onClick={() => openHub(character)}>
      <span className="branch-character">{character}</span>
      <span className="branch-subtext">{pinyin} — {meaning}</span>
    </div>
  );
}
```

## Architecture Integration

```
Phase 2 (currentPhase < 3):
  RadicalTreesTab → CharacterListNode × N (flat list)
    → tap character → CharacterDetailHub

Phase 3 (currentPhase >= 3):
  RadicalTreesTab → TreeRootNode × N (mastered radicals)
    → expand → BranchNode × N (characters)
    → tap character → CharacterDetailHub

Data sources:
  - Mastered radicals: GET /api/v1/progression/radical-progress (filter memorized=true)
  - Character mapping: content/radicals/radical-character-mapping.json
  - Hub: useHubStore().openHub(characterGlyph)
```

## Technical Challenges & Solutions

### Challenge: Determining Which Characters Contain a Given Radical

**Problem:** To show "all HSK characters containing radical X" in the Radical Detail Card and Radical Trees, the frontend needs a mapping from radical ID → list of characters. Without Make Me a Hanzi data, this must be built from available data.

**Solution:** Build a `radical-character-mapping.json` that maps each radical ID to an array of HSK character glyphs containing that radical. This can be built from the existing character data if it includes radical decomposition, or compiled manually for the top 20 radicals. The mapping is stored in `content/radicals/` alongside the radical definition files. The mapping is built incrementally — start with top 20 radicals, expand to all 214 as character data is enriched.
