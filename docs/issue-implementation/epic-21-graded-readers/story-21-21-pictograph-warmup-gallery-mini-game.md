# Implementation 21-21: Pictograph Warmup (Gallery + Mini-game)

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-21-pictograph-warmup-gallery-mini-game.md`
>
> **Last Update:** July 31, 2026

## Technical Scope

Add a PictographGallery tab to the Foundations page with oracle bone evolution cards and a Pictograph Match mini-game.

**Revised architecture notes (post-architectural review):**

- PictographCard is **NOT created** — `MnemonicCard` with `classification="pictograph"` is used directly
- Mini-game state uses a **new local store** (`pictographMatchStore`), NOT extending `quizStore`
- Tab is added **locally** in `FoundationsPage.tsx`, NOT by modifying `FOUNDATION_SECTIONS`
- Oracle bone SVGs are **NOT included** for MVP — text-only etymology descriptions
- This mini-game is a **standalone client-side exception** to the quiz strategy pattern

**Files:**

- `apps/frontend/src/features/foundations/components/PictographGallery.tsx` — **NEW**: gallery tab component (uses `MnemonicCard` directly with `classification="pictograph"`)
- `apps/frontend/src/features/foundations/components/PictographMatchGame.tsx` — **NEW**: mini-game component
- `apps/frontend/src/features/foundations/components/index.ts` — update: export new components
- `apps/frontend/src/features/foundations/services/pictographGalleryService.ts` — **NEW**: gallery data + mini-game question generation
- `apps/frontend/src/features/foundations/services/__tests__/pictographGalleryService.test.ts` — **NEW**: unit tests
- `apps/frontend/src/features/foundations/stores/pictographMatchStore.ts` — **NEW**: mini-game local state store (questions, currentQuestion, score, isComplete)
- `apps/frontend/src/pages/learn/foundations/FoundationsPage.tsx` — update: add PictographGallery tab (local tab, not in `FOUNDATION_SECTIONS`)

**REMOVED from original plan:**

- ~~`PictographCard.tsx`~~ — NOT created; `MnemonicCard` is used directly
- ~~`features/foundations/stores/quizStore.ts` extension~~ — NOT modified; new `pictographMatchStore.ts` instead
- ~~`/images/oracle-bone/*.svg` assets~~ — NOT created; text-only descriptions for MVP
- ~~`__stories__/PictographGallery.stories.tsx`~~ — NOT needed (feature-level stories prohibited per storybook-production-alignment.instructions.md)
- ~~`__stories__/PictographMatchGame.stories.tsx`~~ — NOT needed (feature-level stories prohibited)

## Implementation Details

### Pictograph Selection (MVP — No Image Assets)

```typescript
const PICTOGRAPH_SET = [
  {
    glyph: "日",
    meaning: "sun",
    etymology:
      "Depicts the sun as a circle with a dot in the center; evolved into the modern square form.",
  },
  // ... see full set in the service file
];

// Note: ancientFormUrl (oracle bone images) is a future enhancement.
// The MnemonicCard PictographLayout renders text-only when no image is provided.
// The prop is already designed and ready; data assets are not yet created.
```

### Gallery Card

Each card shows:

1. Modern glyph (large, top)
2. Classification badge (🖼️ Pictograph from 21.15)
3. Etymology description (text — no evolution images for MVP)
4. Original meaning label
5. "Tap to view details" → opens `MnemonicCard` with `PictographLayout` (from 21.20)

### Mini-Game Architecture Note

This mini-game is an **explicit exception** to the quiz strategy pattern defined in `quiz-architecture.instructions.md`:

- **Not API-driven**: Uses hardcoded character data, not backend endpoints
- **Not strategy-registered**: Does not extend `StrategyType` union
- **Not persisted to backend**: Results stored in local Zustand store only
- **Format exception**: Uses description+MCQ format, not pinyin-based quiz format

```typescript
// pictographMatchStore.ts — NEW local store, not extending quizStore
interface MatchQuestion {
  oracleBoneDescription: string; // etymology description of the oracle bone form
  correctAnswer: string; // modern glyph
  options: string[]; // 4 options: 1 correct + 3 distractors
}

interface PictographMatchState {
  questions: MatchQuestion[];
  currentQuestion: number;
  score: number;
  isComplete: boolean;
  startRound: () => void;
  answerQuestion: (answer: string) => void;
  reset: () => void;
}
```

10 questions per round, randomized. Scoring:

- Correct answer: +1 point
- Wrong answer: show correct character with evolution explanation
- Score ≥70% required to pass

### Tab Gating

```typescript
// In FoundationsPage.tsx — local tab extension (NOT modifying FOUNDATION_SECTIONS)
// The PictographGallery tab is added alongside the 4 Phase 1 sections
// but it is NOT a FoundationSection — no backend progress tracking.

import { useFoundationsProgress } from "../../features/foundations/hooks/useFoundationsProgress";

function FoundationsPage() {
  const { progress } = useFoundationsProgress();
  const tonesCompleted = progress?.sections?.tones?.completed ?? false;

  // Tabs: [Pinyin, Tones, Strokes, Animations, PictographGallery (locked/disabled if tones not completed)]
  // The PictographGallery tab is always rendered but disabled when locked.
}
```

Tab gating behavior:

- Tab appears in tab bar at all times
- If Tones section is incomplete: tab label is greyed out with a lock icon (🔒 Pictographs)
- Clicking the locked tab shows a tooltip/message: "Complete the Tones section to unlock Pictographs"
- If Tones section is complete: tab is active and clickable
- No route-level gating — no redirects or `Navigate` components

## Architecture Integration

```
[Story 21.21: Pictograph Warmup]
├── Frontend — features/foundations/
│   ├── FoundationsPage — new PictographGallery tab (local, NOT in FOUNDATION_SECTIONS)
│   ├── PictographGallery — gallery view with evolution cards
│   │   └── uses MnemonicCard with classification="pictograph" (from 21.20)
│   ├── PictographMatchGame — oracle bone matching mini-game (standalone exception)
│   ├── pictographMatchStore — local state store (NOT quizStore)
│   │   └── questions, currentQuestion, score, isComplete (no backend persistence)
│   └── pictographGalleryService — data + question generation
└── Dependencies
    ├── 21.2 Character.classification — pictograph identification
    ├── 21.15 ClassificationBadge — badge on cards
    ├── 21.20 PictographMnemonicLayout — MnemonicCard with PictographLayout
    └── PhaseGate check — gallery tab gating logic (local, not backend PhaseGate model)
```

## What NOT to Change

- ❌ Do NOT modify `FOUNDATION_SECTIONS` or `FoundationSectionId` type in `@mandarin/shared-constants`
- ❌ Do NOT modify backend Prisma schema or services
- ❌ Do NOT create `PictographCard.tsx` — use `MnemonicCard` directly
- ❌ Do NOT extend the quiz feature's store, strategy registry, or `StrategyType` union
- ❌ Do NOT create oracle bone SVG assets (`/images/oracle-bone/*.svg`)
- ❌ Do NOT modify backend quiz controllers or create new backend endpoints
- ❌ Do NOT create `QuizAttempt` records — results are local-only for MVP```
