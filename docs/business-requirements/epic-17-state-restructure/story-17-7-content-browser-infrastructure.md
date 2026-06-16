# Story 17.7: Content Browser Infrastructure

## Description

**As a** developer,
**I want to** build the shared Content Browser component — a unified mixed-card grid with type badges, search bar, filter dropdowns, and tab-based filtering,
**So that** all Phase 1-4 content types share a consistent browsing interface.

## Business Value

The current `VocabularyListPage` only handles vocabulary data. Future content types (radicals, phonetics, readers, grammar, chengyu) each need their own browse pages — leading to 6+ near-duplicate implementations. A shared `ContentBrowser` component eliminates this duplication by providing a data-driven browsing interface that any content type can use.

Benefits:

- Eliminates 6+ duplicate implementations of grid, search, filter, pagination
- Consistent UX across all content types (type badges, search, filter)
- Reusable infrastructure — content tabs just provide their data source
- Phase-gated content locked with 🔒 badge automatically
- Replaces `VocabularyListPage` — reduces codebase size

## Acceptance Criteria

- [x] `ContentCard` component built — polymorphic by `contentType` prop, renders type badge + card content
- [x] `ContentGrid` component built — responsive CSS grid (auto-fill, min 280px) with pagination (10/20/50 per page)
- [x] `SearchBar` component built — debounced text input (300ms), filters cards by Chinese/pinyin/english match
- [x] `FilterDropdown` component built — HSK level selector (1-6 + All) + Phase selector (1-4 + All)
- [x] `TabBar` component built — horizontal tabs: All, 🔤 Foundations, 📘 Radicals, 🔊 Phonetic, 📖 Readers, 📕 Grammar, 🏮 Chengyu
- [x] Type badges per card:
  - 🔤 Foundations (HSK 1 vocabulary)
  - 📘 Radicals
  - 🔊 Phonetic components
  - 📖 Readers (graded reading passages)
  - 📕 Grammar points
  - 🏮 Chengyu (idioms)
- [x] Locked content cards shown with 🔒 badge — cards from phases the user hasn't unlocked are visible but marked locked
- [x] `ContentBrowser/index.ts` barrel exports all components
- [x] Vocabulary list page updated to use `ContentBrowser` with vocabulary tab active
- [x] `VocabularyListPage` removed — route `/learn/vocabulary-list` redirects to `/learn`
- [x] All existing vocabulary browsing functionality preserved
- [x] `npm test` passes

## Business Rules

1. **Data-driven**: Content Browser receives data through a `ContentSource` interface — it doesn't import feature internals directly
2. **Polymorphic cards**: `ContentCard` renders different content based on `contentType` prop — card layout adapts to content type
3. **Phase gating**: Locked content is visible but marked with 🔒 — user can see what's coming but cannot access it
4. **URL-preserving**: Search query, selected tab, and filters are reflected in URL query params for shareability
5. **Replaces VocabularyListPage**: After this story, `/learn/vocabulary-list` redirects to `/learn` which shows the Content Browser

## Related Issues

- Epic 17: [State Restructure & Zustand Migration](README.md) (Epic parent)
- Future content epics (Radicals, Phonetics, Readers, Grammar, Chengyu) will consume this component

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: June 16, 2026
- **Key Commit**: (to be filled after commit)
