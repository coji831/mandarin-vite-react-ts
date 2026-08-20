# TODO — Project-wide (GitHub-friendly)

**Audience:** Project maintainers, developers tracking tasks  
**Last Updated:** 2026-08-17

> **Status vocabulary:** Planned / In Progress / Completed / Parked / Retired / Deferred.
> Plan/epic references point to the current source of record: ratified business model
> (`docs/business/business-model.md`, BM-1), ratified epic plan (`docs/planning/epics-25-40.md`),
> backend decisions D1=NestJS 11 + D7=shell-swap (`wip/tech-mapping.md` §6),
> re-scoped `epic-24-nestjs-shell-migration`, and `epic-41-traditional-characters`.

This file is a simple, human-editable TODO list compatible with GitHub (checkboxes are interactive in PRs and on GitHub.com).

Usage:

- Edit items locally or on GitHub and check boxes when work is complete.
- To escalate a checklist item into a tracked GitHub Issue, use the `gh` CLI (examples below) or create the Issue via the GitHub UI.

Sections

- Bugs: critical fixes and regressions
- Todo (near-term): prioritized tasks to do soon
- Backlog (future): ideas and lower-priority work
- Done (archive): moved items once completed

---

## Bugs (urgent)

- [ ] **Production: guest users hit the backend directly with no fallback → 404** — Some features call backend endpoints directly for anonymous/guest users instead of falling back (to hardcoded/local data or a gated UI), surfacing a not-found (404) error. Desired pattern: service-layer guest fallback like the quiz's local strategy-based generation (`features/quiz/services/quizService.ts` `generateQuestionPool`) or readers' 6 demo passages. Light scan suggests likely-affected: `features/review/services/reviewService.ts` (`GET /v1/review/items` + rating POST — no fallback), `features/readers/services/readingProgressService.ts` (sessions/bookmarks/complete — only `readingStore.saveProgress()` no-ops for guests), and static-content detail lookups `features/word-hub/services/wordService.ts` / `features/character-hub/services/characterService.ts` (`/v1/words/:glyph`, `/v1/characters/:glyph` while local `content/*.json` exists). Action: audit guest-facing features for fallback gaps. **Still open (verified 2026-08-17)** — files + routes (`/v1/review/items`, `/v1/words/:glyph`, `/v1/characters/:glyph`) confirmed current. Now governed by the ratified guest calibration: guest identity + route gating land in **epic-25**, guest session-local review in **epic-28** (`docs/planning/epics-25-40.md`); see also `wip/guest-access-calibration.md`.

## Todo (near-term)

### Learning Roadmap (Epics 18–23) — completed

- [x] **Epic 20: Mnemonic Stories** — Backend: `mnemonics` module (CRUD + Gemini generation), `GeminiService`, `Character` and `MnemonicStory` Prisma models, mnemonic caching (30-day TTL with stampede prevention) _(done — verified 2026-08-17)_
- [x] **Epic 20: Mnemonic Stories** — Frontend: `character-hub` feature (HubIdentityCard, HubMnemonicSection, HubRadicalSection, HubReadings, HubCommonWords, HubActions), `mnemonicStore` (Zustand, 10-state machine), `Tabs` underline variant, `Textarea` shared component _(done — verified 2026-08-17)_
- [x] **Epic 20: Mnemonic Stories** — Content: character content consolidated into aggregate `content/characters/characters.json` + `index.json`, `prisma.config.ts` _(done — verified 2026-08-17; the `run-gcs-upload.js` wrapper no longer exists on disk)_
- [ ] **Onboarding tutorial — Status: Deferred** — Design and implement a first-time onboarding flow for new learners. Not a blocker for UI design; not in the ratified 25–40 arc. See `wip/learning-roadmap-usecases.md` Decision #1.

### Story 16 — Example Caching & Service Alignment: Infrastructure Verification

