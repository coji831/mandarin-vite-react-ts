# Implementation 19-1: Radicals Browser Structure

**Last Updated:** June 26, 2026

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Key Commit**: 327fa7e
- **Completion Date**: 2026-06-26

## Technical Scope

Create the `features/radicals/` feature folder with grid-based radical browser, content loading from `content/radicals/*.json`, filter/search/sort/top-20 toggle, and replace the `/learn/radicals` placeholder route component.

**Files to create:**

- `apps/frontend/src/features/radicals/components/RadicalsPage.tsx` — page orchestration with FilterBar + RadicalGrid + RadicalTreesTab
- `apps/frontend/src/features/radicals/components/RadicalGrid.tsx` — card grid
- `apps/frontend/src/features/radicals/components/RadicalCard.tsx` — individual card (glyph, pinyin, meaning, stroke count, ★ badge)
- `apps/frontend/src/features/radicals/components/FilterBar.tsx` — SearchInput, StrokeCountFilter, Top20Toggle, SortSelector
- `apps/frontend/src/features/radicals/hooks/useRadicals.ts` — content loading + filter/sort logic
- `apps/frontend/src/features/radicals/stores/radicalsStore.ts` — zustand store (selected radical, filter state)
- `apps/frontend/src/features/radicals/services/radicalsService.ts` — content data API calls
- `apps/frontend/src/features/radicals/types/index.ts` — RadicalData, RadicalFilter, SortOption types
- `apps/frontend/src/features/radicals/utils/radicalDataUtils.ts` — content parsing, filtering, sorting helpers
- `apps/frontend/src/features/radicals/index.ts` — barrel exports

**Files to modify:**

- `apps/frontend/src/router/LearnRoutes.tsx` — replace ContentPlaceholderPage with RadicalsPage
- `content/manifest.json` — add radicals section entry
- `content/radicals/rad_*.json` — top 20 radical data files (created in this story)

## Implementation Details

### Content Loading Pattern

```typescript
// Use the existing content manifest pattern:
// 1. Fetch content/manifest.json → get radicals files list
// 2. Load aggregated radicals-index.json (build artifact)
// 3. Fallback: load individual files if index unavailable

async function loadRadicals(): Promise<RadicalData[]> {
  const manifest = await fetch("/content/manifest.json").then((r) => r.json());
  const radicalFiles = manifest.radicals.files;
  // Load aggregated index for performance
  const index = await fetch("/content/radicals-index.json").then((r) => r.json());
  return index.radicals;
}
```

### Grid Rendering

```typescript
// RadicalGrid renders a responsive grid of RadicalCard components
// CSS: CSS Grid with auto-fill, minmax(140px, 1fr) for responsive columns
function RadicalGrid({ radicals, onSelect }: RadicalGridProps) {
  return (
    <div className="radical-grid">
      {radicals.map((radical) => (
        <RadicalCard
          key={radical.id}
          radical={radical}
          onClick={() => onSelect(radical)}
        />
      ))}
    </div>
  );
}
```

### Filter Logic

```typescript
// Filtering pipeline applied in useRadicals hook:
// 1. Search: filter by pinyin, meaning, or glyph (case-insensitive substring match)
// 2. Stroke count: filter by exact stroke count or "17+"
// 3. Top 20 toggle: filter by is_recommended === true
// 4. Sort: by stroke count asc/desc, kangxi_index, or meaning alphabetically
```

### Content JSON Schema

**`content/radicals/rad_0001.json` (example):**

```json
{
  "id": "rad_0001",
  "glyph": "一",
  "alternate_glyphs": [],
  "name_pinyin": "yī",
  "name_chinese": "一",
  "meaning": "one / horizontal stroke",
  "stroke_count": 1,
  "is_recommended": true,
  "kangxi_index": 1,
  "metadata": {
    "frequency_rank": 1,
    "hsk_characters": ["一", "七", "三", "上", "下", "不", "世", "东", "丝", "两"],
    "notes": "Also functions as the horizontal stroke (横 héng)"
  }
}
```

### Content Manifest Entry

```json
{
  "radicals": {
    "description": "Kangxi radical reference data",
    "files": [
      "radicals/rad_0001.json",
      "radicals/rad_0002.json",
      "radicals/rad_0003.json",
      ...
    ],
    "count": 214,
    "top20": ["rad_0001", "rad_0002", "rad_0003", ...]
  }
}
```

## Architecture Integration

```
RadicalsPage (route: /learn/radicals, replaces ContentPlaceholderPage)
  ├── FilterBar (search, stroke count, top-20 toggle, sort)
  ├── RadicalGrid → RadicalCard × N
  └── RadicalTreesTab (Phase 2 browse + Phase 3 tree)

Loads content via: content/manifest.json → content/radicals/rad_*.json
Phase gating via: usePhaseGate() from shared/hooks/
```

The radicals tab already exists in LearnLayout — this story wires it with real content. The route path and tab definition remain unchanged.

## Technical Challenges & Solutions

### Challenge: Radical Content File Organization vs Performance

**Problem:** Loading 214 individual JSON files on page load is impractical. However, a single `radicals.json` with all data is a large file (estimated 200-300KB). Need to balance granularity (easy to edit/add) with load performance.

**Root Cause:** Individual files per radical are clean for content management but cause N HTTP requests. A single file is faster to load but harder to maintain.

**Solution:** Hybrid approach — individual files in `content/radicals/rad_*.json` for content editing, but the build process generates an optimized `radicals-index.json` that aggregates all radicals into a single file for fast frontend loading. The individual files remain as the source of truth. The content manifest tracks both the individual files and the aggregated index. Frontend loads the aggregated index on page load and falls back to individual files if needed.
