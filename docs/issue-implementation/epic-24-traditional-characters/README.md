# Epic 24: Traditional Character Toggle — Implementation

**BR Reference:** `docs/business-requirements/epic-24-traditional-characters/README.md`

**Status:** Planned

**Last Update:** June 16, 2026

---

## Architecture Decisions

| Decision              | Choice                                                                 | Rationale                                      |
| --------------------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| **Character mapping** | Open-source Simplified → Traditional mapping table                     | Industry standard. Handles 1-to-many mappings. |
| **Toggle state**      | User preference stored via backend API (`PATCH /api/user/preferences`) | Persists across devices.                       |
| **Toggle UI**         | Dropdown in global nav bar (简体/繁體)                                 | Visible only for Phase 4+ users.               |
| **Display scope**     | All character display — NOT UI text or pinyin                          | Characters only. Buttons, labels stay English. |

---

## Stories

### Story 24.1: Character Mapping Data

**Files:** `public/data/characters/simplified-to-traditional.json`

**AC:** Complete mapping table from Simplified → Traditional characters. Handles edge cases: 1-to-many, same-in-both-forms. Sourced from open-source Unicode data.

### Story 24.2: Toggle UI & Global State

**Files:** `TraditionalToggle.tsx`, `shared/store/preferencesStore.ts`

**AC:** Dropdown toggle in nav bar. Global state via Zustand. All character display components read toggle state and render appropriate form. Persisted via backend API.

---

## Risks

| Risk                                         | Mitigation                                                |
| -------------------------------------------- | --------------------------------------------------------- |
| 1-to-many mappings (e.g., 面 → 面/麵)        | Use default mapping. Advanced disambiguation deferred.    |
| Performance impact of character substitution | Apply toggle at render time — no re-render of entire app. |
