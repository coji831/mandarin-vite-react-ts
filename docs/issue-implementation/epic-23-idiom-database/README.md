# Epic 23: Chengyu (Idiom) Narratives — Implementation

**BR Reference:** `docs/business-requirements/epic-23-idiom-database/README.md`

**Status:** Planned

**Last Update:** June 16, 2026

---

## Architecture Decisions

| Decision             | Choice                                                        | Rationale                                                      |
| -------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| **Idiom data**       | Static JSON in `public/data/chengyu/`                         | 50+ fixed entries. No backend needed.                          |
| **Narrative format** | Each entry: story (70%) + meaning (20%) + usage (10%)         | Pedagogical approach: cultural context first, language second. |
| **Filters**          | Theme and era — frontend only                                 | Small dataset — no backend needed.                             |
| **Audio**            | Reuse existing AudioService for full idiom + example sentence | Already implemented.                                           |
| **Phase gate**       | Phase 4 only                                                  | Requires Simplified Chinese foundation.                        |

---

## Stories

### Story 22.1: Idiom Data

**Files:** `public/data/chengyu/idioms.json`

**AC:** 50+ idioms with: chengyu, pinyin, literal_meaning, figurative_meaning, story (narrative format), story_source, era, theme, examples[]. Each example has audio.

### Story 22.2: Idiom UI

**Files:** `ChengyuTab.tsx`

**AC:** Card grid with theme/era filters. Click → narrative view (story first, meaning second, usage third). Audio playback. Related idioms links.

---

## Risks

| Risk                                             | Mitigation                                           |
| ------------------------------------------------ | ---------------------------------------------------- |
| Origin stories may contain cultural inaccuracies | Source from established references. Academic review. |
| 50 idioms too few for Phase 4 learner            | Expandable dataset — add more in follow-up stories.  |
