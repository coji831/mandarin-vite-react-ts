# Epic 19: Radicals & Character Composition

## Epic Summary

**Goal:** Provide an interactive radical database and character composition browser that teaches learners the 214 Kangxi radicals — starting with the top 20 most common radicals — with search/filter, example character grids, radical trees (Phase 2 browsing + Phase 3 expansion), and an IME Simulator quiz as the Phase 2 gate, enabling learners to understand character composition through the "Radicals First, Characters Second" principle.

**Key Points:**

- 214 Kangxi radicals reference data in `content/radicals/` as static JSON files (start with top 20 recommended radicals, scalable schema for all 214)
- Content registry via `content/manifest.json` for radical data discovery
- Interactive radical browser with grid view, stroke count filter, search, "Show top 20 only" toggle
- Radical Detail Card — expandable card showing radical info, example characters grid with audio + Character Detail Hub trigger, "Generate Story" mnemonic button (placeholder/disabled, API integration deferred to Epic 20)
- Radical Trees — Phase 2 mode: browse a radical to see all HSK characters containing it; Phase 3 mode: expand mastered radicals into tree visualization, each character node clickable → Hub
- Character Detail Hub radical decomposition section (Phase 2 additions to existing shared Hub component)
- IME Simulator Quiz as Phase 2 gate — browser native IME input, 25 questions, ≥70% pass threshold, backend via existing QuizAttempt infrastructure
- Minimal backend: extend `apps/backend/src/modules/progression/` with RadicalProgress (Prisma model + API endpoints)
- Reuse existing components: CharacterDetailHub (`features/character-hub/`), AudioService, phase-gate hook (`usePhaseGate()`), LearnLayout tab routing, `ContentBrowser`, `ProgressBar`
- Mnemonic generation button on Radical Detail Card shows placeholder/disabled state — no backend API integration in this epic (deferred to Epic 20)
- Radicals integrated into the existing SRS Review system — [📘 Radicals] content type in ReviewPicker, buildRadicalItem() in ReviewService, ReviewItem created as side-effect of marking a radical memorized via RadicalProgress
- Review flow for radicals: show radical glyph → user types pinyin → user selects tone → self-rate A/G/E (same active-recall pattern as Phase 1 review, no new frontend needed)

**Status:** In Progress

**Last Update:** June 26, 2026

## Background

PinyinPal's Phase 1 (The Blueprint, Epic 18) established pinyin, tones, and stroke fundamentals. Phase 2 (Character Foundations) shifts focus to character composition — and the foundation of character composition is radicals.

The Kangxi radical system classifies all Chinese characters by their 214 constituent components. Understanding radicals is the single most powerful tool for character recognition, dictionary lookup, and mnemonic construction. Research shows that learners who study radicals systematically achieve significantly better character retention than those who learn characters in isolation.

Currently, PinyinPal has no radicals content. The Learn section has a `/learn/radicals` route pointing to a `ContentPlaceholderPage`. This epic replaces that placeholder with a fully functional radical learning experience.

This epic covers three phases of radical learning:

1. **Phase 2 (Radical Browsing + IME Quiz):** Learners explore the radical browser, study radical details with example characters, and pass the IME Simulator quiz (≥70%) to unlock Phase 3
2. **Phase 3 (Radical Trees + Character Hub Integration):** Learners explore radical trees showing mastered radicals with character decomposition, interact with radical info in the Character Detail Hub
3. **Future (Epic 20+):** Mnemonic generation API integration, full 214-radical dataset, spaced repetition for radicals

Business value: Radicals are the gateway to character literacy. Without understanding radicals, learners cannot effectively look up characters, recognize character patterns, or build meaningful mnemonics. This epic delivers the highest-ROI radicals subset (top 20, covering ~70% of common characters) with a clear upgrade path to the full set.

## User Stories

This epic consists of the following user stories:

1. **Story 19.1: Radicals Browser Structure** ([story-19-1-radicals-browser-structure.md](story-19-1-radicals-browser-structure.md))
   - As a learner, I want to browse radicals in an interactive grid with search/filter/sort, so that I can discover and explore radicals systematically.
   - **Status:** Planned

2. **Story 19.2: Radical Detail Card** ([story-19-2-radical-detail-card.md](story-19-2-radical-detail-card.md))
   - As a learner, I want to tap a radical to see its detail card with glyph, meaning, example characters, and a mnemonic button, so that I can study each radical in depth.
   - **Status:** Planned

3. **Story 19.3: Backend RadicalProgress + SRS Review Integration** ([story-19-3-backend-radical-progress.md](story-19-3-backend-radical-progress.md))
   - As a learner, I want the app to track which radicals I've memorized and auto-add them to my SRS review queue, so that both my progress and retention are managed.
   - **Status:** Planned

4. **Story 19.4: Radical Trees (Phase 3)** ([story-19-4-radical-trees.md](story-19-4-radical-trees.md))
   - As a learner in Phase 3, I want to explore radical trees showing mastered radicals with expandable character lists, so that I can see how radicals compose into characters.
   - **Status:** Planned

5. **Story 19.5: Character Hub Radical Section** ([story-19-5-character-hub-radical-section.md](story-19-5-character-hub-radical-section.md))
   - As a learner, I want to see the radical breakdown of any character in the Character Detail Hub, so that I can understand character composition from any context.
   - **Status:** Planned

