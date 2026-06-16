# Epic 19: Radicals & Character Composition

## Epic Summary

**Goal:** Build an interactive radical database and character decomposition browser so learners can understand character composition through Kangxi radicals, following the adult learning roadmap's "Radicals First, Characters Second" principle.

**Key Points:**

- 214 Kangxi radical database with character, pinyin, meaning, stroke count sourced from Unicode Han Database
- Interactive radical browser with search/filter by stroke count or meaning
- ★ **Top 20 radicals** emphasized with visual badge — covers 70% of common characters
- **Mnemonic generation embedded** in Radical Detail Card — "Generate Story" button on example characters. No standalone mnemonics page.
- "Radical Trees" — Phase 2: learn what a radical is. Phase 3: click a mastered radical to see all HSK characters containing it (expansion mode).
- Static JSON content in public/data/ — no backend API dependencies
- Import decomposition data from Make Me a Hanzi (MIT license, 9000+ characters)

**Status:** Planned

**Last Update:** June 16, 2026

## Background

## User Stories

This epic consists of the following user stories:

1. **Story 18.1: Radical Database** _(link to `story-18-1-radical-database.md`)_
   - As a developer, I want to create the 214 Kangxi radical dataset with character, pinyin, meaning, and stroke count, so that the frontend has complete reference data.

2. **Story 18.2: Radical Browser** _(link to `story-18-2-radical-browser.md`)_
   - As a learner, I want to browse and search radicals by stroke count, pinyin, or meaning, so that I can discover and learn radicals systematically.

3. **Story 18.3: Radical Trees** _(link to `story-18-3-radical-trees.md`)_
   - As a learner, I want to click a radical and see all HSK characters that contain it, so that I can build "radical trees" and recognize patterns across characters.

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- Story 18.1 creates the data foundation (JSON dataset)
- Story 18.2 builds the reference browsing experience with ★ top-20 badges
- Story 18.3 adds the "radical trees" exploratory feature — Phase 2 mode (learn) + Phase 3 mode (expand)

Story 18.1 establishes the data foundation. Story 18.2 builds the browsing/search UI. Story 18.3 extends with radical trees and embeds mnemonic generation in the detail card.

## Acceptance Criteria

## Architecture Decisions

## Implementation Plan

## Risks & mitigations

## Implementation notes
