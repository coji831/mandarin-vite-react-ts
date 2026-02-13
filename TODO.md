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

## Backlog

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