6. **Story 19.6: IME Simulator Quiz (Phase 2 Gate)** ([story-19-6-ime-simulator-quiz.md](story-19-6-ime-simulator-quiz.md))
   - As a learner, I want to pass an IME-based quiz to prove Phase 2 readiness, so that I can unlock Phase 3 content.
   - **Status:** Planned

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- **Story 19.1** establishes the feature scaffold (`features/radicals/` folder), content loading from `content/radicals/*.json`, the grid view with filter/search/sort, and replaces the `/learn/radicals` placeholder. The LearnLayout already has a radicals tab — this story wires it up with real content.
- **Story 19.2** builds on the grid by adding the expandable Radical Detail Card below the grid selection. Depends on 19.1 for the grid interaction.
- **Story 19.3** is the backend work for RadicalProgress + SRS Review integration — a new Prisma model (RadicalProgress), API endpoints, side-effect ReviewItem creation on memorized, and extending the ReviewService with buildRadicalItem(). Can proceed in parallel with 19.1 (no frontend dependency).
- **Story 19.4** builds the Radical Trees feature using mastered radical data from 19.3's API and example character data from 19.2's card. Depends on both.
- **Story 19.5** adds the radical decomposition section to the existing CharacterDetailHub shared component. Depends on 19.3 for progress data but can be designed in parallel.
- **Story 19.6** is the Phase 2 gate quiz using browser native IME. Depends on 19.1-19.3 being available for content reference.

Stories 19.1 and 19.3 can proceed in parallel (frontend and backend). Story 19.2 depends on 19.1. Story 19.4 depends on 19.2 and 19.3. Story 19.5 depends on 19.3. Story 19.6 depends on 19.1-19.3 for content and progress infrastructure.

## Acceptance Criteria

Detailed acceptance criteria for each story are defined in the individual story documents linked above.

## Architecture Decisions

- **Static JSON for radical content** — Radical definitions are fixed reference data. JSON in `content/radicals/` eliminates backend latency and follows the foundations pattern.
- **RadicalProgress in existing `progression` module** — Single-model CRUD following the exact FoundationProgress pattern from Epic 18, reusing existing controller/service/repository structure.
- **Top 20 radicals first, scalable to all 214** — Pareto principle: top 20 cover ~70% of common characters. `is_recommended: true` flag enables incremental expansion without schema changes.
- **Radical Trees split into Phase 2 (browse) and Phase 3 (expansion)** — Phase 2 shows flat character lists; Phase 3 shows mastered radicals as tree roots. Controlled by `PhaseGate.currentPhase`.
- **Mnemonic button as placeholder/disabled** — No API integration in Epic 19; button is disabled with "Coming in Epic 20" tooltip to avoid blocking on AI infrastructure.
- **Browser native IME for quiz** — Standard text input with `lang="zh"` attributes. No custom IME needed; matches real-world user experience.
- **Reuse existing QuizAttempt + PhaseGate infrastructure** — IME Simulator adds quizType "ime-simulator" to existing models. No new backend quiz infrastructure.
- **RadicalProgress + ReviewItem dual-tracking** — RadicalProgress tracks mastered boolean for trees; ReviewItem manages SRS scheduling. Side-effect: RadicalProgress.upsert(memorized=true) triggers ReviewService.recordRating().

## Implementation Plan

1. Backend: RadicalProgress Prisma model, API endpoints, ReviewItem side-effect, buildRadicalItem(), ReviewPicker update (Story 19.3)
2. Scaffold `features/radicals/` feature folder
3. Add radical content data files for top 20 radicals
4. Update `content/manifest.json` with radical entries
5. Build radical browser grid with filter/search/sort/top-20 toggle (Story 19.1)
6. Build Radical Detail Card with example chars, audio, Hub triggers, placeholder mnemonic (Story 19.2)
7. Build Radical Trees Phase 2 and Phase 3 modes (Story 19.4)
8. Add radical decomposition section to CharacterDetailHub (Story 19.5)
9. Build IME Simulator Quiz with backend QuizAttempt/PhaseGate integration (Story 19.6)
10. Integration testing, content accuracy verification, mobile responsiveness testing

## Risks & mitigations

- **IME behavior varies across browsers** (Medium) — Test on Chrome, Firefox, Safari (desktop + mobile). Add `inputMode` hints and IME activation instructions. Fallback to pinyin typing if IME is unavailable.
- **Radical content data only covers top 20** (Low) — Schema supports incremental addition. Unavailable radicals show "Coming soon" placeholder. "Show top 20 only" is the default view.
- **Phase 3 trees may confuse Phase 2 users** (Medium) — Gated by `PhaseGate.currentPhase === 3`. Toggle only appears for Phase 3 users.
- **Hub radical section conflicts with future sections** (Low) — Self-contained component using same progressive disclosure pattern. Can be reordered or hidden independently.
- **ContentPlaceholderPage replacement breaks LearnLayout** (Low) — Route path and tab definition remain unchanged. Rollback is a single file revert.
- **RadicalProgress endpoint fails under load** (Low) — Single-model CRUD following existing ProgressionController pattern with rate limiting.

## Implementation notes

Detailed implementation notes are in the individual story implementation documents.

- Follow frontend/backend conventions: `docs/guides/conventions/frontend.md`, `docs/guides/conventions/backend.md`
- See `verification-artifacts/shared-data-model-v3.md` for the RadicalProgress schema
- See `verification-artifacts/ui-ux-wireframes-v2.md` Sections 5.1, 5.2, 5.4, 6.1 for wireframes
