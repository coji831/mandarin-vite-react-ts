# Implementation Story 19.4: Radical Trees (Phase 3)

**Last Updated:** June 27, 2026
**Status:** Completed
**Key Commit:** `e743d13`

## Technical Scope

Build the RadicalTreesTab component with Phase 2 locked/browse mode and Phase 3 tree visualization (chip picker + expandable tree with character branches), plus character-to-radical mapping data, shared Button variant, utility classes, wireframe audit fixes, and comprehensive testing.

### Files Created

**Radicals Feature — Components (Phase 3 Tree):**

- `apps/frontend/src/features/radicals/components/RadicalTreesTab.tsx` — Main tab component: Phase 2 (locked teaser) or Phase 3 tree visualization. Owns mastered radical loading, chip selection state, search filtering, and delegates to Phase3TreeView. Uses `usePhaseGate` hook for phase detection with dev fallback (defaults to Phase 3 in dev).
- `apps/frontend/src/features/radicals/components/RadicalTreesTab.css` — Layout styles for the tab container, loading skeleton, and locked teaser.
- `apps/frontend/src/features/radicals/components/RadicalTreesTab.test.tsx` — 10 tests covering Phase 2 locked teaser, Phase 3 chip/tree rendering, loading/error states, chip click, search filter, and progress fetch integration.

- `apps/frontend/src/features/radicals/components/Phase3TreeView.tsx` — Phase 3 tree view: search bar + chip picker + separator + selected indicator + single expandable tree root node + tagline. Handles loading, error, and empty states for progress data. Uses shared `Button` component for Retry action.
- `apps/frontend/src/features/radicals/components/Phase3TreeView.css` — Styles for skeleton loader, search bar, separator, selected indicator, and tagline.
- `apps/frontend/src/features/radicals/components/Phase3TreeView.test.tsx` — 7 tests covering all states (loading, error with retry, empty, chips rendered, separator visible, tagline visible).

- `apps/frontend/src/features/radicals/components/RadicalChipPicker.tsx` — Chip-style picker row: horizontal scrollable list of chip buttons with glyph + meaning. Supports keyboard navigation (Enter/Space). Uses `role="tablist"` and `aria-selected` for accessibility.
- `apps/frontend/src/features/radicals/components/RadicalChipPicker.css` — Chip layout: horizontal scroll, selected state with accent border/background, BEM naming.
- `apps/frontend/src/features/radicals/components/RadicalChipPicker.test.tsx` — 6 tests covering chip rendering, selected style, empty array, keyboard navigation, and filtered chips.

- `apps/frontend/src/features/radicals/components/TreeRootNode.tsx` — Phase 3 tree root node: mastered radical with expandable/collapsible character branches. Chevron toggle with `aria-expanded`, smooth CSS transition, character list inside `TreeRootNode__branches--expanded`. Footer with Collapse button and disabled "Generate stories" button (placeholder for Epic 20).
- `apps/frontend/src/features/radicals/components/TreeRootNode.css` — Tree root layout: header grid, chevron rotation animation, branch expand/collapse transition, connector lines via `::before` pseudo-elements on BranchNode children, badge pill, footer actions.
- `apps/frontend/src/features/radicals/components/TreeRootNode.test.tsx` — 8 tests covering rendering, expand/collapse toggle, empty characters, Hub trigger on radical glyph click, collapse button, and disabled generate stories button.

- `apps/frontend/src/features/radicals/components/BranchNode.tsx` — Individual character node: horizontal row with glyph, pinyin, meaning, audio button (SpeechSynthesis), and Hub link. Optional tree connector line via `showConnector` prop. Full keyboard accessibility.
- `apps/frontend/src/features/radicals/components/BranchNode.css` — Branch layout: horizontal flex row, glyph emphasis, audio button, Hub link, connector line via `::before` pseudo-element.
- `apps/frontend/src/features/radicals/components/BranchNode.test.tsx` — 5 tests covering rendering, audio button existence, Hub link, connector class, and keyboard click.

- `apps/frontend/src/features/radicals/components/CharacterListNode.tsx` — Phase 2 character list view: header with radical glyph + meaning + pinyin + count, grid of BranchNode items. Used as the browse mode for Phase 2 but also imported by TreeRootNode for Phase 3.
- `apps/frontend/src/features/radicals/components/CharacterListNode.css` — Header layout, character grid, responsive columns.
- `apps/frontend/src/features/radicals/components/CharacterListNode.test.tsx` — 7 tests covering header rendering, grid items, empty state, count display, and keyboard navigation.

