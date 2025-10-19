# Implementation 9-5: Cleanup & Finalization

## Technical Scope

Finalize cleanup after all consumer migrations. Deprecate/remove legacy types and compatibility shims, and prepare release notes that document reset behavior.

Deliverables:

- Remove or move legacy `src/features/mandarin/types/Progress.ts` to `types/legacy/` with deprecation notes
- Remove legacy `ProgressContext` API
- Update docs and changelog with reset/migration notes

## Implementation Details

Steps:

1. Confirm no consumers rely on legacy API (use code search and PR reviews).
2. Move legacy types to `types/legacy/` with comments and deprecation guidance.
3. Remove compatibility shims and update imports across the repo.
4. Verify converted consumers across main flows and document any remaining gaps before final removal of legacy code.

### Files to update / deprecate

- Move legacy `src/features/mandarin/types/Progress.ts` -> `src/features/mandarin/types/legacy/Progress.ts` with deprecation notes.
- Remove legacy `ProgressContext` export after consumers have migrated.
- Update `src/router/Router.tsx` wiring if necessary and finalize release notes documenting reset behavior.
- Add a short PR checklist confirming consumer smoke checks and rollback plan.

### Missing scope (source scan) — story 9.5

Files relevant to PR 9.5 (include or reference in PR):

- `src/features/mandarin/types/Progress.ts` -> moved to `src/features/mandarin/types/legacy/Progress.ts` (deprecation)
- Removal of legacy `ProgressContext` export (after consumer migration)
- Finalized release notes and changelog entries documenting reset behavior
- `src/router/Router.tsx` (verify final wiring)

PR verification (copy into PR description):

- [ ] Legacy types moved to `types/legacy/` with deprecation notes
- [ ] Legacy `ProgressContext` export removed and replacements documented
- [ ] Release notes include reset/migration impact and rollback instructions

## Architecture Integration

- Ensure final API surface (`useProgressState`, `useProgressActions`) is documented and exported from the internal hooks package.

## Technical Challenges & Solutions

Problem: accidental removal of types or APIs still used by small/old branches.

Solution: include a deprecation window and communicate clearly on PRs and release notes; prefer moving to `types/legacy/` first.

- Validate consumer behavior via manual verification steps and small smoke checks as part of PR review and staging validation. Add a short checklist to PR descriptions documenting which flows were verified.