- [ ] **[GCP Setup] Verify Google Cloud credentials and GCS infrastructure** — Create GCS bucket `mandarin-vocab-example-data`, confirm GOOGLE_TTS_CREDENTIALS_RAW service account has Storage Object Creator/Viewer roles. Manual bucket creation is sufficient for local testing (the legacy `terraform/gcs/examples-bucket.tf` and `docs/deployment-guide.md` were removed). Priority: Critical (blocks example caching from persisting to GCS). **Status: Open** — epic-16 is complete; this GCS infrastructure item remains pending.

### Story 15.11 — Quiz Feature Extensions (incomplete AC items)

- [ ] **[Item 10] Multi-meaning word support** — Words like 行 (xíng/háng) and 花 (huā flower/spend) should accept ANY matching variant for the alternate reading. The old CSV-based `validation.ts`/`parseWordEntry()` approach was removed in the quiz rework to the strategy pattern — multi-meaning support now lives at the strategy/question level (e.g. `AudioToPinyinAndToneStrategy`) and in the results UI. See story BR AC: "Multi-Meaning/Reading Support".

- [ ] **[Item 19] Results page for multi-meaning words** — `QuizResults.tsx` / `CategoryBreakdown.tsx` shows only one expected answer per row. Needs to display which variant user answered + all acceptable forms when a question has alternatives. Depends on Item 10.

- [ ] **[Item 23] "Review Mistakes" button on results page** — `QuizResults.tsx` has a retry path via `quizSessionStore.retry()` but no way to retry only the incorrect questions. Add a "Review Mistakes" button that starts a new session using only the questions where the answer was incorrect.

- [ ] **Add direct unit test for `PhaseGateBadge`** — pass/fail/guest states; currently covered only via page-level `QuizPageFull` stories.

## Backlog

- [ ] Standardize API response structure - Error format is already standardized (`errorFactory`/`errorHandler`/`requestIdMiddleware` in `apps/backend/src/shared/`, `backend-error-messages.instructions.md`, KB `api-response-patterns.md`). Remaining: success-envelope consistency — some endpoints wrap `{ data }`, others return data directly.

- [ ] Refactor services to direct export pattern - Direct-export object pattern is now the convention (`readingProgressService`); remaining class-wrapped services to convert, e.g. `features/review/services/reviewService.ts` (Epic 14 follow-up)

- [ ] Migrate auth to React Query + Axios - `authFetch` removed; Axios `apiClient` is the standard (Epic 14). Remaining: adopt React Query (`@tanstack/react-query`) — not currently in the stack

### Future Epics (Long-term)

- [ ] **Epic: Handwriting Recognition System** - Canvas-based character input (40x40mm) with stroke-order validation and CNN for 30K+ character recognition. Highest retention value for orthographic production. Requires ML model integration (Apple-style CNN or Vision API). **Not in the ratified 25–40 arc** (`docs/planning/epics-25-40.md`) — remains long-term beyond epics 25–40. Depends on the SRS/retention work (epics 28/34). Mobile-optimized UI critical.

## Done

