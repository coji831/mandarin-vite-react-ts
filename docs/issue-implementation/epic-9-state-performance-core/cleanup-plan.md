## Epic 9 — State Performance Core: Cleanup Plan (AI-friendly)

Status: migration completed (Phase C removals applied)

## Goal

Remove legacy stage/state management code after completing consumer migration and a successful staged release where telemetry shows no regressions.

## Human summary

The reducer/context/hooks based progress management is implemented (`ProgressContext.tsx`, `useProgressState.ts`, `useProgressActions.ts`). Phase C removals were applied in this branch: legacy stateful progress files, the compatibility shim, and the legacy import helper were removed from `src/`.
Historical locations and an automated scan are preserved in `scripts/cleanup-report.json` for audit and rollback reference.

## Automation plan (structured)

This section provides explicit, machine-actionable steps an automation agent can follow. Each step includes command examples, file globs/regexes to match, and verification criteria.

1. Locate legacy usages

- Files to grep (regex):
  - "useMandarinProgress" or "useProgressData"
  - "localStorage.getItem\(|user_progress|legacyProgress|OLD_PROGRESS_KEY"
- Command examples (run from repo root):
  - rg "useMandarinProgress|useProgressData" --hidden --glob "src/\*\*"
  - rg "localStorage.getItem|user_progress|legacyProgress|OLD_PROGRESS_KEY" --hidden --glob "src/\*\*"
- Success criteria: zero or more matches listed; these are candidates for replacement.

2. Consumer migration (completed)

Consumer imports and tests were migrated during the phased cleanup. Tests that previously mocked legacy hooks were converted to render with `ProgressProvider` or rewritten to use `useProgressState` / `useProgressActions` directly. The remaining guidance in this document is archival; use `scripts/cleanup-report.json` for exact pre-removal callsites if you need to restore or audit a specific file.

4. Migration helpers

Migration helper files that referenced the legacy `user_progress` key were removed from `src/` in Phase C. If your workflow still depends on those helpers, restore them from branch history or use the audit report (`scripts/cleanup-report.json`) to reconstruct the prior behavior.

5. Remove legacy files (Phase C)

- Phase C (removals) has been executed in this session. The repository no longer contains the legacy hook files or the import helper. Post-removal verification commands were run and passed.

## Automation-friendly verification steps

Static checks (recommended):

- `npx tsc --noEmit` -> exit code 0
- `rg "useMandarinProgress|useProgressData|legacyProgress|user_progress" src -S` -> no results in `src/` after removal
- Runtime checks (manual/CI):
  - Run unit/integration tests: `npm test` (or `npm run test:unit` if available)
  - Smoke: Start dev server and manually exercise flows (or run a small Playwright test)

## Human guidance & timeline

- Keep migration helpers for at least one release cycle (1–2 weeks) after removal PR is deployed.
- Owner: whoever merges epic-9 into `main` (create follow-up PR for deletions).

## Minimal roll-back plan

- If regressions appear, revert the deletion PR and re-introduce compatibility adapters while fixing consumers.

## Appendix: useful file paths

- New provider: `src/features/mandarin/context/ProgressContext.tsx`
- New hooks: `src/features/mandarin/hooks/useProgressState.ts`, `src/features/mandarin/hooks/useProgressActions.ts`, `src/features/mandarin/hooks/useProgressContext.ts`
- Legacy hooks: `src/features/mandarin/hooks/useMandarinProgress.ts`, `src/features/mandarin/hooks/useProgressData.ts`
- Legacy storage helpers: `src/features/mandarin/utils/legacyProgress.ts`, `src/features/mandarin/utils/progressHelpers.ts`, `src/features/mandarin/utils/serialization.ts`

---

## Progress (automation-run state)

Files already migrated in this session:

- `src/features/mandarin/pages/VocabularyListPage.tsx` — replaced `useProgressContext` usage with `useProgressState` selector and local progress calculation.
- `src/features/mandarin/hooks/useProgressContext.test.tsx` — test rewritten to assemble legacy-shaped object via `useProgressState` + `useProgressActions`.

Scanner summary (latest run): see `scripts/cleanup-report.json`.

Next target (recommended, high-impact):

- `src/features/mandarin/pages/FlashCardPage.tsx` — page still imports legacy-style selectors or relies on `useProgressContext` semantics. Convert to `useProgressState` + `useProgressActions` and ensure word-loading logic uses `useProgressActions().setSelectedWords`.

Per-file conversion workflow (one-by-one automation steps)

1. Create a branch: `git checkout -b cleanup/progress-migration-<file>`
2. Edit target file:
   - Replace `import { useProgressContext } from "../hooks/useProgressContext"` (or legacy hook imports) with the minimal imports needed:
     - `import { useProgressState } from "../hooks/useProgressState";`
     - `import { useProgressActions } from "../hooks/useProgressActions";`
   - Replace reads with selector calls:
     - `const selectedWords = useProgressState(s => s.ui?.selectedWords ?? []);`
   - Replace writes with action calls:
     - `const { setSelectedWords, markWordLearned } = useProgressActions();`
   - For legacy helpers like `calculateListProgress`, compute locally from `masteredProgress` (see `VocabularyListPage.tsx` change as reference).
3. Run static checks:
   - `npx tsc --noEmit` (must pass)
   - `rg "useMandarinProgress|useProgressData|useProgressContext" src -S` (confirm reduced matches)
4. Run unit tests (targeted or full):
   - `npm test` or `npm test -- <test-file>`
5. Commit changes and push branch, then open PR for review.

Automation finish criteria

- All `useProgressContext` and legacy hook usages in `src/**` are removed or rewritten to use new hooks.
- `npx tsc --noEmit` passes and CI tests pass.
- `rg "useMandarinProgress|useProgressData|legacyProgress" src -S` returns only allowed migration-helper matches until deprecation window ends.

Generated: 2025-10-21
