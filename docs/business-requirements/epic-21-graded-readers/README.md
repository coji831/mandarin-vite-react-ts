# Epic 21: Graded Readers

## Epic Summary

**Goal:** Provide AI-generated graded reading passages at controlled HSK vocabulary levels so learners can practice reading in context, with inline word lookup, sentence-level audio, and progress tracking.

**Key Points:**

- AI-generated passages via Gemini API constrained to specific HSK vocabulary levels (HSK 1 → 2 → 3 → 4+)
- Reading UI with sentence highlighting, inline word lookup (pinyin + meaning on tap/hover)
- Per-sentence TTS audio playback (reuse existing AudioService)
- Reading progress tracking (completed passages, bookmarks, reading history)
- Content stored in database (generated on demand, cached for reuse)
- Phase 3 of learning roadmap — requires vocabulary/radical knowledge first

**Status:** Planned

**Last Update:** June 14, 2026

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

## Story Breakdown Logic

This epic is divided into stories based on architectural layering:

- **Story 20.1** builds the backend (generation + caching)
- **Story 20.2** builds the frontend reading experience
- **Story 20.3** adds the audio layer on top of the reading UI
- **Story 20.4** adds the persistence layer for progress tracking

Each story builds on the previous one: the backend must exist before the UI can consume it, audio requires the reading UI, and progress tracking requires the reading session infrastructure.

## Acceptance Criteria

## Architecture Decisions

## Implementation Plan

## Risks & mitigations

## Implementation notes
