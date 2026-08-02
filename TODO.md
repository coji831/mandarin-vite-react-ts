# TODO — Project-wide (GitHub-friendly)

**Audience:** Project maintainers, developers tracking tasks  
**Last Updated:** August 2026

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

## Todo (near-term)

### Learning Roadmap (Epics 18-23)

- [x] **Epic 20: Mnemonic Stories** — Backend: `mnemonics` module (CRUD + Gemini generation), `GeminiService`, `Character` and `MnemonicStory` Prisma models, mnemonic caching (30-day TTL with stampede prevention)
- [x] **Epic 20: Mnemonic Stories** — Frontend: `character-hub` feature (HubIdentityCard, HubMnemonicSection, HubRadicalSection, HubReadings, HubCommonWords, HubActions), `mnemonicStore` (Zustand, 10-state machine), `Tabs` underline variant, `Textarea` shared component
- [x] **Epic 20: Mnemonic Stories** — Content: character content consolidated into aggregate `content/characters/characters.json` + `index.json`, prisma.config.ts, run-gcs-upload.js wrapper
- [ ] **Onboarding tutorial (deferred)** — Design and implement a first-time onboarding flow for new learners. Not a blocker for UI design. See `verification-artifacts/learning-roadmap-usecases.md` Decision #1.

### Story 16 — Example Caching & Service Alignment: Infrastructure Verification

- [ ] **[GCP Setup] Verify Google Cloud credentials and GCS infrastructure** — Create GCS bucket `mandarin-vocab-example-data`, confirm GOOGLE_TTS_CREDENTIALS_RAW service account has Storage Object Creator/Viewer roles. Manual bucket creation is sufficient for local testing (the legacy `terraform/gcs/examples-bucket.tf` and `docs/deployment-guide.md` were removed). Priority: Critical (blocks example caching from persisting to GCS).

### Story 15.11 — Quiz Feature Extensions (incomplete AC items)

- [ ] **[Item 10] Multi-meaning word support** — Words like 行 (xíng/háng) and 花 (huā flower/spend) should accept ANY matching variant for the alternate reading. The old CSV-based `validation.ts`/`parseWordEntry()` approach was removed in the quiz rework to the strategy pattern — multi-meaning support now lives at the strategy/question level (e.g. `AudioToPinyinAndToneStrategy`) and in the results UI. See story BR AC: "Multi-Meaning/Reading Support".

- [ ] **[Item 19] Results page for multi-meaning words** — `QuizResults.tsx` / `CategoryBreakdown.tsx` shows only one expected answer per row. Needs to display which variant user answered + all acceptable forms when a question has alternatives. Depends on Item 10.

- [ ] **[Item 23] "Review Mistakes" button on results page** — `QuizResults.tsx` has a retry path via `quizSessionStore.retry()` but no way to retry only the incorrect questions. Add a "Review Mistakes" button that starts a new session using only the questions where the answer was incorrect.

- [ ] **Add direct unit test for `PhaseGateBadge`** — pass/fail/guest states; currently covered only via page-level `QuizPageFull` stories.

- [ ] **[Item 14] Quiz filter provider (HSK/topic/interest)** — `QuizFilterProvider` interface not created. Needed by Epic 17 (Knowledge Hub) to support filtering quiz questions by HSK level, topic, or user interests. Define interface with default no-op implementation only.

- [ ] **[Item 27] FeedbackProvider abstraction** — No strategy pattern for AI vs pre-generated feedback. Currently hardcoded to call the AI endpoint. Define `FeedbackProvider` interface + `AIFeedbackProvider` and `DatabaseFeedbackProvider` stubs to enable future cost-reduction (Epic 17).

## Backlog

- [ ] **(Story 16.3 Tech Debt) HSK Validation Architectural Fix** — Example generation validation was made advisory-only (non-fatal) to unblock multi-character word examples (e.g., "包子"). Root cause: when tokenization falls back to character-level splitting, multi-char target words fail validation because individual characters don't match the multi-char word. Proper fix requires: (1) ensure nodejieba or word-list tokenizer works reliably, (2) implement multi-char word reconstruction logic for character fallback, (3) populate full HSK 1-3 vocabulary (500+ words in `packages/shared-constants/hsk-1-3.json`), (4) add test coverage for multi-char words. Effort: ~2 hours. Files: `packages/shared-constants/hsk-1-3.json`. Priority: Medium (examples work now, validation stricter later).

- [ ] **(A10) Apply `/v1` prefix at mount level in `src/app/routes.ts`** — currently each route file hardcodes `/v1/` in its path strings. Should be applied once via `router.use('/v1', xRouter)`. Blocked by: `ROUTE_PATTERNS` in `@mandarin/shared-constants` already bake in `/v1/` and are shared with the frontend — requires a coordinated change across both packages. See `apps/backend/src/app/routes.ts`.

- [ ] Standardize API response structure - Document and enforce consistent response format across all backend endpoints (currently returns data directly; consider standardizing with or without wrapper like `{ success, data }`)

- [ ] Refactor services to direct export pattern - Remove Service wrapper classes, export audioApi/conversationApi objects like progressService (Epic 14 follow-up)

- [ ] Migrate auth to React Query + Axios - Replace custom `authFetch` with industry standards
- [ ] Improve backend error logging - Add structured error objects and request IDs

### Future Epics (Long-term)

- [ ] **Epic: Advanced Spaced Repetition (FSRS)** - Replace exponential algorithm with ML-powered FSRS v6 (DSR model, 21 parameters, 20-30% fewer reviews for same retention). Requires mathematical modeling + backend refactor. Dependencies: Epic 15. References: `docs/knowledge-base/learning-theory/spaced-repetition-algorithms.md` (FSRS vs SM-2, DSR model).

- [ ] **Epic: Handwriting Recognition System** - Canvas-based character input (40x40mm) with stroke-order validation and CNN for 30K+ character recognition. Highest retention value for orthographic production. Requires ML model integration (Apple-style CNN or Vision API). Dependencies: Epic 15. Mobile-optimized UI critical.

## Done

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

Last updated: July 2026