**Data:**

- `content/radicals/radical-character-mapping.json` — Radical ID → array of `{ glyph, pinyin, meaning }` objects. Covers 20 radicals with ~150+ HSK character mappings.

**Services:**

- `apps/frontend/src/features/radicals/services/radicalProgressService.ts` — API service for RadicalProgress CRUD (getRadicalProgress, getRadicalProgressById, upsertRadicalProgress) with typed `RadicalProgressItem` interface.
- `apps/frontend/src/features/radicals/services/radicalProgressService.test.ts` — 4 tests covering service method shapes and API calls.

### Files Modified

**Radicals Feature — Re-exports:**

- `apps/frontend/src/features/radicals/components/index.ts` — Added exports: RadicalTreesTab, Phase3TreeView, RadicalChipPicker, CharacterListNode, TreeRootNode, BranchNode.
- `apps/frontend/src/features/radicals/services/index.ts` — Added radicalProgressService exports.
- `apps/frontend/src/features/radicals/index.ts` — Updated barrel exports for new components and types.

**RadicalsPage — Wireframe Audit Fixes:**

- `apps/frontend/src/pages/learn/RadicalsPage.tsx` — Fixed toggle logic (Browse/Trees mutually exclusive, not independent toggles); fixed ARIA roles (nav, tablist, tab panels); fixed card container to wrap DetailCard; added `useRef` for scroll restoration; passed radicals as prop to RadicalTreesTab.
- `apps/frontend/src/pages/learn/RadicalsPage.css` — Refactored to utility classes + minimal page-specific CSS; removed redundant `.radicals-page__tab-button--active` (now uses `btn--active` utility); fixed BEM naming (`.radicals-page__tab-button--active` → `btn--active`).
- `apps/frontend/src/pages/learn/RadicalsPage.test.tsx` — Updated for new toggle logic, ensured Browse/Trees are mutually exclusive.

**Shared Components:**

- `apps/frontend/src/shared/components/Button/Button.tsx` — Added `"secondary"` variant with dark card styling (used by TreeRootNode footer buttons).

## Implementation Details

### Phase Gate with Dev Fallback

```typescript
// If API fails (null phaseGate), default to Phase 1 in prod, Phase 3 in dev
const defaultPhase = import.meta.env.DEV ? 3 : 1;
const effectivePhase = phaseGate?.currentPhase ?? defaultPhase;
const isPhase3 = effectivePhase >= 3;

// Phase 2: Locked teaser
if (!isPhase3) {
  return (
    <div className="radical-trees-tab">
      <div className="flex-col flex-center p-xl gap-md">
        <span className="font-3xl">🔒</span>
        <p className="text-muted font-lg">Radical Trees</p>
        <p className="text-muted font-sm text-center">
          Master radicals and pass the Phase 2 quiz to unlock tree visualization.
        </p>
      </div>
    </div>
  );
}
```

### RadicalChipPicker — Search + Chip Select

The chip picker shows mastered radicals as selectable chip buttons with glyph and meaning. A search bar filters chips by glyph, meaning, or pinyin. Selection is single-select — clicking a chip selects it and shows its tree.

```typescript
export function RadicalChipPicker({ filteredChips, activeRadicalId, onChipClick }) {
  return (
    <div className="radical-chip-picker" role="tablist" aria-label="Mastered radicals">
      {filteredChips.map((radical) => (
        <button
          className={`radical-chip-picker__chip ${isSelected ? "radical-chip-picker__chip--selected" : ""}`}
          role="tab"
          aria-selected={isSelected}
          onClick={() => onChipClick(radical.id)}
        >
          <span className="font-md">{radical.glyph}</span>
          <span className="font-xs">{radical.meaning}</span>
        </button>
      ))}
    </div>
  );
}
```

### TreeRootNode — Expandable Tree with CSS Transitions

Tree root nodes expand with a smooth animation using `max-height` CSS transitions. The chevron rotates 90 degrees on expand. Character branches have connector lines via `::before` pseudo-elements on BranchNode children.

