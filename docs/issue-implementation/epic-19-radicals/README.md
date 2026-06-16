# Epic 19: Radicals — Implementation

**BR Reference:** `docs/business-requirements/epic-19-radicals/README.md`

**Status:** Planned

**Last Update:** June 16, 2026

---

## Architecture Decisions

| Decision                | Choice                                                                      | Rationale                                                                                               |
| ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Radical data**        | Static JSON in `public/data/radicals/radicals.json`                         | 214 fixed entries. No backend needed.                                                                   |
| **Decomposition data**  | Make Me a Hanzi (MIT) — import to `public/data/radicals/decomposition.json` | 9000+ chars with radical breakdown. Open source.                                                        |
| **Mnemonic generation** | Gemini API via `CachedAIFeedbackService` (reuse Epic 15 pattern)            | Same caching/rate-limiting pattern. Redis TTL: 7 days.                                                  |
| **Mnemonic storage**    | Backend API (`POST /api/mnemonics`, `GET /api/mnemonics/:char`)             | Per-character, per-user. Auto-saved on generation.                                                      |
| **Radical Trees**       | Filter on decomposition data — no separate backend                          | `decomposition.json` maps radicals to characters. Phase 2 mode vs Phase 3 mode controlled by UI toggle. |

---

## Stories

### Story 18.1: Radical Database

**Files:** `public/data/radicals/radicals.json`, `scripts/import-radicals.js`

**AC:** 214 Kangxi radicals with: id, character, pinyin, meaning, strokeCount, variants, frequency_rank, examples[]. Top 20 flagged with `is_recommended: true`. Data sourced from Unicode Han Database.

### Story 18.2: Radical Browser + Detail Card

**Files:** `RadicalBrowser.tsx`, `RadicalDetailCard.tsx`

**AC:** Filterable grid (by stroke count, search). ★ badge on top-20. Recommended filter toggle. Detail card shows: name, pinyin, variants, example characters grid (each → Hub). "Generate Story" dropdown with auto-save. Decomposition tree link.

### Story 18.3: Radical Trees (Phase 2 + Phase 3)

**Files:** `RadicalTreesTab.tsx`

**AC:** Phase 2 mode: click radical → see all HSK chars containing it. Phase 3 mode: show mastered radicals, expand tree view. Each tree node clickable → Hub. No testing — browsing only.

---

## Risks

| Risk                                 | Mitigation                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| Make Me a Hanzi data format changes  | Pin version. Write import script with validation.                                     |
| Gemini mnemonic quality inconsistent | Auto-regenerate empty/low-quality responses. Cache per-character to avoid duplicates. |
