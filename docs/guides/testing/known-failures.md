# Known Failures Registry

**Last Updated:** August 5, 2026
**Purpose:** A maintained, versioned list of KNOWN pre-existing failures (tests / type-check / lint errors that exist in the repo independent of current work) so agents don't re-triage the same known-broken items from scratch every session.

## How to Use (Triage Rule)

At every `test:full` / type-check failure, match the failing item against this table **FIRST**. Re-triaging a known failure from scratch is prohibited — instead, bump its **Last verified** date and add a one-line confirmation. A genuinely new failure opens a new entry with the next free `KF-NNN` ID. Do **not** auto-fix unrelated failures inside a story. This file is a working triage table, not a defect tracker.

| ID     | Area                                                  | Failing command                          | Symptom                                                                                                                                                                                                                              | Known root cause                                                                                                                                                                                                      | Status                                       | Last verified | Owner                 |
| ------ | ----------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------- | --------------------- |
| KF-001 | Frontend tests (Radicals)                             | `npm run test:full` (radical test files) | 28 radical test failures                                                                                                                                                                                                             | Pre-existing assertion/expectation mismatches unrelated to epic-21 work (documented during epic-21 verification; see repo memory `/memories/repo/verification-facts.md` and the epic-21 backend pipeline fixes notes) | Known / pre-existing                         | 2026-08-02    | Unassigned (frontend) |
| KF-002 | Backend lint                                          | `npm run lint` (backend workspace)       | 21 backend lint errors                                                                                                                                                                                                               | Pre-existing lint issues unrelated to epic-21 changes (documented during epic-21 backend pipeline work)                                                                                                               | Known / pre-existing                         | 2026-08-02    | Unassigned (backend)  |
| KF-003 | Design audit (gate 9, used-but-undefined-class check) | `npm run design-audit`                   | 284 pre-existing undefined CSS classes across 94 files (e.g. `text-danger`→`text-error`, `mt-sm`, `gap-4px`, BEM `hub-*`/`rdc__*` classes used in JSX with no CSS rules) — check currently at WARNING severity so gate 9 stays green | Pre-existing legacy drift (promote check to `error` severity in `tools/design-audit.mjs` after this backlog is cleaned)                                                                                               | Known / pre-existing (warning-level backlog) | 2026-08-02    | Frontend              |

## Adding a New Entry

- On a failure NOT already in this table, confirm it is not one of the listed items (match by `Area` + `Failing command` + `Symptom`), then add a row with the next free `KF-NNN` ID.
- Phrase the **Known root cause** conservatively — record only what was actually verified (e.g. "pre-existing, unrelated to current epic (see /memories/repo/...)"). Do not invent precise root causes.
- Set **Status** to `Known / pre-existing` (or `In triage` if not yet confirmed) and **Last verified** to the current date; leave **Owner** unassigned until someone owns the fix.

## Updating an Entry

- Known failure re-encountered? Match it, then bump **Last verified** to today and add a one-line confirm (you may append the confirmation in the **Symptom** or a comment — do not re-open a full triage).
- Only bump the date when you have actually re-run the failing command and confirmed the same symptom.
- When a known failure is fixed, move the row to the **Resolved** subsection below with the resolving PR/commit/date and set **Status** to `Resolved`.

## Resolved

_Empty — reserved for entries whose root cause has been fixed. When resolving a known failure, move its row here and record the resolving PR/commit and date._

## Tracked Tech Debt (non-blocking)

Known, intentionally-deferred structural debt that is **not** a failure and must **not** be flagged or
re-triaged. Do not extend these items; migrate them when the component is next touched.

| TD-ID  | Component        | Location                                                                  | Status        | Policy                                                                            |
| ------ | ---------------- | ------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------- |
| TD-001 | RadicalHub       | `features/radicals/components/RadicalHub.stories.tsx`                     | Grandfathered | Do not flag, do not extend; migrate to a Pages/Layouts/Shared story when touched. |
| TD-002 | CharacterHub     | `features/character-hub/components/CharacterHub/CharacterHub.stories.tsx` | Grandfathered | Do not flag, do not extend; migrate to a Pages/Layouts/Shared story when touched. |
| TD-003 | LexicalHubRouter | `features/lexical-hub/components/LexicalHubRouter.stories.tsx`            | Grandfathered | Do not flag, do not extend; migrate to a Pages/Layouts/Shared story when touched. |
| TD-004 | GrammarHub       | `features/grammar/components/GrammarHub.stories.tsx`                      | Grandfathered | Do not flag, do not extend; migrate to a Pages/Layouts/Shared story when touched. |
| TD-005 | ChengyuHub       | `features/chengyu/components/ChengyuHub.stories.tsx`                      | Grandfathered | Do not flag, do not extend; migrate to a Pages/Layouts/Shared story when touched. |
