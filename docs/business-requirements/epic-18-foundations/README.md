# Epic 18: Foundations

## Epic Summary

**Goal:** Provide interactive pinyin reference, tone training, stroke order animations, and an audio-to-type gate quiz as Phase 1 (The Blueprint) of the adult Mandarin learning roadmap, enabling absolute beginners to master pronunciation fundamentals before learning characters.

**Key Points:**

- Interactive pinyin guide with clickable initials/finals grid (21 initials + 39 finals), tone-colored display (ˉred ˊorange ˇgreen ˋblue ·gray), and TTS audio playback via existing AudioService
- Tone reference with pitch contour visualization, tone pair drills, and tone change rules (3rd tone sandhi, 一 tone changes, 不 tone changes)
- 8 basic strokes reference (点横竖撇捺提折钩) + 4 stroke order rules (top-bottom, left-right, outside-inside, close-last) with Hanzi Writer animated demonstrations
- Character Detail Hub — unified slide-up overlay showing character info (pinyin, audio, stroke animation) as a shared cross-cutting component with progressive phase-gated section disclosure
- Audio-to-Type quiz as Phase 1 gate — hear audio → type pinyin → select tone, ≥90% accuracy to unlock Phase 2
- Static JSON content in `apps/frontend/public/data/foundations/` for pinyin, tones, strokes reference data — no backend dependency for content
- New backend Prisma models (FoundationProgress, QuizAttempt, PhaseGate) + API endpoints for progress persistence and phase gating
- Phase 1 of the 4-phase learning roadmap (Epics 18–23); must be delivered before character/vocabulary content (Epics 19+)

**Status:** In Progress

**Last Update:** June 19, 2026

## Background

PinyinPal currently lacks a structured onboarding path for absolute beginners. New users are dropped directly into vocabulary flashcards with no guided introduction to pinyin, tones, or stroke order. This creates a steep learning curve and high abandonment rate for users with no prior Chinese knowledge.

The adult Mandarin learning roadmap defines Phase 1 (The Blueprint) as the prerequisite for all subsequent content phases. Without mastering pinyin and tones, learners cannot effectively use the IME Simulator (Phase 2), Graded Readers (Phase 3), or any character-based learning. The existing FlashCardPage assumes prior knowledge and must be replaced by a progression system that starts from zero.

This epic establishes the foundational learning infrastructure for the entire platform:

1. **Pinyin proficiency** is the single most important skill for Mandarin learners — tones distinguish meaning, and pinyin is the phonetic bridge to character learning
2. **Stroke order knowledge** enables learners to write characters correctly and look up unknown characters by radical/stroke count
3. **The Audio-to-Type gate quiz** ensures learners have achieved Phase 1 mastery before progressing, preventing knowledge gaps that compound in later phases
4. **The Character Detail Hub** provides a unified information access pattern that scales across all future content epics (radicals, mnemonics, readers, grammar, chengyu)

Business value: Reduced churn for new users, structured progression increases completion rates, Phase 1 gate quality ensures downstream content effectiveness, reusable Hub component accelerates future epic delivery.

## User Stories

This epic consists of the following user stories:

1. **Story 18.1: Foundations Page Structure** ✅ ([story-18-1-foundations-page-structure.md](story-18-1-foundations-page-structure.md))
   - As a **learner**, I want to **access the Foundations page from the Learn section with 4 organized sub-tabs (Pinyin, Tones, Strokes, Animations)**, so that **I can navigate between reference materials in a structured way**.
   - **Status:** Completed

2. **Story 18.2: Pinyin System Guide** ✅ ([story-18-2-pinyin-system-guide.md](story-18-2-pinyin-system-guide.md))
   - As a **new learner**, I want to **explore an interactive pinyin chart with clickable initials and finals, hear their pronunciation via TTS, and see tone-colored pinyin**, so that **I can learn correct pronunciation and understand how syllables are constructed**.
   - **Status:** Completed

3. **Story 18.3: Tones Reference & Practice** ✅ ([story-18-3-tones-reference-practice.md](story-18-3-tones-reference-practice.md))
   - As a **new learner**, I want to **study tone contours, practice tone pair drills, and learn tone change rules (3rd tone sandhi, 一/不)**, so that **I can distinguish and produce the four tones correctly**.
   - **Status:** Completed

4. **Story 18.4: Stroke Order Reference & Animations** ([story-18-4-stroke-order-reference-animations.md](story-18-4-stroke-order-reference-animations.md))
   - As a **new learner**, I want to **reference the 8 basic strokes and 4 stroke order rules, and watch animated stroke order demonstrations for any character**, so that **I can learn proper handwriting technique**.

