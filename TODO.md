# TODO — Project-wide (GitHub-friendly)

This file is a simple, human-editable TODO list compatible with GitHub (checkboxes are interactive in PRs and on GitHub.com).

Usage:

- Edit items locally or on GitHub and check boxes when work is complete.
- To escalate a checklist item into a tracked GitHub Issue, use the `gh` CLI (examples below) or create the Issue via the GitHub UI.

Sections

- Bugs: critical fixes and regressions
- Todo (near-term): prioritized tasks to do soon
- Backlog (future): ideas and lower-priority work
- Done (archive): moved items once completed

---

## Bugs (urgent)

## Todo (near-term)

## Backlog

- [ ] Migrate auth to React Query + Axios — Replace custom `authFetch` wrapper with industry-standard Axios interceptors and React Query for better caching, retry logic, and TypeScript support (Estimate: 12 hours)
- [ ] Refactor `#file:local-backend` — modernize syntax and approach for Google APIs, simplify credential handling
- [ ] Update backend/vercel APIs to return and throw more meaningful logs/errors for better debug support (include structured error objects and request IDs)
- [ ] Support pinyin and English meaning in conversation generation and UI (display and toggleable playback)
- [ ] Support turn-based conversations with UI indicator and per-turn audio playback controls

## Done

- [x] Re-organize `#file:features` — move `conversation/` under `mandarin/` and update imports/paths
- [x] Unify data objects across data and components (e.g., `Card`, `Word`, `ConversationTurn`) for consistency
- [x] Overhaul data/audio services layer — Design and implement a unified services layer for data and audio fetching. All new services must provide fallback logic and be easy to swap for other backends.
- [x] Add data/audio fetching services — Implement dedicated service functions for vocabulary data and audio (TTS) fetching. Services should abstract API calls and provide fallback logic.
- [x] Migrate components to use services — Refactor all components to use the new services layer instead of calling APIs directly. Ensure all data/audio access goes through service functions.
- [x] Ensure service fallback and backend swap — All services must have robust fallback logic and be designed for easy backend switching (e.g., config or DI). Document the pattern for future maintainers.

---

Notes

- Checkboxes in this file are purely a convenience; converting them to Issues gives you proper tracking, assignment, and linking to PRs.
- If you'd like, I can create Issues automatically for each unchecked item or open a PR that adds this file on a branch.

---

Last updated: 2025-12-16
