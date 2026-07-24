# Implementation 21-13: Stroke Content Foundation

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-13-stroke-content-foundation.md`

## Technical Scope

Create a structured stroke content file in the content pipeline, update the manifest, and wire the frontend ContentIndexService to load stroke data like other content types.

**Files:**

- `content/strokes/strokes.json` — **NEW**: stroke reference data with categories, types, and order rules
- `content/manifest.json` — update: add stroke entity reference count
- `apps/frontend/src/services/ContentIndexService.ts` — update: add stroke content type loading

## Content Schema

```json
{
  "version": "1.0",
  "categories": [
    {
      "id": "dian",
      "name": "点",
      "pinyin": "diǎn",
      "meaning": "dot",
      "strokeCount": 1,
      "exampleChars": ["主", "州", "为", "头"],
      "orderRules": ["top-first", "center-first"]
    },
    {
      "id": "heng",
      "name": "横",
      "pinyin": "héng",
      "meaning": "horizontal",
      "strokeCount": 1,
      "exampleChars": ["一", "二", "三", "王"],
      "orderRules": ["top-to-bottom", "horizontal-before-vertical"]
    },
    {
      "id": "shu",
      "name": "竖",
      "pinyin": "shù",
      "meaning": "vertical",
      "strokeCount": 1,
      "exampleChars": ["十", "中", "丰", "川"],
      "orderRules": ["left-to-right", "horizontal-before-vertical"]
    },
    {
      "id": "pie",
      "name": "撇",
      "pinyin": "piě",
      "meaning": "left-falling",
      "strokeCount": 1,
      "exampleChars": ["人", "八", "大", "禾"],
      "orderRules": ["top-to-bottom", "left-to-right"]
    },
    {
      "id": "zhe",
      "name": "折",
      "pinyin": "zhé",
      "meaning": "bend",
      "strokeCount": 1,
      "exampleChars": ["口", "日", "田", "目"],
      "orderRules": ["outside-to-inside"]
    }
  ],
  "extendedTypes": [
    { "id": "na", "name": "捺", "pinyin": "nà", "meaning": "right-falling", "baseCategory": "pie" },
    { "id": "ti", "name": "提", "pinyin": "tí", "meaning": "rising", "baseCategory": "heng" },
    { "id": "wan", "name": "弯", "pinyin": "wān", "meaning": "curve", "baseCategory": "zhe" },
    { "id": "gou", "name": "钩", "pinyin": "gōu", "meaning": "hook", "baseCategory": "zhe" },
    { "id": "xie", "name": "斜", "pinyin": "xié", "meaning": "slant", "baseCategory": "pie" },
    {
      "id": "tiao",
      "name": "挑",
      "pinyin": "tiǎo",
      "meaning": "upward-flick",
      "baseCategory": "heng"
    },
    {
      "id": "zhe-gou",
      "name": "折钩",
      "pinyin": "zhé gōu",
      "meaning": "bend-hook",
      "baseCategory": "zhe"
    },
    {
      "id": "wan-gou",
      "name": "弯钩",
      "pinyin": "wān gōu",
      "meaning": "curve-hook",
      "baseCategory": "zhe"
    }
  ],
  "orderRules": [
    {
      "id": "rule-1",
      "name": "Top to Bottom",
      "description": "Write strokes from top to bottom",
      "examples": ["三", "王", "立", "章"]
    },
    {
      "id": "rule-2",
      "name": "Left to Right",
      "description": "Write strokes from left to right",
      "examples": ["川", "州", "林", "好"]
    },
    {
      "id": "rule-3",
      "name": "Horizontal Before Vertical",
      "description": "Write horizontal strokes before vertical ones that cross them",
      "examples": ["十", "丰", "井", "用"]
    },
    {
      "id": "rule-4",
      "name": "Outside Before Inside",
      "description": "Write enclosing strokes before content inside",
      "examples": ["口", "日", "田", "国"]
    },
    {
      "id": "rule-5",
      "name": "Middle Before Sides",
      "description": "Write the center stroke before the side strokes",
      "examples": ["小", "水", "山", "承"]
    }
  ]
}
```

## Implementation Details

### ContentIndexService Update

Add stroke loading to the shared ContentIndexService:

```typescript
// In ContentIndexService — add method
async loadStrokeContent(): Promise<StrokeContent> {
  const data = await fetch('/content/strokes/strokes.json');
  return data.json();
}
```

The service caches strokes.json in memory after first load, following the same pattern as pinyin and tone content loading.

### Manifest Update

Add stroke entity entry to `content/manifest.json`:

```json
{
  "strokes": {
    "path": "strokes/strokes.json",
    "entityCount": 21,
    "description": "Stroke categories (5 PRC), extended types (8), and order rules (5)"
  }
}
```

## Architecture Integration

```
[Story 21.13: Stroke Content Foundation]
├── Content Pipeline
│   ├── content/strokes/strokes.json — structured stroke reference data
│   └── content/manifest.json — updated with stroke entry
└── Frontend
    └── ContentIndexService — loads stroke data, cached in memory
        └── Consumed by: features/foundations/ (StrokesTab)
```

## Technical Challenges & Solutions

```
Problem: Stroke data currently hardcoded in frontend constants — must migrate
         without breaking existing features.
Solution: Create strokes.json with the same schema shape that components already
         consume. ContentIndexService returns the data in the same format.
         Existing components continue to work unchanged — only the data source
         path changes from local const to service.
```