5. **Story 18.5: Character Detail Hub (Phase 1 Minimal)** ([story-18-5-character-detail-hub.md](story-18-5-character-detail-hub.md))
   - As a **learner**, I want to **tap any character to see a minimal slide-up overlay with pinyin, audio, and stroke animation**, so that **I can learn character details without navigating away from my current context**.

6. **Story 18.6: Audio-to-Type Quiz (Phase 1 Gate)** ([story-18-6-audio-to-type-quiz.md](story-18-6-audio-to-type-quiz.md))
   - As a **learner**, I want to **take an audio-to-type quiz that tests pinyin typing and tone selection**, so that **I can demonstrate Phase 1 mastery and unlock Phase 2 content**.

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- **Story 18.1** establishes infrastructure (feature folder, routing, 4-tab layout, navigation, phase-gating) — must be built first as the scaffold for all Foundations content
- **Stories 18.2–18.3** focus on pinyin and tones reference content — the most critical skill per the learning roadmap ("master pinyin first"). Tones builds on pinyin knowledge.
- **Story 18.4** focuses on stroke reference + Hanzi Writer animations — a separate learning domain from pinyin/tones, can be built in parallel with 18.2/18.3
- **Story 18.5** builds the Character Detail Hub — a shared overlay component used by the stroke animations tab and all future content epics. Depends on Story 18.1 for routing infrastructure.
- **Story 18.6** builds the Phase 1 gate quiz — depends on Stories 18.2–18.3 (quiz uses pinyin/tones content) and 18.1 (quiz page routing). Backend work for QuizAttempt/PhaseGate must be completed first.

Stories 18.1–18.4 can be delivered sequentially. Story 18.5 depends on 18.1. Story 18.6 depends on 18.2–18.3 content knowledge being available.

## Acceptance Criteria

- [ ] Foundations page accessible at `/learn/foundations` with 4 sub-tabs: Pinyin, Tones, Strokes, Animations (verify: navigate to route, all 4 tabs render)
- [ ] Phase-gated TabBar shows correct tabs for Phase 1 user (verify: Foundations active, all other Learn tabs locked with 🔒)
- [ ] Pinyin grid renders 21 initials + 39 finals, each cell clickable with TTS audio playback (verify: click b → hear "b", click b+a → hear "ba" in 5 tones)
- [ ] Tone-colored pinyin display follows the scheme: ˉred ˊorange ˇgreen ˋblue ·gray (verify: visual inspection of pinyin rendering)
- [ ] Tone reference shows 4 tone contours with TTS examples for each tone (verify: play mā, má, mǎ, mà; contours render visually)
- [ ] Tone pair drills play common 2-syllable combinations with TTS (verify: play 你好 → ní hǎo, audio plays)
- [ ] Tone change rules section explains 3rd tone sandhi, 一 tone changes, 不 tone changes with examples (verify: rules text renders, example audio plays)
- [ ] 8 basic strokes grid renders with hanzi glyph, pinyin name, and English name (verify: all 8 strokes visible: 点横竖撇捺提折钩)
- [ ] 4 stroke order rules render with visual examples (verify: 三→top-bottom, 川→left-right, 日→outside-inside, 回→close-last)
- [ ] Character search input accepts hanzi, renders Hanzi Writer SVG animation with play/pause/step/speed controls (verify: type 水 → animation plays, controls function)
- [ ] Character Detail Hub slides up from bottom on character tap, dims background (verify: tap 水 in stroke anim tab → Hub opens, backdrop dims)
- [ ] Hub minimal variant shows: large character (64-72px), pinyin, audio play button, inline stroke animation with controls, Save to Review button (verify: all elements present)
- [ ] Hub closes on Esc key or tap backdrop (verify: both dismiss methods work)
- [ ] Audio-to-Type quiz presents 20 randomized questions: play audio → type pinyin → select tone (verify: quiz flow works end-to-end)
- [ ] Quiz shows instant correct/incorrect feedback with correct answer revealed (verify: wrong answer shows correct pinyin+tone, play again button works)
- [ ] Quiz progress bar shows current score vs 90% pass target (verify: bar updates after each answer)
- [ ] Score ≥90% displays pass result, "Continue to Phase 2" CTA, category breakdown (verify: pass flow works)
- [ ] Score <90% displays fail result, retry option (verify: fail flow works)
- [ ] Backend FoundationProgress API stores sub-topic completion per user, auto-initializes 4 records (pinyin, tones, strokes, animations) on first GET, validates sectionId against shared constants (verify: GET returns 4 records, PUT with invalid sectionId returns 400)
- [ ] Backend QuizAttempt API records quiz results (verify: POST quiz attempt → stored, GET returns history)
- [ ] Backend PhaseGate API updates and returns current phase (verify: passing quiz updates phase_gates.currentPhase to 2)
- [ ] Global nav updated to show 5 items: Dashboard, Learn, Practices, Library, Progress (verify: nav renders all 5 with correct routes)
- [ ] Existing /learn/flashcards route redirects to /learn/foundations (verify: navigation to old route → redirect)
- [ ] Content accuracy verified by sampling 10% of pinyin/tones/strokes data entries (verify: manual spot-check against authoritative sources)
- [ ] Mobile responsive: all tabs and quiz render correctly on viewports ≥320px (verify: test on mobile emulation)
- [ ] Static JSON files load in <200ms combined (verify: network tab timing)

