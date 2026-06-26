# Epic 19: Radicals & Character Composition — Implementation

**BR Reference:** `docs/business-requirements/epic-19-radicals/README.md`
**Last Updated:** June 27, 2026

---

## Epic Summary

**Goal:** Build Phase 2 of the adult Mandarin learning roadmap — an interactive radical browser, Radical Detail Card, radical trees (Phase 2 browsing + Phase 3 expansion), Character Detail Hub radical decomposition section, and an IME Simulator gate quiz — with minimal backend radical progress tracking, enabling learners to understand character composition through the Kangxi radical system.

**Key Points:**

- Static JSON radical content in `content/radicals/rad_*.json` — start with top 20 recommended radicals, scalable schema for all 214
- Content registry via `content/manifest.json` for radical data file discovery
- Interactive radical browser grid with stroke count filter, search, "Show top 20 only" toggle, sort options
- Radical Detail Card expandable below grid with example characters grid (audio + Hub trigger), "See all" expand, mnemonic generate button (placeholder/disabled)
- Radical Trees: Phase 2 browse mode (radical → character list) + Phase 3 expansion mode (mastered radicals → tree with character nodes → Hub)
- Character Detail Hub radical decomposition section — phase-gated for Phase 2+ users
- IME Simulator Quiz — browser native IME input, 25 questions, ≥70% pass threshold, reuses existing QuizAttempt + PhaseGate infrastructure
- Minimal backend: extend `apps/backend/src/modules/progression/` with RadicalProgress Prisma model and API endpoints
- Reuse existing: CharacterDetailHub, AudioService, usePhaseGate hook, LearnLayout tab routing, QuizAttempt/PhaseGate models
- Mnemonic "Generate Story" button is placeholder/disabled — no API calls (deferred to Epic 20)
- Radicals integrated into existing SRS Review system — "radical" added to ReviewItemType, buildRadicalItem() in ReviewService, ReviewItem created as side-effect of RadicalProgress memorized=true
- [📘 Radicals] content type added to ReviewPicker — reuses existing ReviewCard / ReviewComplete / three-step active recall flow, no new frontend review components needed

**Status:** In Progress

**Last Update:** June 27, 2026

## Story Status

| Story                                                   | Status       | Implementation Doc                                                                 |
| ------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------- |
| 19.1 — Radicals Browser & Detail Card                   | ✅ Completed | —                                                                                  |
| 19.2 — Radical Detail Card                              | Planned      | —                                                                                  |
| 19.3 — Backend RadicalProgress + SRS Review Integration | ✅ Completed | [story-19-3-backend-radical-progress.md](./story-19-3-backend-radical-progress.md) |
| 19.4 — Radical Trees (Phase 3)                          | ✅ Completed | [story-19-4-radical-trees.md](./story-19-4-radical-trees.md)                       |
| 19.5 — Character Hub Radical Section                    | Planned      | —                                                                                  |
| 19.6 — IME Simulator Quiz                               | Planned      | —                                                                                  |

## Technical Overview

**Frontend:** New `radicals` feature folder at `apps/frontend/src/features/radicals/` with grid page, Radical Detail Card, Radical Trees component, IME Simulator Quiz page, and extension of CharacterDetailHub with a radical decomposition section. Replaces the `/learn/radicals` placeholder with real content.

**Backend:** Extend existing `progression` module with RadicalProgress Prisma model and GET/PUT REST API endpoints following the FoundationProgress pattern (controller → service → repository). Extend ReviewService with `buildRadicalItem()` for SRS review. RadicalProgress.upsert(memorized=true) triggers ReviewService.recordRating() as a side-effect. Add "radical" to the ReviewItemType union. Add [📘 Radicals] content type to ReviewPicker — no new review components needed.

**Data:** Static JSON files in `content/radicals/rad_*.json` for radical reference data. Backend stores only user-specific RadicalProgress tracking.

## Architecture Decisions

1. **Static JSON for radical content** — Radical definitions are fixed reference data. JSON in `content/radicals/` follows the foundations pattern and eliminates backend latency.
2. **RadicalProgress in existing `progression` module** — Single-model CRUD following FoundationProgress pattern from Epic 18. Reuses existing controller/service/repository structure.
3. **Top 20 radicals first, scalable to all 214** — Pareto principle: top 20 cover ~70% of common characters. `is_recommended: true` flag enables incremental expansion.
4. **Radical Trees: Phase 2 browse + Phase 3 expansion** — Phase 2 shows flat character lists; Phase 3 shows mastered radicals as tree roots. Controlled by `PhaseGate.currentPhase`.
5. **Mnemonic button as placeholder/disabled** — No API integration in Epic 19. Button disabled with "Coming in Epic 20" tooltip. Prevents blocking on AI infrastructure.
6. **Browser native IME for quiz** — Standard text input with IME-enabling attributes. No custom IME component. Matching compares normalized characters.
7. **Reuse existing QuizAttempt + PhaseGate infrastructure** — IME Simulator adds quizType "ime-simulator" to existing models. No new backend quiz infrastructure.
8. **RadicalProgress + ReviewItem dual-tracking** — RadicalProgress tracks mastered boolean for trees; ReviewItem manages SRS scheduling. Side-effect: memorized=true triggers ReviewService.recordRating().

## Technical Implementation

### Architecture

