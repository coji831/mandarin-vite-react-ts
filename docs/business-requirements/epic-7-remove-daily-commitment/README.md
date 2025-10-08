# Epic 7: Remove Daily-Commit Flow — Simplify Vocabulary → Flashcard Flow

## Epic Summary

**Goal:** Remove the "Set Daily Commitment" step and section-selection workflow so learners go directly from selecting a vocabulary list to studying flashcards. Replace section-based progress with a per-list, per-word progress map keyed by `wordId` and use a stable `listId` for routing.

**Key Points:**

- Add a stable `id` field to each vocabulary-list manifest for reliable indexing and programmatic navigation (use `listId` in routes).
- Remove intermediate pages and routes used only by the commitment/section flow.
- After selecting a vocabulary list, navigate immediately to `/mandarin/flashcards/:listId` and load the full word list.
- Persist progress as `ListProgress.progress[wordId]` (per-list map) instead of per-section objects.
- Provide a migration path from `sections` → `progress` with a local backup and `migratedAt` metadata.
- Keep audio/TTS idempotent and on-demand (cache-check before generation); reuse existing TTS/caching patterns.

**Status:** Completed

**Last Update:** 2025-10-07

## Background

The current flow requires learners to set a daily commitment and then study by automatically-created sections. This added UX friction and produced a section-centric persisted model that complicates lookups and deep links. Simplifying to a list-first flow reduces complexity, improves deep-linking, and makes progress tracking more direct and robust for future multi-user scenarios.

## User Stories

This epic consists of the following user stories (reordered and reindexed for a gated, verifiable workflow):

1. #7-1 / [**Add stable listId to vocabulary manifests & normalize wordId**](./story-7-1-add-listid.md)

   - As a developer, I want each vocabulary list manifest to include a stable `id` (aka `listId`) and for `csvLoader` to normalize `wordId` to a string so routing and progress lookups are reliable.

2. #7-2 / [**Open flashcards directly after list selection**](./story-7-2-open-flashcards-directly.md)

   - As a learner, I want to select a vocabulary list and immediately start studying so I don't have to set a daily commitment first.

3. #7-3 / [**Add flashcards route and ensure FlashCardPage receives listId**](./story-7-3-add-flashcards-route.md)

   - As a developer, I want a route `/mandarin/flashcards/:listId` so the FlashCard page can be deep-linked per-list.

4. #7-4 / [**Update MandarinRoutes to remove old routes and add new**](./story-7-4-update-routes.md)

   - As a developer, I want the router updated so `/mandarin/flashcards/:listId` exists and old commit/section routes are removed.

5. #7-5 / [**Refactor useMandarinProgress API**](./story-7-5-refactor-progress-hook.md)

   - As a developer, I want `useMandarinProgress` to expose list-focused APIs (`selectVocabularyList`, `loadProgressForList`, `markWordLearned`) and remove `selectedSectionId`.

6. #7-6 / [**FlashCardPage: load list by listId and render deck**](./story-7-6-flashcard-load-list.md)

- As a learner, I want the FlashCard page to load words for the chosen list in CSV order and update per-word progress.

11. #7-7 / [**Sidebar & index UI show full list and mastery states**](./story-7-7-sidebar-mastery.md)

- As a learner, I want the sidebar and index to highlight mastered words using `progress[wordId]`.

12. #7-8 / [**Show per-list progress on ListSelect page cards**](./story-7-8-list-progress-card.md)

- As a learner, I want to see my progress for each vocabulary list directly on its card in the ListSelect page so I can track mastery and choose what to study next.

13. #7-9 / [**Archive/remove commitment & section pages**](./story-7-9-archive-pages.md)

- As a developer, I want to archive or remove `DailyCommitmentPage`, `SectionSelectPage`, and related pages to reduce dead code.

14. #7-10 / [**Update docs and references for removed flow**](./story-7-10-update-docs.md)

- As a technical writer, I want docs updated so there are no references to the legacy daily-commitment flow.

- As a learner, I want to see my progress for each vocabulary list directly on its card in the ListSelect page so I can track mastery and choose what to study next.

## Story Breakdown Logic

This epic is divided into stories based on a gated approach so each story can be completed and verified before moving to the next:

