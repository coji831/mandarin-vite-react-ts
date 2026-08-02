# Implementation 21-19: Radical Trees — Phonetic Tree Toggle

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-19-radical-trees-phonetic-tree-toggle.md`
> **Last Updated:** 2026-08-01
> **Status:** ✅ Implemented

## Technical Scope

Add a dual-tree toggle to the Radical Trees feature, creating a new Phonetic Tree view alongside the existing Radical Tree view. This is the largest new story (~4-5d).

**Files:**

- `apps/frontend/src/features/radicals/components/RadicalTreesTab.tsx` — update: dual-tree toggle (Radical↔Phonetic), hosts both tree views
- `apps/frontend/src/features/radicals/components/PhoneticTreeView.tsx` — **NEW**: phonetic tree view (phase-gated, Phase 2 preview / Phase 3 full)
- `apps/frontend/src/features/radicals/components/PhoneticFamilyNode.tsx` — **NEW**: expandable phonetic family node with async classification enrichment
- `apps/frontend/src/features/radicals/components/TreeRootNode.tsx` — **NEW**: shared tree root node
- `apps/frontend/src/features/radicals/components/BranchNode.tsx` — **NEW**: shared tree branch node
- `apps/frontend/src/features/radicals/services/phoneticTreeService.ts` — **NEW**: phonetic tree data generation + member enrichment
- `apps/frontend/src/features/radicals/services/__tests__/phoneticTreeService.test.ts` — **NEW**: unit tests

## Implementation Details

### Tree Toggle Component

```typescript
interface TreeToggleProps {
  activeView: "radical" | "phonetic";
  onChange: (view: "radical" | "phonetic") => void;
  isPhase3: boolean; // determines whether full expansion is available
}
```

### Phonetic Tree Layout

```
[Toggle: Radical Tree | Phonetic Tree]

[If Phonetic Tree selected]

Phonetic Families (Phase 2 Preview — showing top 10 of ~100+)

▼ 青 (qīng) — "blue/green" — 4 characters
   ├── 清 (qīng) — clear
   ├── 情 (qíng) — feeling
   ├── 请 (qǐng) — request
   └── 晴 (qíng) — clear (weather)

▼ 包 (bāo) — "wrap" — 4 characters
   ├── 抱 (bào) — to hug
   ├── 跑 (pǎo) — to run
   ├── 炮 (pào) — cannon
   └── 泡 (pào) — bubble
```

### Phase Gating Logic

```typescript
async function loadPhoneticTree(userPhase: number): Promise<PhoneticFamily[]> {
  const allFamilies = await phoneticTreeService.getPhoneticFamilies();

  if (userPhase < 3) {
    // Phase 2: show only top 10 families by character count
    return allFamilies.sort((a, b) => b.charCount - a.charCount).slice(0, 10);
  }

  // Phase 3+: show all ~100+ families
  return allFamilies;
}
```

### Data Sources

- Phonetic cluster membership: `GET /api/v1/phonetic-clusters` (from 21.6)
- Character detail: `GET /api/v1/characters/:glyph` (from 21.10)
- Classification badges: `ClassificationBadge` component (from 21.15)

## Architecture Integration

```
[Story 21.19: Phonetic Tree Toggle]
├── Frontend — features/radicals/
│   ├── RadicalTreesTab — dual-tree toggle (Radical↔Phonetic)
│   ├── PhoneticTreeView — phonetic tree view (phase-gated)
│   ├── PhoneticFamilyNode — expandable family node (async enrichment)
│   ├── TreeRootNode / BranchNode — shared tree nodes
│   └── phoneticTreeService — data aggregation + enrichment
└── Dependencies
    ├── 21.6 Phonetic Clusters API — cluster membership data
    ├── 21.10 Characters Module API — character detail (classification)
    └── 21.15 ClassificationBadge — character node badges
```

## Technical Challenges & Solutions

### Expanded Family Container Clipping

**Problem:** When a phonetic family node expanded, its member list was clipped — the node container collapsed to header height instead of growing with its content.

**Root Cause:** The expanded node container had `flex-shrink` behavior that let it collapse to the header height, so long member lists overflowed and were cut off.

**Solution:** Give the expanded phonetic family node container `flex-shrink: 0` so it grows to match its content instead of collapsing to header height. Make `.radical-trees-tab` the single scroll container for all tree items (`flex: 1; min-height: 0; overflow-y: auto`) per the grid-wrapper scroll-chain contract, replacing the hardcoded `max-height: 600px` nested scroll.

### Async Classification Enrichment

**Problem:** Members from the Phonetic Clusters API (Story 21.6) lack `classification`, but fetching it per glyph from the Characters API (Story 21.10) on render would stall the tree.

**Root Cause:** Classification is only present on the per-character detail endpoint; the cluster membership endpoint returns members without it.

**Solution:** Lazy per-node enrichment in `PhoneticFamilyNode` — `displayFamily = enrichedFamily ?? family` with an `enrichmentRef` guard so enrichment runs once on first expand, per-glyph `Promise.all` fetches, and a silent `.catch()` that falls back to base data. Base display data never blocks render. (See `docs/knowledge-base/practices/async-progressive-enrichment.md`.)

## Testing Implementation

- `BranchNode.test.tsx`, `TreeRootNode.test.tsx`, `RadicalTreesTab.test.tsx` — component tests for tree nodes/tab
- `phoneticTreeService.test.ts` — data generation + enrichment unit tests
- Storybook stories in `RadicalsPageFull.stories.tsx` — Loading / Error / Empty / Trees / Phonetic Tree (Phase 2 & 3), with per-story `beforeEach` seeding `localStorage.treeMode` for determinism
- MSW handlers for phase-gate, radical-progress, radicals, and phonetic-cluster endpoints (`.storybook/msw-handlers.ts`)

### Doc Truth-Check (Verify Against Code)
- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
