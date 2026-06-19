# Epic 18: Foundations — Implementation

**BR Reference:** `docs/business-requirements/epic-18-foundations/README.md`
**Last Updated:** June 19, 2026

---

## Epic Summary

**Goal:** Build Phase 1 of the adult Mandarin learning roadmap — interactive pinyin reference, tone training, stroke order animations, the Character Detail Hub overlay, and an audio-to-type gate quiz — with backend persistence for progress tracking and phase gating.

**Key Points:**

- Static JSON reference data in `apps/frontend/public/data/foundations/` — pinyin initials/finals grid, tone definitions, stroke reference, tone change rules
- Hanzi Writer npm library for SVG-based stroke order animations with full playback controls
- Character Detail Hub as a shared React portal overlay — minimal Phase 1 variant with character, pinyin, audio, stroke animation, Save to Review
- New `progression` backend module with Prisma models FoundationProgress, QuizAttempt, PhaseGate and corresponding REST API endpoints
- Audio-to-Type quiz with 20 randomized questions, instant feedback, category breakdown, ≥90% pass threshold
- Reuse of existing AudioService (Google Cloud TTS via backend) for all audio playback with browser TTS fallback
- Route redirect from old `/learn/flashcards` → `/learn/foundations` for backward compatibility
- Updated 5-item global navigation (Dashboard, Learn, Practices, Library, Progress)

**Status:** In Progress (Story 18.5 Completed)

**Last Update:** June 19, 2026

## Technical Overview

This epic implements Phase 1 of the learning roadmap (The Blueprint). It touches both frontend and backend:

**Frontend:** New `foundations` feature folder, new `CharacterDetailHub` shared component, 4-tab layout under `/learn/foundations`, updated LearnLayout with phase-gated TabBar, updated router with new routes and redirects, Audio-to-Type quiz page, global nav update.

**Backend:** New `progression` module under `apps/backend/src/modules/progression/` with:

- Prisma models: FoundationProgress, QuizAttempt, PhaseGate
- REST API: CRUD for FoundationProgress, POST/GET for QuizAttempt, GET/PUT for PhaseGate
- Follows existing module pattern: api/ (controller + routes), domain/ (entities + interfaces), repositories/, services/, index.js
- All endpoints authenticated via existing `authenticateToken` middleware

**Data:** Static JSON files for reference content. No backend dependency for content serving.

## Architecture Decisions

1. **Static JSON for reference content** — Pinyin, tones, and stroke data are fixed and never change. JSON files in `apps/frontend/public/data/foundations/` eliminate backend latency. Schema validated at build time via TypeScript type assertions.

2. **Hanzi Writer for stroke animations** — MIT-licensed npm library (`hanzi-writer`) handles 9000+ characters with built-in SVG animation. Custom React wrapper provides play/pause/step/speed controls. ~200KB bundle size, lazy-loaded.

3. **Character Detail Hub as React portal** — Portal renders overlay into `document.body`, slides up from bottom with backdrop dim. State managed via lightweight zustand store (`hubStore`). No route change — background context preserved. Phase-gated sections via conditional rendering based on user's `PhaseGate.currentPhase`.

4. **New `progression` backend module** — Separate from existing `progress` module (which handles word-level SM-2 SRS). New module handles phase gating, foundation completion tracking, and quiz attempts. Follows existing Clean Architecture pattern: controller → service → repository.

5. **Standalone quiz (not extending QuizSession)** — Phase 1 audio-to-type quiz has fundamentally different question structure (audio → pinyin → tone selection) than existing vocabulary quiz. Building standalone avoids coupling to QuizSession's complex state machine while reusing patterns (progress bar, result breakdown).

6. **Backend API for progress persistence** — FoundationProgress, QuizAttempt, and PhaseGate stored in PostgreSQL via Prisma. Enables cross-device sync. Follows existing auth pattern (userId derived from JWT token).

7. **Shared constants for section definitions** — Foundation section IDs (pinyin, tones, strokes, animations) defined in `packages/shared-constants/src/foundations.ts` as `FOUNDATION_SECTIONS`. Imported by both frontend and backend. Backend uses them to validate progress submissions and auto-initialize records. Pattern extends to future epics (radical sections, grammar levels).

## Technical Implementation

### Architecture

