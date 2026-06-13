# Epic 20: Mnemonic Stories

## Epic Summary

**Goal:** Generate AI-powered mnemonic stories for Chinese characters to accelerate memorization using the Heisig/Chineasy method of turning radicals into memorable narratives.

**Key Points:**

- AI-generated mnemonic stories using Gemini API (reuse `CachedAIFeedbackService` pattern from Epic 15)
- Each mnemonic decomposes character into radicals + tells a memorable story (e.g., 怕 = heart radical 忄 + white 白 → "blood leaves heart, face turns white")
- Redis caching for generated mnemonics (same TTL pattern as Epic 15 AI feedback)
- Character decomposition data from Make Me a Hanzi (MIT license, 9000+ characters with etymology)
- Display inline with word detail or dedicated mnemonic panel
- Knowledge Base article already has prompt design and user personalization strategy

**Status:** Planned

**Last Update:** June 14, 2026

## Background

## User Stories

This epic consists of the following user stories:

1. **Story 19.1: Mnemonic Generation Backend** _(link to `story-19-1-mnemonic-generation-backend.md`)_
   - As a backend developer, I want to implement Gemini API integration for mnemonic story generation with Redis caching, so that learners receive AI-generated mnemonics on demand.

2. **Story 19.2: Mnemonic Display UI** _(link to `story-19-2-mnemonic-display-ui.md`)_
   - As a learner, I want to see mnemonic stories alongside characters in word detail view, so that I can use storytelling to remember characters.

3. **Story 19.3: Character Decomposition Data** _(link to `story-19-3-character-decomposition-data.md`)_
   - As a developer, I want to import Make Me a Hanzi decomposition and etymology data, so that mnemonic generation has accurate radical breakdowns to work from.

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- Story 19.1 builds backend infrastructure (reuses known pattern from Epic 15)
- Story 19.2 builds frontend display
- Story 19.3 prepares data foundation (can run in parallel with 19.1)

Stories 19.1 and 19.3 are independent and can be developed in parallel, while Story 19.2 depends on both being complete to display generated mnemonics in the UI.

## Acceptance Criteria

## Architecture Decisions

## Implementation Plan

## Risks & mitigations

## Implementation notes
