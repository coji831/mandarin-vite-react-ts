# Epic 20: Mnemonic Stories

## Epic Summary

**Goal:** Generate AI-powered mnemonic stories for Chinese characters to accelerate memorization using the Heisig/Chineasy method of turning radicals into memorable narratives.

**Key Points:**

- AI-generated mnemonic stories using Gemini API (reuse `CachedAIFeedbackService` pattern from Epic 15)
- Each mnemonic decomposes character into radicals + tells a memorable story (e.g., 怕 = heart radical 忄 + white 白 → "blood leaves heart, face turns white")
- **Auto-save** — no explicit save action. Story saves automatically when generated. User can edit or regenerate later.
- 📖 button moved: **No standalone mnemonics page** — embedded in Character Detail Hub (mnemonic section), accessed via HubActions
- Redis caching for generated mnemonics (30-day TTL) with stampede prevention
- Character decomposition data from Make Me a Hanzi (MIT license, 9000+ characters with etymology)
- Knowledge Base article already has prompt design and user personalization strategy
- **Phase 2 content** — gated behind radical unlocking
- **Mobile-friendly:** mnemonic button in HubActions to avoid overflow
- **Accessible design** with full ARIA support

**Status:** Planned

**Last Update:** July 20, 2026

## Background

## User Stories

This epic consists of the following user stories:

1. **Story 20.3: Character Decomposition Data** ([story-20-3-character-decomposition-data.md](story-20-3-character-decomposition-data.md))
   - As a developer, I want to import Make Me a Hanzi decomposition and etymology data, so that mnemonic generation has accurate radical breakdowns to work from.

2. **Story 20.1: Mnemonic Generation Backend** ([story-20-1-mnemonic-generation-backend.md](story-20-1-mnemonic-generation-backend.md))
   - As a backend developer, I want to implement Gemini API integration for mnemonic story generation with Redis caching, so that learners receive AI-generated mnemonics on demand.

3. **Story 20.2: Mnemonic Display UI** ([story-20-2-mnemonic-display-ui.md](story-20-2-mnemonic-display-ui.md))
   - As a **learner**, I want to **see mnemonic stories embedded in the Radical Detail Card and Character Detail Hub**, so that **I can use storytelling to remember characters without navigating to a separate page**.

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- Story 20.3 (data import) runs first to provide radical decomposition data
- Story 20.1 (backend API) follows
- Story 20.2 (frontend UI) depends on both being complete

Story 20.3 must be completed first to provide radical decomposition data. Story 20.1 builds the backend API once data is available. Story 20.2 depends on both being complete to display generated mnemonics in the UI.

## Acceptance Criteria

1. ✅ User can generate a mnemonic story for any character with radical decomposition data
2. ✅ Story auto-saves on generation — no explicit save action
3. ✅ User can edit a generated story
4. ✅ User can regenerate a story (confirmation before replacing edits)
5. ✅ Simple pictographs show info message instead of generating
6. ✅ Mnemonic story works on mobile (320px+) without overflow
7. ✅ All interactive elements have proper ARIA labels
8. ✅ Phase 2+ users can access mnemonics; Phase 1 users see nothing

## Architecture Decisions

| Decision           | Choice                                                                    | Rationale                                                                                   |
| ------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **AI integration** | Gemini API via `CachedAIFeedbackService` (Epic 15 pattern)                | Proven pattern. Redis caching, rate limiting, error handling.                               |
| **Auto-save**      | Story saves on generation — no explicit save action                       | User can edit or regenerate later.                                                          |
| **Embedding**      | No standalone page — embedded in CharacterHub (📖 button in HubActions)   | Mnemonics are a feature of characters, not a standalone activity. Prevents mobile overflow. |
| **Caching**        | 30-day Redis TTL for AI-generated stories                                 | Reduced API costs. Same story for same character saves calls.                               |
| **Rate limiting**  | 10 req/min per-user for AI generation                                     | Prevents abuse of AI API.                                                                   |
| **Pictographs**    | Simple pictographs (山, 日, 人, etc.) skip generation — show info message | Visual learning is more efficient. No story needed.                                         |

## Implementation Plan

1. Story 20.3: Import Make Me a Hanzi decomposition data
2. Story 20.1: Build backend module (API, AI, caching, validation)
3. Story 20.2: Build frontend UI (HubMnemonicSection, HubActions button, Textarea)

## Risks & mitigations

| Risk                                    | Mitigation                                                    |
| --------------------------------------- | ------------------------------------------------------------- |
| Gemini API latency (5-8s generation)    | 15s client timeout, loading spinner with "Creating mnemonic…" |
| Cache stampede (10 concurrent requests) | Redis SETNX lock per glyph                                    |
| Low-quality stories                     | Auto-regenerate on bad response. User can edit or regenerate  |
| Make Me a Hanzi import changes          | Pin git commit hash                                           |
| Mobile overflow (3+ buttons at 320px)   | 📖 moved to HubActions                                        |
| Story HTML injection                    | Server-side sanitization strips HTML tags                     |

## Implementation notes