## Architecture Decisions

- **Decision:** Static JSON for reference content (pinyin, tones, strokes) — not backend API
  - Rationale: Pinyin initials/finals, stroke definitions, and tone rules are fixed data that never changes. JSON files under `apps/frontend/public/data/foundations/` eliminate backend latency and simplify deployment.
  - Alternatives considered: Backend API (over-engineered for static data), Database tables (unnecessary complexity for fixed reference), Inline constants (harder to maintain and update)
  - Implications: Content updates require a frontend deployment. Acceptable for reference data that changes infrequently. Backend is reserved for user-specific progress/quiz data.

- **Decision:** Hanzi Writer npm library for stroke animations
  - Rationale: Handles 9000+ characters, built-in SVG animation with play/pause/step/speed controls, MIT license, no backend dependency.
  - Alternatives considered: Custom SVG animation engine (massive effort), GIF-based animations (static, no interactivity), Backend-rendered video (latency, cost)
  - Implications: ~200KB library bundle size. SVG rendering performance for complex characters could be slow on low-end devices — lazy loading and animation caching mitigate this.

- **Decision:** Character Detail Hub as React portal overlay (not route)
  - Rationale: Slides up from any context without losing the user's place. No URL change needed. Stateless — previous screen stays visible in background.
  - Alternatives considered: Dedicated page route (loses context, requires back navigation), Side panel (less mobile-friendly), Modal dialog (less discoverable)
  - Implications: Hub state managed via lightweight store (zustand or Context). Progressive section disclosure based on phase. Inline popover variant for reader context.

- **Decision:** Backend API for FoundationProgress, QuizAttempt, PhaseGate
  - Rationale: User progress must persist across devices and sessions. Backend is the single source of truth. Aligns with existing backend architecture (PostgreSQL + Prisma).
  - Alternatives considered: localStorage only (lost on device change, no cross-device sync), Mixed (localStorage + lazy sync — adds complexity)
  - Implications: Requires new Prisma models, API endpoints, and frontend service layer. Backend module follows existing pattern (controller → service → repository). New module under `apps/backend/src/modules/progression/`.

- **Decision:** New `progression` backend module (not extending existing `progress` module)
  - Rationale: Phase gating, foundation tracking, and quiz attempts are conceptually distinct from word-level SM-2 progress tracking. Separating prevents coupling and keeps modules focused.
  - Alternatives considered: Extend existing progress module (adds complexity to existing code, mixes concerns), Put in auth module (wrong layer)
  - Implications: New routes at `/v1/progression/foundation-progress`, `/v1/progression/quiz-attempts`, `/v1/progression/phase-gate`. Follows existing module pattern. Registers in `container.js` and `routes.js`.

- **Decision:** Tone change rules stored as static JSON content, rendered as reference cards
  - Rationale: The three tone change rules (3rd sandhi, 一, 不) are fixed linguistic rules with a small, enumerable set of examples. No interactive algorithm needed.
  - Alternatives considered: Algorithmic tone sandhi application (complex, error-prone, needed only for TTS which already handles it), Backend API (no dynamic data to serve)
  - Implications: Content is reference-only in Phase 1. TTS audio via existing AudioService handles sandhi automatically (Word.spokenPinyinOverride from data model).

- **Decision:** Shared constant array for foundation section definitions (`packages/shared-constants/`)
  - Rationale: Both frontend and backend need to agree on what foundation sections exist (pinyin, tones, strokes, animations). Without shared constants, the backend can't validate progress submissions or auto-initialize records for new users. The existing `packages/shared-constants` package already serves this purpose for API routes and HSK levels.
  - Alternatives considered: Frontend-only section list (backend returns 400 on unknown sections with no helpful error), Database enum (requires migration for every content addition), Hardcoded in both places (drift risk)
  - Implications: Adding a new section later requires: add to shared constant + add JSON data file = done. The backend auto-creates records for new sections on next GET request. Use the same pattern for future epic content constants (radical sections, grammar levels, etc.).