- [x] **Production: audio playback — four overlapping systems, hang on pause/stop, no teardown/caching/tests** — RESOLVED by the audio-consolidation / TTS-detachment refactor. Shipped: shared `AudioManager` (pure transport over `PlayableItem[]`, `PlaybackStrategy` single/sequence, typed event emitter, abort token; `playUrl` settles with `PlaybackEndReason` — never hangs), `AudioBehavior` contracts (candidates-as-data with `onUrlFailed` verdicts), `useAudioManager`/`useAudioItemPlayback`, readers `PassageAudioBehavior`/`buildPassageAudioBehavior`, `defaultWordBehavior` in `shared/audio/contracts/`, `AudioService` in `shared/services/audio`, with unit/component coverage. Legacy `useAudioPlayer.ts`, `useAudioPlayback.ts`, `shared/lib/audioEngine.ts`, and the `SourceResolver` were removed. See `wip/audio-playback-redesign.md`.
- [x] **Epic: Radical-Based Learning (Epic 19)** — Radical browser, detail cards, and dual radical/phonetic trees shipped in `features/radicals/`
- [x] **Epic: Progress Visualization Dashboard** — Dashboard feature with learning statistics and activity overview shipped in `features/dashboard/`
- [x] Fix jest-dom global type setup - Created tsconfig.test.json for proper test file TypeScript configuration with vitest/globals and @testing-library/jest-dom types. Updated setupTests.d.ts to augment vitest globals with jest-dom matchers. Removed explicit imports from all test files (QuizLoading, QuizComplete, DailyReviewQuiz). All 161 tests pass without explicit import statements.
- [x] Re-organize features - Moved `conversation/` under `mandarin/`
- [x] Unify data objects - Standardized `Card`, `Word`, `ConversationTurn`
- [x] Overhaul services layer - Designed unified services with fallback logic
- [x] Add data/audio services - Implemented vocabulary and TTS service functions
- [x] Migrate components to services - Refactored all components to use services layer
- [x] Ensure service fallback - Added robust fallback and backend swap support
- [x] Modernize backend Google API integration - Simplify credential handling
- [x] Add pinyin/English support to conversations - Display and audio playback
- [x] Support turn-based conversations - UI indicators and per-turn audio controls
- [x] Refactor frontend services layer - Centralize API baseURL configuration across services

---

## How to Create GitHub Issues

**Quick command (using GitHub CLI):**

```bash
# Create issue from TODO item
gh issue create --title "Refactor frontend services layer" --body "Centralize API baseURL configuration across services. See TODO.md for context."

# List existing issues
gh issue list
```

**Best Practice:** For tasks requiring >2 hours or affecting multiple files, create a GitHub issue with:

- Detailed implementation plan
- Affected files/components
- Acceptance criteria
- Estimated effort

Then reference the issue number in TODO.md: `- [ ] Task summary (#123)`

---

## Change Log

- **2026-08-21 — Removed irrelevant items (Docs Writer):** dropped 6 TODO items now owned by the ratified plan or superseded — [Item 14] Quiz filter provider + [Item 27] FeedbackProvider (stale "Epic 17 (Knowledge Hub)" naming, no feature in the 25–40 arc), HSK Validation (owned by epic-27), A10 `/v1` prefix (superseded by D7 shell-swap), backend error logging (owned by epic-39), Epic-34 FSRS (owned by epic-34). Kept all genuinely-open work (guest 404, onboarding, GCS setup, Story 15.11 Items 10/19/23 + PhaseGateBadge test, API-response standard, services direct-export, React Query, Handwriting Recognition).

- **2026-08-17 — Calibration cleanup (Docs Writer, uncommitted):**
  - Re-verified every item against disk after the calibration (BM-1 ratified, epic plan 25–40 ratified, D1=NestJS 11, D7=shell-swap; `epic-24-nestjs-shell-migration` + `epic-41-traditional-characters` on disk).
  - **Kept as open (verified):** guest 404 fallback bug, onboarding (Deferred), GCS setup, all Story 15.11 quiz items, A10 `/v1` prefix, HSK validation, handwriting recognition.
  - **Aligned to the ratified plan:** FSRS → epic-34; backend error logging → epic-39; HSK validation → epic-27; guest bug → epics 25/28.
  - **Reworded:** "Standardize API response" (error format now standardized); "services direct export" (pattern now the convention); "auth React Query" (authFetch removed, React Query pending).
  - **Cleaned stale refs:** removed `run-gcs-upload.js` from the Epic-20 content done item (file no longer on disk).
  - **Flagged (kept, no mapping invented):** Story 15.11 Items 14 + 27 reference "Epic 17 (Knowledge Hub)" — stale naming (current epic-17 = state-restructure); feature not in the ratified 25–40 arc.
  - **No superseded items found:** no `COMMITTED`/Express-only/`epic-24-dotnet`/Supabase references existed in TODO.md.

Last updated: 2026-08-17
