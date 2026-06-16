# Epic 20: Mnemonic Stories — Implementation

**BR Reference:** `docs/business-requirements/epic-20-mnemonic-stories/README.md`

**Status:** Planned

**Last Update:** June 16, 2026

---

## Architecture Decisions

| Decision             | Choice                                                                  | Rationale                                                                    |
| -------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **AI integration**   | Gemini API via `CachedAIFeedbackService` (Epic 15 pattern)              | Proven pattern. Redis caching, rate limiting, error handling.                |
| **Auto-save**        | Story saves on generation — no explicit save action                     | Decision #3. User can edit or regenerate later.                              |
| **Embedding**        | No standalone page — embedded in RadicalDetailCard + CharacterDetailHub | Decision #2. Mnemonics are a feature of radicals, not a standalone activity. |
| **Storage**          | Backend API: `POST /api/mnemonics`, `GET /api/mnemonics/:char`          | Per-character, per-user. `edited` flag for custom stories.                   |
| **Cache key**        | `mnemonic:{character}` — shared across users (unless edited)            | Same story for same char saves API calls.                                    |
| **When NOT to show** | Simple pictographs (山, 日, 人, 水, 火) — skip generation               | Visual learning is more efficient. No story needed.                          |

---

## Stories

### Story 19.1: Mnemonic Generation Backend

**Files:** `apps/backend/src/modules/mnemonics/`

**AC:** Gemini API integration. Redis caching (7-day TTL). Auto-save on generation. Rate limiting. Error handling (retry, empty response). Prompt template: decompose char → radical list → generate memorable story.

### Story 19.2: Mnemonic Display UI

**Files:** Embedded in `RadicalDetailCard.tsx` (generate button) + `CharacterDetailHub.tsx` (mnemonic section)

**AC:** "Generate Story" button on example characters in Radical Detail Card. Loading spinner during generation. Story appears in Hub's mnemonic section. Edit/Regenerate actions. No standalone mnemonics page.

### Story 19.3: Character Decomposition Data

**Files:** `public/data/radicals/decomposition.json`, `scripts/import-decomposition.js`

**AC:** Import Make Me a Hanzi decomposition data (9000+ chars). Each entry: character → list of constituent radicals. Used by mnemonic prompt to provide radical breakdown context.

---

## Risks

| Risk                                  | Mitigation                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------- |
| Gemini API latency (3-5s generation)  | Show loading spinner with "Creating mnemonic..." text. Cache aggressively. |
| Low-quality stories                   | Auto-regenerate on empty/bad response. Allow user regeneration.            |
| Make Me a Hanzi import format changes | Pin git commit hash. Add validation to import script.                      |