```
Frontend (apps/frontend)                                  Backend (apps/backend)
─────────────────────────                                 ──────────────────────

apps/frontend/src/features/foundations/                   apps/backend/src/modules/progression/
├── components/                                            ├── api/
│   ├── FoundationsPage.tsx    ← 4-tab layout             │   ├── ProgressionController.js
│   ├── PinyinTab.tsx          ← initials/finals grid     │   └── progressionRoutes.js
│   ├── TonesTab.tsx           ← contours + drills       ├── domain/
│   ├── StrokeReferenceTab.tsx ← 8 basic strokes + rules │   ├── entities/
│   └── StrokeAnimTab.tsx      ← Hanzi Writer input      │   │   ├── FoundationProgress.js
│   └── Phase1QuizPage.tsx     ← Audio-to-Type quiz       │   │   ├── QuizAttempt.js
├── hooks/                                                 │   │   └── PhaseGate.js
│   ├── useFoundationsProgress.ts                         │   └── interfaces/
│   └── usePhaseGate.ts                                    │       └── IProgressionRepository.js
├── services/                                             ├── repositories/
│   └── foundationsService.ts     ← API calls              │   └── ProgressionRepository.js
├── stores/                                               ├── services/
│   └── foundationsStore.ts       ← Context + reducer      │   └── ProgressionService.js
├── types/                                                ├── index.js
│   └── index.ts                                          └── __tests__/
├── utils/
│   └── pinyinUtils.ts           ← tone coloring, combos
└── index.ts

apps/frontend/src/shared/components/CharacterDetailHub/
├── CharacterDetailHub.tsx       ← Portal overlay
├── HubHeader.tsx                ← Character hero + pinyin + audio
├── StrokeSection.tsx            ← Inline Hanzi Writer
├── HubActions.tsx               ← Save to Review / Mark Learned
└── hubStore.ts                  ← zustand store (isOpen, characterId, position)

apps/frontend/public/data/foundations/
├── pinyin.json                  ← initials[], finals[], combinations[]
├── tones.json                   ← tone definitions, pair drills, change rules
└── strokes.json                 ← 8 basic strokes, 4 rules, suggested chars
```

### Data Flow

```
1. Pinyin Tab:
   User clicks initial "b" → grid highlights + plays "b" via AudioService
   User clicks final "a" → grid shows b+a = ba in 5 tones → click cell → play tone

2. Stroke Animations:
   User types "水" → Search → hanzi-writer renders SVG animation
   Play/Pause/Step/Speed controls → hanzi-writer API methods
   Click character → CharacterDetailHub opens via hubStore

3. Audio-to-Type Quiz:
   User clicks Start Quiz → POST /api/v1/progression/quiz-attempts (init)
   Question loads → AudioService.playWordAudio({chinese}) → user types pinyin → selects tone
   Submit → POST /api/v1/progression/quiz-attempts/:id/answers
   After 20 questions → PUT /api/v1/progression/quiz-attempts/:id/complete
   If score ≥90% → GET/PUT /api/v1/progression/phase-gate (updates currentPhase to 2)
```

### Shared Constants Package

```typescript
// packages/shared-constants/src/foundations.ts
export const FOUNDATION_SECTIONS = ["pinyin", "tones", "strokes", "animations"] as const;
export type FoundationSectionId = (typeof FOUNDATION_SECTIONS)[number];
```

This is the single source of truth. Both frontend and backend import from `@mandarin/shared-constants`:

- **Backend**: Validates `PUT /foundation-progress/:sectionId` — rejects unknown sectionIds with 400. Auto-initializes records on first `GET` using the array.
- **Frontend**: Progress bar reads `FOUNDATION_SECTIONS.length` for total count. Service layer has typed `FoundationSectionId` for type safety.

### API Endpoints

All endpoints under `/api/v1/progression/`, all require `authenticateToken` middleware.

**FoundationProgress**

```
GET /api/v1/progression/foundation-progress
  → Returns user's progress across all foundation sections
  → Auto-initializes 4 records (pinyin, tones, strokes, animations) if none exist
  → Uses FOUNDATION_SECTIONS from @mandarin/shared-constants for initialization and validation
  Response: [{ sectionId: "pinyin", completed: true, completedAt: "..." }, ...]

PUT /api/v1/progression/foundation-progress/:sectionId
  → Mark a foundation section as completed
  → Validates sectionId against FOUNDATION_SECTIONS constant (400 if invalid)
  Body: { completed: true }
  Response: { sectionId, completed, completedAt }

GET /api/v1/progression/foundation-progress/summary
  → Returns aggregate: { totalSections: 4, completedSections: 3, completionRate: 0.75 }
```