## Implementation Plan

1. Create `progression` backend module with Prisma models (FoundationProgress, QuizAttempt, PhaseGate), API endpoints, service layer, and frontend service
2. Scaffold `foundations` feature folder under `apps/frontend/src/features/` with routing, 4-tab layout, phase-gated LearnLayout updates
3. Build interactive pinyin chart with initials/finals grid, tone-colored display, TTS audio integration
4. Build tone reference with contours animation, tone pair drills, tone change rules section
5. Build stroke reference (8 basic strokes + 4 rules) + stroke animations tab with Hanzi Writer integration
6. Build Character Detail Hub overlay component with minimal Phase 1 variant
7. Build Audio-to-Type quiz page with 20-question flow, progress tracking, results breakdown, backend integration
8. Integration testing, content accuracy verification, mobile responsiveness testing

## Risks & mitigations

- Risk: Hanzi Writer SVG rendering performance for complex characters (>20 strokes) on low-end mobile devices — Severity: Medium
  - Mitigation: Lazy-load SVG animations (only render when scrolled into viewport), limit concurrent animations to 1, SVG caching via requestAnimationFrame pooling
  - Rollback: Disable animation auto-play on mobile, show static stroke breakdown instead

- Risk: Audio-to-Type quiz audio loading latency disrupts user experience — Severity: Medium
  - Mitigation: Preload common pinyin combination audio files on quiz start. Show loading state per clip with retry. Use existing AudioService fallback to browser TTS.
  - Rollback: Reduce quiz to pinyin typing only (no audio), increase preload batch size

- Risk: Phase gating blocks legitimate users due to backend errors — Severity: High
  - Mitigation: Implement fail-open phase gate (if API unavailable, default to current phase). Cache phase gate response in sessionStorage with 5-minute TTL. Graceful error states.
  - Rollback: Feature flag to bypass phase gating (BYPASS_PHASE_GATE=true), all content unlocked

- Risk: Existing FlashCardPage users lose access to saved progress — Severity: High
  - Mitigation: Audit all imports/routes referencing FlashCardPage before removal. Add permanent route redirect with console warning. Preserve localStorage progress data for migration.
  - Rollback: Keep FlashCardPage active for 30 days with deprecation banner, monitor error logs

- Risk: Backend quiz endpoint fails under concurrent load — Severity: Medium
  - Mitigation: Rate limiting on quiz submission (5 requests/min per user). Input validation on all quiz endpoints. Existing QuizSession infrastructure provides connection pooling.
  - Rollback: Queue-based submission, client-side retry with exponential backoff

## Implementation notes

- **Conventions:** Follow `docs/guides/references/code-conventions.md` and `docs/knowledge-base/solid-principles.md` for all code
- **Feature folder:** Create `apps/frontend/src/features/foundations/` with `components/`, `hooks/`, `services/`, `stores/`, `types/`, `utils/`, `index.ts`
- **Backend module:** Create `apps/backend/src/modules/progression/` following existing module pattern (api/domain/repositories/services/index.js)
- **Prisma models:** Add FoundationProgress, QuizAttempt, PhaseGate models — see `verification-artifacts/shared-data-model-v3.md` for exact schema
- **Shared constants:** Add `packages/shared-constants/src/foundations.ts` with `FOUNDATION_SECTIONS` array. Import from `@mandarin/shared-constants` in both frontend and backend. Backend uses it to validate sectionId and auto-initialize FoundationProgress records.
- **Static JSON data:** Store at `apps/frontend/public/data/foundations/` — separate files for pinyin.json, tones.json, strokes.json
- **Audio:** Reuse existing AudioService from `apps/frontend/src/features/vocabulary/services/audioService.ts` — no new TTS integration needed
- **Hanzi Writer:** Install `hanzi-writer` npm package (MIT license). Wrap in custom React component with play/pause/step/speed controls.
- **Character Detail Hub:** Build as shared component at `apps/frontend/src/shared/components/CharacterDetailHub/`. Use React Portal for overlay behavior. Store state via simple Context or zustand.
- **Route constants:** Already defined in `apps/frontend/src/shared/constants/paths.ts` (learn_foundations, etc.). Add any missing constants.
- **Quiz:** Extend existing QuizSession infrastructure OR build standalone. Prefer standalone for Phase 1 simplicity (fewer integration points).
- **Testing:** Write tests for FoundationProgress API endpoints, quiz flow, Hub open/close behavior, tone-colored pinyin rendering
- **FlashCardPage deprecation:** Add route redirect in LearnRoutes.tsx before removing. Add deprecation notice in release notes.