```typescript
export function TreeRootNode({ radical, characters }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="tree-root-node card-dark">
      <div className="tree-root-node__header">
        <button aria-expanded={isExpanded} onClick={toggleExpand}>
          <span className={`tree-root-node__chevron ${isExpanded ? "--expanded" : ""}`}>▶</span>
        </button>
        {/* Radical glyph + info */}
      </div>
      <div className={`tree-root-node__branches ${isExpanded ? "--expanded" : ""}`}>
        <div className="tree-root-node__branches-inner">
          <div className="tree-root-node__character-column">
            {characters.map(ch => <BranchNode showConnector={true} ... />)}
          </div>
          <div className="tree-root-node__footer">
            <Button variant="secondary" size="sm" onClick={handleCollapse}>🌲 Collapse</Button>
            <Button variant="secondary" size="sm" disabled title="Coming in Epic 20">
              Generate stories for all ▸
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### BranchNode — Audio via SpeechSynthesis

Audio playback uses the Web Speech API (`SpeechSynthesisUtterance`) with zh-CN language and Chinese voice preference. No external audio service dependency.

```typescript
const handlePlayAudio = useCallback((e) => {
  e.stopPropagation();
  const utterance = new SpeechSynthesisUtterance(character);
  utterance.lang = "zh-CN";
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find((v) => v.lang.startsWith("zh"));
  if (zhVoice) utterance.voice = zhVoice;
  window.speechSynthesis.speak(utterance);
}, [character]);
```

## Architecture Integration

```
RadicalsPage (route: /learn/radicals)
  └── Tabs: [Browse] [Trees] ← mutually exclusive, page-level toggle
        ├── Browse tab → RadicalGrid → RadicalDetailCard → ExampleCharGrid
        └── Trees tab → RadicalTreesTab
              ├── Phase 2 (currentPhase < 3): Locked teaser
              └── Phase 3 (currentPhase >= 3):
                    └── Phase3TreeView
                          ├── Search bar (filters mastered radicals)
                          ├── RadicalChipPicker (tablist, single-select chips)
                          ├── Separator + Selected indicator
                          └── TreeRootNode (expandable tree root)
                                ├── Radical header (glyph + meaning + pinyin)
                                ├── BranchNode × N (character nodes)
                                │     ├── Glyph → CharacterDetailHub
                                │     ├── Audio → SpeechSynthesis
                                │     └── Hub link → CharacterDetailHub
                                └── Footer (Collapse + Generate stories placeholder)

Data sources:
  - Radical data: content/radicals/rad_*.json (loaded via useRadicals hook)
  - Mastered radicals: radicalProgressService.getRadicalProgress() → filter memorized=true
  - Character mapping: radical.metadata.hsk_characters (from RadicalData type)
  - Phase gate: usePhaseGate() hook (dev fallback defaults to Phase 3 in dev)