**QuizAttempt**

```
POST /api/v1/progression/quiz-attempts
  → Initialize a new quiz attempt
  Body: { quizType: "audio-to-type" }
  Response: { id, quizType, totalQuestions: 20, startedAt }

POST /api/v1/progression/quiz-attempts/:id/answers
  → Submit answer for one question
  Body: { pinyinInput: "mā", selectedTone: 1, correctTone: 1, correctPinyin: "mā" }
  Response: { questionIndex, correct, correctAnswer: { pinyin, tone } }

PUT /api/v1/progression/quiz-attempts/:id/complete
  → Complete the quiz and calculate results
  Response: { totalScore: 18, maxScore: 20, passed: true, accuracy: 0.9,
              categoryBreakdown: { pinyin: 0.95, tones: 0.85, pairs: 0.8, rules: 1.0 } }

GET /api/v1/progression/quiz-attempts
  → List user's quiz history
  Response: [{ id, quizType, totalScore, maxScore, passed, createdAt }, ...]
```

**PhaseGate**

```
GET /api/v1/progression/phase-gate
  → Get user's current phase and gate status
  Response: { currentPhase: 1, phase1Passed: false, phase2Passed: false, ... }

PUT /api/v1/progression/phase-gate
  → Update phase gate (e.g., after passing quiz)
  Body: { phase: 2, passed: true, gateCriteria: "quiz" }
  Response: { currentPhase: 2, phase2Passed: true, gateCriteria: "quiz" }
```

### Component Relationships

```
FoundationsPage (route: /learn/foundations)
  ├── TabBar [Pinyin | Tones | Strokes | Animations]
  ├── ProgressBar (FoundationProgress completion: "X of 4 sections")
  │
  ├── PinyinTab (route: /learn/foundations#pinyin)
  │   ├── InitialsGrid (21 initials, clickable → TTS)
  │   ├── FinalsGrid (39 finals, clickable → TTS)
  │   └── CombinationDisplay (selected initial+final → 5 tones)
  │       └── ToneCell × 5 (tone-colored, clickable → TTS)
  │
  ├── TonesTab (route: /learn/foundations#tones)
  │   ├── ToneContourCard × 4 (visual pitch line + audio)
  │   ├── TonePairDrills (common 2-syllable combos → TTS)
  │   └── ToneChangeRules (3rd sandhi, 一, 不 — reference cards + audio)
  │
  ├── StrokeReferenceTab (route: /learn/foundations#strokes)
  │   ├── BasicStrokesGrid (8 strokes: glyph + pinyin + English)
  │   └── StrokeRulesCard (4 rules with visual examples: 三川日回)
  │
  └── StrokeAnimTab (route: /learn/foundations#animations)
      ├── CharacterSearchInput (text input → search)
      ├── HanziWriterCanvas (SVG animation with controls)
      │   └── PlayPauseStepControls (play, pause, step forward/back, speed slider)
      └── SuggestedCharacters (一丨人大口水火木日月 → quick select)

CharacterDetailHub (shared portal, triggered from StrokeAnimTab + future epics)
  ├── Backdrop (dimmed, click to close)
  ├── CharacterHero (large 64-72px char + pinyin + audio button)
  ├── StrokeSection (inline Hanzi Writer animation)
  ├── HubActions (Save to Review / Mark Learned buttons)
  └── [Future: RadicalDec, Mnemonic, Examples — phase-gated]

Phase1QuizPage (route: /practices/quiz?type=audio-to-type)
  ├── QuizHeader (question X of 20, timer)
  ├── AudioPlayer (play/replay audio button)
  ├── PinyinInput (text input for pinyin typing)
  ├── ToneSelector (5 buttons: ˉ1st ˊ2nd ˇ3rd ˋ4th ·0)
  ├── FeedbackDisplay (correct/incorrect with correct answer)
  ├── ProgressBar (current score vs 90% target)
  └── ResultsScreen (on completion: score, pass/fail, category breakdown)
```

### Prisma Models to Add (in `apps/backend/prisma/schema.prisma`)