```
Frontend (apps/frontend)                                  Backend (apps/backend)
─────────────────────────                                 ──────────────────────

apps/frontend/src/features/radicals/                      apps/backend/src/modules/progression/ (extend)
├── components/                                            ├── api/
│   ├── RadicalsPage.tsx        ← grid + filter bar       │   ├── ProgressionController.js  ← add methods
│   ├── RadicalGrid.tsx         ← radical card grid        │   └── progressionRoutes.js      ← add routes
│   ├── RadicalCard.tsx         ← individual grid card     ├── repositories/
│   ├── RadicalDetailCard.tsx   ← expandable detail        │   └── ProgressionRepository.js ← add methods
│   ├── RadicalTreesTab.tsx     ← Phase 2/3 tree view     ├── services/
│   ├── ExampleCharGrid.tsx     ← chars with audio + Hub  │   └── ProgressionService.js    ← add methods
│   └── IMEQuizPage.tsx         ← IME Simulator quiz      ├── index.js
├── hooks/                                                 └── (rest stays the same)
│   ├── useRadicals.ts          ← content loading + filter
│   └── useRadicalProgress.ts   ← API calls              apps/backend/prisma/schema.prisma
├── services/                                              └── model RadicalProgress (add)
│   └── radicalsService.ts      ← API calls
├── stores/
│   └── radicalsStore.ts        ← zustand store (selected radical, filter state)
├── types/
│   └── index.ts
├── utils/
│   └── radicalDataUtils.ts     ← content parsing, filtering
└── index.ts

apps/frontend/src/shared/components/CharacterDetailHub/   content/radicals/
├── CharacterDetailHub.tsx       ← extend with radical section    ├── rad_0001.json    ← top 20 radicals
├── HubRadicalSection.tsx        ← NEW: radical decomposition      ├── rad_0002.json
│                                ← phase-gated                    ├── ... (scalable to 214)
└── hubStore.ts                  ← extend if needed               └── rad_0214.json
```

### Story 19.4 — Radical Trees (Phase 3)

**Phase 2 (currentPhase < 3):** `RadicalTreesTab` shows a locked teaser with a lock icon and message explaining trees unlock in Phase 3. No browse mode in the Trees tab (browse via the Browse tab).

**Phase 3 (currentPhase >= 3):** `RadicalTreesTab` delegates to `Phase3TreeView` which loads mastered radicals from `radicalProgressService.getRadicalProgress()`, filtered by `memorized=true`. The view renders:

1. **Search bar** — filters mastered chips by glyph, meaning, or pinyin
2. **RadicalChipPicker** — single-select chip row with `role="tablist"`, selected indicator with accent styling
3. **Separator** — visual divider with "Your known radicals (★ mastered)" text
4. **Selected indicator** — shows active radical glyph, meaning, and "known ★ — click to expand"
5. **TreeRootNode** — expandable tree root with chevron toggle, character branches via `BranchNode` with connector lines
6. **Tagline** — "Learning through recognition — no testing. Browse freely."

Key patterns: one CSS file per component (BEM naming), utility classes from globals.css, shared Button component (secondary variant added), SpeechSynthesis for audio, useCharacterHub for Hub navigation.

### Data Flow

Detailed data flows for each story are documented in the individual story implementation documents.

### API Endpoints

New endpoints (Progression module, extending existing `/api/v1/progression/`):

- `GET /api/v1/progression/radical-progress` — list user's radical progress
- `GET /api/v1/progression/radical-progress/:radicalId` — single radical progress
- `PUT /api/v1/progression/radical-progress/:radicalId` — upsert radical progress (triggers ReviewItem side-effect)

Reused endpoints (existing, no changes):

- `QuizAttempt` — add quizType "ime-simulator"
- `PhaseGate` — no changes needed

See individual story docs for full request/response examples.

### Component Relationships

```
RadicalsPage (route: /learn/radicals)
├── FilterBar (search, stroke count, top-20 toggle, sort)
├── RadicalGrid → RadicalCard × N
├── RadicalDetailCard (expandable, example chars, Hub triggers)
└── RadicalTreesTab (Phase 2 browse + Phase 3 tree)

CharacterDetailHub (extended)
└── HubRadicalSection ← NEW (phase-gated, Phase 2+)

IMEQuizPage (route: /practices/quiz?type=ime-simulator)

ReviewPicker (existing, updated: +📘 Radicals)
```

### Prisma Model to Add

Add `RadicalProgress` to `apps/backend/prisma/schema.prisma` with fields: id, userId, radicalId, memorized, recognitionLevel, reviewedAt, createdAt, updatedAt. See `verification-artifacts/shared-data-model-v3.md` for exact schema. `@@unique([userId, radicalId])` and `@@index([userId])`.

---

## Technical Challenges & Solutions

Detailed technical challenges for each story are documented in the individual story implementation documents.

## Related Documentation

- [Epic 19 BR](docs/business-requirements/epic-19-radicals/README.md) — Business requirements and user stories
- [Shared Data Model v3](verification-artifacts/shared-data-model-v3.md) — RadicalProgress Prisma model schema
- [UI/UX Wireframes v2](verification-artifacts/ui-ux-wireframes-v2.md) — Section 5: Radicals Browser, Detail Card, Trees; Section 5.4: IME Quiz
- [Epic 18 Implementation](docs/issue-implementation/epic-18-foundations/README.md) — Reference for progression module pattern, QuizAttempt/PhaseGate models
- [Character Detail Hub](apps/frontend/src/shared/components/CharacterDetailHub/) — Hub component structure to extend
- [Content Registry](content/manifest.json) — Content discovery manifest
- [Frontend Conventions](docs/guides/conventions/frontend.md) — Feature folder and component patterns
- [Backend Conventions](docs/guides/conventions/backend.md) — Module and API patterns
- [Review Module](apps/backend/src/modules/review/) — Existing SRS review infrastructure to extend
- [Review Feature](apps/frontend/src/features/review/) — ReviewPicker and ReviewCard components to update
