# Implementation 21-19: Radical Trees — Phonetic Tree Toggle

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-19-radical-trees-phonetic-tree-toggle.md`

## Technical Scope

Add a dual-tree toggle to the Radical Trees feature, creating a new Phonetic Tree view alongside the existing Radical Tree view. This is the largest new story (~4-5d).

**Files:**

- `apps/frontend/src/features/radicals/components/RadicalTreesView.tsx` — update: add toggle switch, route to PhoneticTree
- `apps/frontend/src/features/radicals/components/PhoneticTree.tsx` — **NEW**: phonetic tree component
- `apps/frontend/src/features/radicals/components/PhoneticFamilyNode.tsx` — **NEW**: individual phonetic family node
- `apps/frontend/src/features/radicals/services/phoneticTreeService.ts` — **NEW**: phonetic tree data generation
- `apps/frontend/src/features/radicals/services/__tests__/phoneticTreeService.test.ts` — **NEW**: unit tests
- `apps/frontend/src/features/radicals/stores/treeStore.ts` — update: extend state for tree type (radical/phonetic), phase gating
- `apps/frontend/src/features/radicals/components/__stories__/RadicalTreesView.stories.tsx` — update: stories for both tree views
- `apps/frontend/src/features/radicals/components/__stories__/PhoneticTree.stories.tsx` — **NEW**: stories

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
│   ├── RadicalTreesView — toggle added
│   ├── PhoneticTree — phonetic tree component
│   ├── PhoneticFamilyNode — individual family display
│   └── phoneticTreeService — data aggregation
└── Dependencies
    ├── 21.6 Phonetic Clusters API — cluster membership data
    ├── 21.10 Characters Module API — character detail
    └── 21.15 ClassificationBadge — character node badges
```
