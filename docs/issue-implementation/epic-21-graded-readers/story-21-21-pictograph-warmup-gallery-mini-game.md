# Implementation 21-21: Pictograph Warmup (Gallery + Mini-game)

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-21-pictograph-warmup-gallery-mini-game.md`

## Technical Scope

Add a PictographGallery tab to the Foundations page with oracle bone evolution cards and a Pictograph Match mini-game.

**Files:**

- `apps/frontend/src/features/foundations/components/PictographGallery.tsx` — **NEW**: gallery tab component
- `apps/frontend/src/features/foundations/components/PictographCard.tsx` — **NEW**: individual pictograph card (reuses MnemonicCard layout)
- `apps/frontend/src/features/foundations/components/PictographMatchGame.tsx` — **NEW**: mini-game component
- `apps/frontend/src/features/foundations/components/index.ts` — update: export new components
- `apps/frontend/src/features/foundations/services/pictographGalleryService.ts` — **NEW**: gallery data + mini-game question generation
- `apps/frontend/src/features/foundations/services/__tests__/pictographGalleryService.test.ts` — **NEW**: unit tests
- `apps/frontend/src/features/foundations/components/__stories__/PictographGallery.stories.tsx` — **NEW**: stories
- `apps/frontend/src/features/foundations/components/__stories__/PictographMatchGame.stories.tsx` — **NEW**: stories
- `apps/frontend/src/features/foundations/stores/quizStore.ts` — update: extend for "pictograph-match" quiz type
- `apps/frontend/src/features/foundations/FoundationsPage.tsx` — update: add PictographGallery tab

## Implementation Details

### Pictograph Selection

```typescript
const PICTOGRAPH_SET = [
  { glyph: "日", meaning: "sun", oracleBoneUrl: "/images/oracle-bone/ri.svg" },
  { glyph: "月", meaning: "moon", oracleBoneUrl: "/images/oracle-bone/yue.svg" },
  { glyph: "山", meaning: "mountain", oracleBoneUrl: "/images/oracle-bone/shan.svg" },
  { glyph: "水", meaning: "water", oracleBoneUrl: "/images/oracle-bone/shui.svg" },
  { glyph: "火", meaning: "fire", oracleBoneUrl: "/images/oracle-bone/huo.svg" },
  { glyph: "木", meaning: "tree/wood", oracleBoneUrl: "/images/oracle-bone/mu.svg" },
  { glyph: "田", meaning: "field", oracleBoneUrl: "/images/oracle-bone/tian.svg" },
  { glyph: "口", meaning: "mouth", oracleBoneUrl: "/images/oracle-bone/kou.svg" },
  { glyph: "目", meaning: "eye", oracleBoneUrl: "/images/oracle-bone/mu2.svg" },
  { glyph: "耳", meaning: "ear", oracleBoneUrl: "/images/oracle-bone/er.svg" },
  { glyph: "手", meaning: "hand", oracleBoneUrl: "/images/oracle-bone/shou.svg" },
  { glyph: "足", meaning: "foot", oracleBoneUrl: "/images/oracle-bone/zu.svg" },
  { glyph: "人", meaning: "person", oracleBoneUrl: "/images/oracle-bone/ren.svg" },
  { glyph: "大", meaning: "big", oracleBoneUrl: "/images/oracle-bone/da.svg" },
  { glyph: "女", meaning: "woman", oracleBoneUrl: "/images/oracle-bone/nv.svg" },
  { glyph: "子", meaning: "child", oracleBoneUrl: "/images/oracle-bone/zi.svg" },
  { glyph: "鸟", meaning: "bird", oracleBoneUrl: "/images/oracle-bone/niao.svg" },
  { glyph: "鱼", meaning: "fish", oracleBoneUrl: "/images/oracle-bone/yu.svg" },
  { glyph: "马", meaning: "horse", oracleBoneUrl: "/images/oracle-bone/ma.svg" },
  { glyph: "牛", meaning: "cow", oracleBoneUrl: "/images/oracle-bone/niu.svg" },
];
```

### Gallery Card

Each card shows:

1. Modern glyph (large, top)
2. Classification badge (🖼️ Pictograph from 21.15)
3. Evolution strip: oracle bone → bronze → modern (images or SVG)
4. Original meaning description
5. "Tap to view details" → opens MnemonicCard with pictograph layout (from 21.20)

### Mini-Game

```typescript
interface MatchQuestion {
  oracleBoneImage: string; // URL to oracle bone script SVG
  correctAnswer: string; // modern glyph
  options: string[]; // 4 options: 1 correct + 3 distractors
}
```

10 questions per round, randomized. Scoring:

- Correct answer: +1 point
- Wrong answer: show correct character with evolution explanation
- Score ≥70% required to pass

## Architecture Integration

```
[Story 21.21: Pictograph Warmup]
├── Frontend — features/foundations/
│   ├── FoundationsPage — new PictographGallery tab
│   ├── PictographGallery — gallery view with evolution cards
│   ├── PictographCard — individual card (reuses 21.20 layout)
│   ├── PictographMatchGame — oracle bone matching mini-game
│   └── pictographGalleryService — data + question generation
└── Dependencies
    ├── 21.2 Character.classification — pictograph identification
    ├── 21.15 ClassificationBadge — badge on cards
    ├── 21.20 PictographMnemonicLayout — card layout
    └── PhaseGate model — gallery gating logic
```