```prisma
model FoundationProgress {
  id            String   @id @default(uuid())
  userId        String
  sectionId     String   // "pinyin" | "tones" | "strokes" | "animations"
  completed     Boolean  @default(false)
  completedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, sectionId])
  @@index([userId])
}

model QuizAttempt {
  id         String   @id @default(uuid())
  userId     String
  quizType   String   // "audio-to-type"
  totalScore Int      @default(0)
  maxScore   Int      @default(20)
  passed     Boolean  @default(false)
  createdAt  DateTime @default(now())
  completedAt DateTime?

  @@index([userId, quizType])
  @@index([userId])
}

model PhaseGate {
  id                  String   @id @default(uuid())
  userId              String   @unique
  currentPhase        Int      @default(1)
  phase1Passed        Boolean  @default(false)
  phase2Passed        Boolean  @default(false)
  phase3Passed        Boolean  @default(false)
  phase4Unlocked      Boolean  @default(false)
  gateCriteria        String?  // "quiz" | "retention" | "both"
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([userId])
}
```

### Static JSON Schemas

**pinyin.json:**

```json
{
  "initials": [
    "b",
    "p",
    "m",
    "f",
    "d",
    "t",
    "n",
    "l",
    "g",
    "k",
    "h",
    "j",
    "q",
    "x",
    "zh",
    "ch",
    "sh",
    "r",
    "z",
    "c",
    "s"
  ],
  "finals": [
    "a",
    "o",
    "e",
    "i",
    "u",
    "ü",
    "ai",
    "ei",
    "ui",
    "ao",
    "ou",
    "iu",
    "ie",
    "üe",
    "er",
    "an",
    "en",
    "in",
    "un",
    "ün",
    "ang",
    "eng",
    "ing",
    "ong"
  ],
  "combinations": [
    {
      "initial": "b",
      "final": "a",
      "tones": {
        "1": "bā",
        "2": "bá",
        "3": "bǎ",
        "4": "bà",
        "0": "ba"
      }
    }
  ]
}
```

**tones.json:**

```json
{
  "tones": [
    { "number": 1, "mark": "ˉ", "name": "mā", "description": "high level", "contour": [5, 5, 5] },
    { "number": 2, "mark": "ˊ", "name": "má", "description": "rising", "contour": [3, 5, 5] },
    {
      "number": 3,
      "mark": "ˇ",
      "name": "mǎ",
      "description": "dip then rise",
      "contour": [2, 1, 4]
    },
    { "number": 4, "mark": "ˋ", "name": "mà", "description": "falling", "contour": [5, 1, 1] },
    { "number": 0, "mark": "·", "name": "ma", "description": "light/neutral", "contour": [3, 3, 3] }
  ],
  "pairDrills": [{ "syllables": "nǐ hǎo", "chinese": "你好", "rule": "3rd+3rd → 2nd+3rd" }],
  "changeRules": [
    { "char": "一", "rule": "yī → yí before 4th tone", "examples": ["一个 yí gè"] },
    { "char": "不", "rule": "bù → bú before 4th tone", "examples": ["不是 bú shì"] },
    { "rule": "3rd+3rd → 2nd+3rd", "examples": ["你好 ní hǎo", "很好 hěn hǎo"] }
  ]
}
```

**strokes.json:**

```json
{
  "basicStrokes": [
    { "glyph": "丶", "pinyin": "diǎn", "meaning": "dot" },
    { "glyph": "一", "pinyin": "héng", "meaning": "horizontal" },
    { "glyph": "丨", "pinyin": "shù", "meaning": "vertical" },
    { "glyph": "丿", "pinyin": "piě", "meaning": "left-falling" },
    { "glyph": "㇏", "pinyin": "nà", "meaning": "right-falling" },
    { "glyph": "㇀", "pinyin": "tí", "meaning": "rising" },
    { "glyph": "㇍", "pinyin": "zhé", "meaning": "bend" },
    { "glyph": "㇠", "pinyin": "gōu", "meaning": "hook" }
  ],
  "rules": [
    {
      "name": "Top → Bottom",
      "example": "三",
      "description": "write top stroke first, then middle, then bottom"
    },
    {
      "name": "Left → Right",
      "example": "川",
      "description": "write left stroke first, then middle, then right"
    },
    { "name": "Outside → Inside", "example": "日", "description": "frame before contents" },
    { "name": "Close frame last", "example": "回", "description": "fill then close" }
  ],
  "suggestedCharacters": ["一", "丨", "人", "大", "口", "水", "火", "木", "日", "月"]
}
```
