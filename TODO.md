# TODO — Project-wide (GitHub-friendly)

**Audience:** Project maintainers, developers tracking tasks  
**Last Updated:** January 2026

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

- [ ] **Google Gemini** - Migrate from Gemini 2.0 Flash and Gemini 2.0 Flash Lite to Gemini 3.1 Flash Lite Preview

### Story 15.11 — Quiz Feature Extensions (incomplete AC items)

- [ ] **[Item 10] Multi-meaning word support** — Words like 行 (xíng/háng) and 花 (huā flower/spend) fail validation for the alternate reading. Need `parseWordEntry()` in `validation.ts` to extract all acceptable answers from CSV (semicolons, pipes, parenthetical annotations). Validation should accept ANY matching variant. See story BR AC: "Multi-Meaning/Reading Support".

- [ ] **[Item 19] Results page for multi-meaning words** — `ResultsTable.tsx` shows only one expected answer per row. Needs to display which variant user answered + all acceptable forms when word has alternatives. Depends on Item 10.

- [ ] **[Item 23] "Review Mistakes" button on results page** — `ResultsLayout.tsx` has a "New Quiz" path via `handleRetry()` but no way to retry only the incorrect questions. Add a "Review Mistakes" button that starts a new session using only the `wordId`s where `correct: false` from `sessionSummary.allAnswers`.

- [ ] **[Item 26] Execute /mandarin → /learning folder rename** — `apps/frontend/src/features/learning/` is an empty directory placeholder. Actual rename of `mandarin/` with all import updates (~120 imports across ~45 files) and route constant changes deferred. Requires a coordinated zero-downtime migration.

- [ ] **[Item 14] Quiz filter provider (HSK/topic/interest)** — `QuizFilterProvider` interface not created. Needed by Epic 17 (Knowledge Hub) to support filtering quiz questions by HSK level, topic, or user interests. Define interface with default no-op implementation only.

- [ ] **[Item 27] FeedbackProvider abstraction** — No strategy pattern for AI vs pre-generated feedback. Currently hardcoded to call the AI endpoint. Define `FeedbackProvider` interface + `AIFeedbackProvider` and `DatabaseFeedbackProvider` stubs to enable future cost-reduction (Epic 17).

## Backlog

- [ ] **(A7) Move AI prompt/conversation utils out of `utils/`** — `promptUtils.js` and `conversationUtils.js` contain AI-domain logic sitting in a generic `utils/` folder. Move to `core/domain/` or `infrastructure/external/`. Blocked by: need to audit all callers (ConversationService, CachedAIFeedbackService, ConversationController). See TODOs in `apps/backend/src/utils/promptUtils.js` and `apps/backend/src/utils/conversationUtils.js`.

- [ ] **(A10) Apply `/v1` prefix at mount level in `routes/index.js`** — currently each route file hardcodes `/v1/` in its path strings. Should be applied once via `router.use('/v1', xRouter)`. Blocked by: `ROUTE_PATTERNS` in `@mandarin/shared-constants` already bake in `/v1/` and are shared with the frontend — requires a coordinated change across both packages. See TODO in `apps/backend/src/api/routes/index.js`.

- [ ] Standardize API response structure - Document and enforce consistent response format across all backend endpoints (currently returns data directly; consider standardizing with or without wrapper like `{ success, data }`)

- [ ] Refactor services to direct export pattern - Remove Service wrapper classes, export audioApi/conversationApi objects like progressService (Epic 14 follow-up)

- [ ] Migrate auth to React Query + Axios - Replace custom `authFetch` with industry standards
- [ ] Improve backend error logging - Add structured error objects and request IDs

### Future Epics (Long-term)

- [ ] **Epic: Advanced Spaced Repetition (FSRS)** - Replace exponential algorithm with ML-powered FSRS v6 (DSR model, 21 parameters, 20-30% fewer reviews for same retention). Requires mathematical modeling + backend refactor. Dependencies: Epic 15. References: `docs/business-requirements/epic-15-learning-retention/Vocabulary-Retention-Feature-Design.md` (FSRS section).

- [ ] **Epic: Handwriting Recognition System** - Canvas-based character input (40x40mm) with stroke-order validation and CNN for 30K+ character recognition. Highest retention value for orthographic production. Requires ML model integration (Apple-style CNN or Vision API). Dependencies: Epic 15. Mobile-optimized UI critical.

- [ ] **Epic: Radical-Based Learning** - "Select radical" question type + character decomposition viewer. Builds discrimination learning for similar characters. Requires 214 Kangxi radical database + character breakdown logic. Dependencies: Epic 15, Epic 17 (Knowledge Hub). Optional: AI-generated radical etymology + mnemonics via LLM.

- [ ] **Epic: Progress Visualization Dashboard** - Mastery heatmap (red/green zones), retention curves, weak area identification. Self-efficacy boost through visual progress tracking. Requires data aggregation + charting library (Chart.js/D3). Dependencies: Epic 15. No AI needed.

## Done

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

Last updated: January 2026
