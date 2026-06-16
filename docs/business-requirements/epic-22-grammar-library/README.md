# Epic 22: Grammar Pattern Library

## Epic Summary

**Goal:** Provide a searchable reference library of common Chinese grammar patterns with example sentences, HSK level tagging, and usage notes.

**Key Points:**

- **Spans Phases 2-4** with gated content visibility:
  - **Phase 2**: Basic structures (SVO, Time placement, 吗 questions)
  - **Phase 3**: Advanced particles (了 le, 过 guò, conjunctions 因为...所以)
  - **Phase 4**: Complex syntax (把 bǎ disposal, 被 bèi passive)
- 20+ common grammar patterns across all phases
- 3+ example sentences per pattern with Chinese, pinyin, and English
- HSK level tagging for each pattern
- Searchable by English keyword or HSK level
- Static JSON content in `public/data/` — no backend API dependencies
- Each example word clickable → opens Character Detail Hub

**Status:** Planned

**Last Update:** June 16, 2026

## Background

<!-- Leave empty -->

## User Stories

This epic consists of the following user stories:

1. **Story 21.1: Grammar Data** _(not yet created)_
   - As a **developer**, I want to **create the grammar patterns dataset with examples and HSK levels**, so that **the frontend has complete reference data**.

2. **Story 21.2: Grammar UI** _(not yet created)_
   - As a **learner**, I want to **browse and search grammar patterns**, so that **I can reference sentence structures while studying**.

## Story Breakdown Logic

This epic is divided into stories based on a data-first approach:

- **Story 21.1** focuses on data creation — building the JSON dataset of grammar patterns with examples, pinyin, English translations, and HSK level tags.
- **Story 21.2** focuses on the frontend experience — implementing the browse, search, and display UI that consumes the static data from Story 21.1.

Data is completed first so the UI can be developed and tested against real content from the start.

## Acceptance Criteria

<!-- Leave empty -->

## Architecture Decisions

<!-- Leave empty -->

## Implementation Plan

<!-- Leave empty -->

## Risks & mitigations

<!-- Leave empty -->

## Implementation notes

<!-- Leave empty -->
