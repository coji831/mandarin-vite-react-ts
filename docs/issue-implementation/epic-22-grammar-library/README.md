# Epic 22: Grammar Library — Implementation

**BR Reference:** `docs/business-requirements/epic-22-grammar-library/README.md`

**Status:** Planned

**Last Update:** June 16, 2026

---

## Architecture Decisions

| Decision            | Choice                                                                    | Rationale                                       |
| ------------------- | ------------------------------------------------------------------------- | ----------------------------------------------- |
| **Grammar data**    | Static JSON in `public/data/grammar/`                                     | 20+ fixed patterns. No backend needed.          |
| **Phase gating**    | `phase` field per pattern (2, 3, or 4) — frontend filters by user's phase | Same gate check as other content tabs.          |
| **Search**          | Frontend filter (HSK level, pattern type, keyword)                        | Small dataset — no backend search index needed. |
| **Hub integration** | Each example word clickable → Character Detail Hub                        | Cross-linking grammar to character system.      |

---

## Stories

### Story 21.1: Grammar Data

**Files:** `public/data/grammar/patterns.json`

**AC:** 20+ patterns across 3 tiers: Phase 2 (SVO, Time, 吗), Phase 3 (了, 过, conjunctions), Phase 4 (把, 被). Each pattern: id, name, structure, explanation, examples[], hsk_level, phase, related_patterns[].

### Story 21.2: Grammar UI

**Files:** `GrammarTab.tsx`

**AC:** Phase-gated tab switcher (Basics / Advanced / Mastery). Search + HSK level filter. Pattern card list → click → detail view. Example sentences with audio. Clickable words → Hub.

---

## Risks

| Risk                                   | Mitigation                                                |
| -------------------------------------- | --------------------------------------------------------- |
| Grammar explanations may be inaccurate | Source from established textbooks. Review before release. |
| Small dataset (20 patterns) feels thin | Quality over quantity. Expand in future epics.            |
