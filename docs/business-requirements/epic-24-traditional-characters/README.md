# Epic 24: Traditional Character Toggle

## Epic Summary

**Goal:** Provide a global toggle that switches the app's character display between Simplified and Traditional Chinese, enabling Phase 4 learners to visually contrast character forms and read traditional texts.

**Key Points:**

- Global toggle switch in the navigation bar (简体/繁體 dropdown)
- Applies to ALL character display: Learn tabs, Character Detail Hub, Graded Readers, Grammar examples, Chengyu
- Does NOT change: UI text (buttons, labels stay English), Pinyin display, user settings
- Each character in the Character Detail Hub shows its traditional form alongside simplified when toggled
- Learners can visually compare transformations (e.g., 门 → 門, 学 → 學, 爱 → 愛)
- Requires Simplified Chinese foundation — gated to Phase 4+
- Static character mapping data (Simplified → Traditional lookup table)
- No backend API dependencies

**Status:** Planned

**Last Update:** June 16, 2026

## Background

Traditional Chinese characters retain the original character structures that often reveal the semantic and phonetic components more clearly. For advanced learners, understanding traditional forms deepens character comprehension and enables reading of historical texts, Taiwanese/Hong Kong media, and classical Chinese literature.

This epic is the first feature in **Phase 4: Advanced Fluidity** — it unlocks after all Phase 1-3 content is complete.

## User Stories

This epic consists of the following user stories:

1. **Story 24.1: Character Mapping Data**
   - As a developer, I want to create a Simplified → Traditional character mapping dataset, so that the toggle can convert characters across the app.

2. **Story 24.2: Toggle UI & Global State**
   - As a learner, I want to toggle between Simplified and Traditional characters from the navigation bar, so that I can see both forms and learn to recognize traditional text.

## Story Breakdown Logic

This epic is divided into stories based on a data-first approach:

- **Story 24.1** creates the character mapping dataset (likely an open-source mapping table)
- **Story 24.2** implements the global toggle UI and state management

Story 24.1 must be completed first since the UI depends on the mapping data to function.

## Acceptance Criteria

<!-- Leave empty -->

## Architecture Decisions

<!-- Leave empty -->

## Implementation Plan

<!-- Leave empty -->

## Risks & mitigations

- Character mapping must handle edge cases (1-to-many mappings, same-in-both-forms characters)
- Toggle state should persist across sessions (user preference stored in backend API)
- Some characters have multiple traditional forms (e.g., 面 → 面/麵) — use standard mapping table
