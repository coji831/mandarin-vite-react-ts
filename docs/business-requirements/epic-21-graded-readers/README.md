# Epic 21: Graded Readers

## Epic Summary

**Goal:** Provide AI-generated graded reading passages at controlled HSK vocabulary levels so learners can practice reading in context, with inline word lookup, sentence-level audio, and progress tracking.

**Key Points:**

- AI-generated passages via Gemini API constrained to specific HSK vocabulary levels (HSK 1 → 2 → 3 → 4+)
- **95/5 rule** — each passage is ~95% known words (from user's previous phases) and ~5% new target words
- **HSK-level unlock** — readers unlock when user knows ≥90% of that HSK level (tracked via progress API)
- Reading UI with sentence highlighting, inline word lookup (pinyin + meaning on tap/hover → inline popover → full Character Hub)
- Per-sentence TTS audio playback (reuse existing AudioService)
- Reading progress tracking (completed passages, bookmarks, reading history)
- **Phonetic Clusters** — bonus feature: characters grouped by shared phonetic element (e.g., 青 family: 请情清晴). Accessible from Phase 3 tab.
- Content stored in database (generated on demand, cached for reuse)
- Phase 3 of learning roadmap — requires vocabulary/radical knowledge first

**Status:** Planned

**Last Update:** June 16, 2026

## Background

## User Stories

This epic consists of the following user stories:

1. **Story 20.1: Passage Generation Backend** _(not yet created)_
   - As a **backend developer**, I want to **implement Gemini API integration for HSK-level constrained passage generation with content caching**, so that **learners receive reading material at their level**.

2. **Story 20.2: Reading UI** _(not yet created)_
   - As a **learner**, I want to **read passages with inline word lookup (tap/hover for pinyin + meaning)**, so that **I can understand new characters in context**.

3. **Story 20.3: Audio Sync** _(not yet created)_
   - As a **learner**, I want to **hear each sentence read aloud via TTS**, so that **I can practice listening and pronunciation simultaneously**.

4. **Story 20.4: Reading Progress** _(not yet created)_
   - As a **learner**, I want to **track which passages I've completed and bookmark my position**, so that **I can resume reading later**.

5. **Story 20.5: Phonetic Clusters** _(not yet created)_
   - As a **learner**, I want to **browse characters grouped by shared phonetic elements**, so that **I can recognize pronunciation patterns and guess how new characters sound**.

## Story Breakdown Logic

This epic is divided into stories based on architectural layering:

- **Story 20.1** builds the backend (generation + caching)
- **Story 20.2** builds the frontend reading experience
- **Story 20.3** adds the audio layer on top of the reading UI
- **Story 20.4** adds the persistence layer for progress tracking
- **Story 20.5** builds the Phonetic Clusters browser (data + UI in one story, static content)

Each story builds on the previous one. Story 20.5 is independent of the reader pipeline but lives in the same Phase 3 tab group.

## Acceptance Criteria

## Architecture Decisions

## Implementation Plan

## Risks & mitigations

## Implementation notes