Stories [7.1-7.1] focus on adding a stable `listId` to vocabulary manifests & normalizing `wordId` (Planned)
Stories [7.2-7.3] focus on navigation and routing smoke (add flashcards route, update routes) (Planned)
Stories [7.4-7.7] focus on refactoring `useMandarinProgress`, FlashCardPage, and sidebar UI to the new model (Planned)
Story [7.8] focuses on showing per-list progress on ListSelect page cards for better UX (Planned)
Story [7.9] focuses on archiving/removing legacy commitment/section pages once new flows are stable (Planned)
Story [7.10] focuses on updating docs and references for the removed flow (Planned)

[Rationale]: Break the epic into small, gated stories that are easy to review and verify. Sequence work so data normalization and migration (with backups and reporting) are in place before changing routing or writes. Use a compatibility adapter/feature flag where needed so UIs can read old and new shapes during rollout. This minimizes risk and keeps PRs reviewable and reversible. Story #7-12 ensures per-list progress is surfaced on the ListSelect page for better UX and motivation, positioned after core UI components but before cleanup tasks.

## Acceptance Criteria

Write Acceptance Criteria as a Markdown task-list. Add as many items as needed and map each item to a story or test.

- [ ] Add a stable `id` (`listId`) to all vocabulary manifests and update manifest validation.
- [ ] Normalize `wordId` to strings in `csvLoader` and add unit tests for edge cases.
- [ ] Implement a one-time migration from `sections` → `ListProgress` that writes `migratedAt` and `migratedFromVersion`, and creates a local backup before any destructive write.
- [ ] Update list selection navigation to `/mandarin/flashcards/:listId` and ensure FlashCardPage renders the deck in CSV order with a loading indicator as needed.
- [ ] Persist per-list progress as `ListProgress.progress[wordId]`; marking a word updates persisted state and mastery indicators and survives reloads.
- [ ] Produce migration reports that include `copiedIds` and `skippedIds`, and surface migration errors for investigation.
- [ ] Add unit and integration tests covering `csvLoader` normalization, migration logic, routing/navigation, and progress persistence.

## Architecture Decisions

- Decision: Introduce a stable `listId` field in each vocabulary manifest (choice: add `id` string).

  - Rationale: routing, deep links, and per-list persisted progress require a stable identifier independent of filenames or array indices.
  - Alternatives considered: derive id from filename (fragile), runtime-generated UUIDs (unstable across installs).
  - Implications: manifests must be updated and indexed code migrated to use `listId`.

- Decision: Persist per-list progress as a map `ListProgress.progress: Record<string, ProgressEntry>`.

  - Rationale: O(1) lookups and simpler updates by `wordId`.
  - Alternatives considered: keep section arrays or numeric indices (fragile).
  - Implications: provide a read adapter during migration and update write flows.

- Decision: Run migration on first app load with a local backup key and metadata.

  - Rationale: automated migration reduces manual steps and allows progressive rollout.
  - Implications: must provide rollback instructions and log/report migration outcomes.

## Implementation Plan

Provide a short, ordered list of implementation step titles that reflect the gated story order. Each step should be completed and verified before proceeding to the next.

1. Data model & loader updates
2. Migration utilities & safe backup
3. Migration reporting & rollback docs
4. Compatibility adapter & feature flag
5. Routing & navigation smoke changes
6. Refactor hooks & UI components
7. Sidebar/index UI shows mastery states
8. Show per-list progress on ListSelect page cards
9. Cleanup legacy pages & code
10. Documentation, QA, and release

## Risks & mitigations

- Risk: Migration corruption or data loss during sections→progress transformation — Severity: High

  - Mitigation: Create local backup before any destructive writes, validate migration output, provide rollback instructions
  - Rollback: Restore from backup key and revert to previous app version

- Risk: Deep-link breakage when changing from section-based to list-based routing — Severity: Medium

  - Mitigation: Implement compatibility redirects for old URLs during transition period
  - Rollback: Revert routing changes and restore section-based navigation

- Risk: Performance degradation from loading full vocabulary lists instead of sections — Severity: Low

  - Mitigation: Implement lazy loading and virtualization for large lists
  - Rollback: Re-enable section-based chunking if performance issues persist

## Implementation notes

- Vocabulary lists: extend the manifest to include an `id` field and prefer `listId` for programmatic navigation; continue showing a human-friendly `name` in the UI.
- Progress helpers: implement `progressHelpers` and `progressMigration` as a small, migration-only module. Because the app currently targets a single local user, these helpers may be removed or simplified after migration completes; reintroduce a more robust helpers module if/when multi-user persistence or server-side sync is added.