```

## Technical Challenges & Solutions

### Challenge 1: Wireframe Audit — Toggle Logic Was Wrong

**Problem:** The browse/trees toggle was implemented as independent toggles (each could be active simultaneously), violating the wireframe spec which required mutually exclusive selection — only one tab at a time.

**Solution:** Replaced independent `isBrowseVisible` / `isTreesVisible` booleans with a single `activeTab` state (`"browse" | "trees"`). The tab buttons use `aria-selected` with a shared utility class `btn--active` for the selected state. This ensures only one tab is active at a time and simplifies the rendering logic.

### Challenge 2: CSS File Placement Rule

**Problem:** The project convention requires one CSS file per component (no `.module.css` or single global file), but several components were missing their CSS file or were importing styles from unrelated files.

**Solution:** Created dedicated CSS files for each new component:
- `RadicalTreesTab.css` — Tab-level layout, loading skeleton, locked teaser
- `Phase3TreeView.css` — Search bar, skeleton, separator, selected indicator, tagline
- `RadicalChipPicker.css` — Chip layout, horizontal scroll, selected state
- `TreeRootNode.css` — Root header, chevron animation, branch transitions, connector lines, footer
- `BranchNode.css` — Branch layout, audio button, Hub link, connector line
- `CharacterListNode.css` — Header, character grid, responsive columns

Applied BEM naming consistently (`component__element--modifier`).

### Challenge 3: Utility Class Adoption for RadicalsPage

**Problem:** The existing `RadicalsPage.css` used hardcoded values for spacing, colors, and typography instead of the project's utility class system. Page-specific CSS was not minimal.

**Solution:** Refactored `RadicalsPage.css` to use utility classes from `globals.css` (`.flex-col`, `.flex-center`, `.gap-md`, `.p-xl`, `.text-muted`, `.font-sm`, `.btn--active`, etc.) and kept only truly page-specific styles (tab layout grid, browse/trees panel sizing). This aligns with the project's CSS conventions.

### Challenge 4: BEM Naming Standards

**Problem:** Some existing CSS used non-standard naming (e.g., `.radicals-page__tab-button--active` combining element and modifier with the same separator).

**Solution:** Standardized to strict BEM: `block__element--modifier`. The tab active state was replaced with the utility class `btn--active` (Button block, `--active` modifier), removing the page-specific override entirely.

### Challenge 5: Determining Which Characters Contain a Given Radical

**Problem:** To show characters for each radical in the trees, the frontend needs a radical ID → character glyph mapping. Without Make Me a Hanzi data, this had to be built manually.

**Solution:** Built `radical-character-mapping.json` mapping each radical ID (20 radicals) to arrays of `{ glyph, pinyin, meaning }` objects (~150+ total character mappings). The mapping is loaded as part of the radical's `metadata.hsk_characters` field in the `RadicalData` type. This can be expanded incrementally as more radicals are added.

## Testing Implementation

Total: **47 tests** across 6 test files (for Story 19.4-specific components).

| Test File                                    | Tests | Coverage                                                                            |
| -------------------------------------------- | ----- | ----------------------------------------------------------------------------------- |
| `RadicalTreesTab.test.tsx`                   | 10    | Phase 2 locked, Phase 3 chip/tree rendering, loading/error states, chip click, search filter, progress fetch |
| `Phase3TreeView.test.tsx`                    | 7     | Loading/error/empty states, chips rendered, separator, tagline                       |
| `RadicalChipPicker.test.tsx`                 | 6     | Chip rendering, selected style, empty array, keyboard nav, filtered chips            |
| `TreeRootNode.test.tsx`                      | 8     | Rendering, expand/collapse, empty characters, Hub trigger, collapse button, disabled button |
| `BranchNode.test.tsx`                        | 5     | Rendering, audio button, Hub link, connector, keyboard click                          |
| `CharacterListNode.test.tsx`                 | 7     | Header, grid items, empty state, count display, keyboard nav                          |
| `radicalProgressService.test.ts`             | 4     | Service method shapes and API calls                                                   |

### Key edge cases tested

- **RadicalTreesTab:** Dev fallback (Phase 3 in dev, Phase 1 in prod); empty mastered radicals shows empty state; progress fetch error shows retry button
- **Phase3TreeView:** Loading skeleton visible during progress fetch; error state with retry via shared Button; empty mastered state shows instructional message
- **RadicalChipPicker:** Empty filteredChips renders nothing; keyboard Enter/Space triggers selection
- **TreeRootNode:** Empty characters array shows "No characters mapped" fallback; expand/collapse toggles correctly; radical glyph click opens Hub
- **BranchNode:** Audio button renders with correct aria-label; Hub link renders; connector class applied when `showConnector=true`

## Acceptance Criteria Checklist

- [x] Phase 2: Locked teaser shown when `currentPhase < 3` (dev fallback defaults to Phase 3)
- [x] Phase 3: Chip picker shows mastered radicals with search filter
- [x] Phase 3: Single-select chip with selected indicator
- [x] Phase 3: Separator line between chips and tree
- [x] Phase 3: Expandable tree root node with smooth CSS transition
- [x] Phase 3: Character branches with connector lines via CSS pseudo-elements
- [x] Phase 3: Audio playback per character node via SpeechSynthesis
- [x] Phase 3: Hub link per character node opens CharacterDetailHub
- [x] Phase 3: Collapse button and disabled "Generate stories" button in tree footer
- [x] Phase 3: Tagline "Learning through recognition — no testing. Browse freely."
- [x] Wireframe fix: Browse/Trees toggle is mutually exclusive (single `activeTab` state)
- [x] Wireframe fix: Card container wraps DetailCard correctly
- [x] Wireframe fix: ARIA roles (nav, tablist, tab panels) on page
- [x] CSS: One CSS file per component with BEM naming
- [x] CSS: Utility classes from globals.css instead of hardcoded values
- [x] Shared: Button component has `"secondary"` variant for dark card context
- [x] Data: radical-character-mapping.json covers 20 radicals
- [x] Tests: 47 tests across 6 test files for Story 19.4 components

## Related Files

- [Epic 19 Implementation README](../README.md)
- [Story 19.4 BR](../../../business-requirements/epic-19-radicals/story-19-4-radical-trees.md)
- [component-decomposition skill](../../../.github/skills/component-decomposition/SKILL.md)
- [frontend-css-styling instructions](../../../.github/instructions/frontend-css-styling.instructions.md)
