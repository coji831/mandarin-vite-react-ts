# Migration Plan (Implementation-first): preserve legacy `useProgressData` runtime and types

This plan focuses on the work required to keep the legacy `useProgressData` behavior and in-memory data structures unchanged while integrating them into the new reducer-driven context. It is organized for implementation: concise tasks, precise file edits, type contracts, serialization helpers, and a phased rollout. Per request this version omits detailed testing instructions and skips test-file edits.

## Key constraints

- Preserve legacy runtime behavior and public API (function names, data shapes). Consumers should not observe semantic changes.
- Keep the old in-memory data types where practical (notably `masteredProgress: { [listId: string]: Set<string> }`).
- Enforce TypeScript typing for the new compatibility slice and serialization helpers.
- Implement a compatibility layer in the provider and hooks so migration is non-breaking.
- Follow the project's code conventions (see `docs/guides/code-conventions.md`) for naming, typing, file layout and patterns.

## Implementation checklist (high level)

1. Add typed compatibility state (ui/compat slice) to provider.
2. Add typed serialization helpers for exact round-trip of stored `UserProgress`.
3. Expand `useProgressActions()` to return the legacy API functions.
4. Implement compatibility shim `useProgressContext` that returns the legacy shape (delegates to state/actions).
5. Wire provider init and effects to restore/persist legacy state with the same triggers.
6. Gradually mirror into normalized `lists` slice if/when needed.

## Files to update (concrete edits)

Below are exact files to edit and the minimal edits required for each. Keep changes isolated and well-typed.

1. `src/features/mandarin/types/Progress.ts`

- Add explicit legacy interfaces:
  - `export interface UserProgress { lists: Array<{ id: string; listName: string; progress?: Record<string, boolean>; words?: any[]; lastUpdated?: string }>; }`
  - `export type MasteredProgressMap = { [listId: string]: Set<string> }`
  - `export interface LegacyProgressState { selectedList: string | null; selectedWords: Word[]; masteredProgress: MasteredProgressMap; loading: boolean; error: string; }`
- Rationale: centralize types so reducers/actions can import them for strict checking.

2. `src/features/mandarin/reducers/uiReducer.ts`

- Extend `UiState` to include the compatibility fields (typed using new interfaces):
  - `selectedList`, `selectedWords`, `masteredProgress`, `error` (and existing `isLoading`).
- Add action types and handlers:
  - `UI/SET_SELECTED_LIST` (payload { listId: string | null })
  - `UI/SET_SELECTED_WORDS` (payload { words: Word[] })
  - `UI/SET_ERROR` (payload { error?: string })
  - `UI/SET_MASTERED_PROGRESS` (payload { mastered: Record<string, Record<string, boolean>> }) // serialized form
  - `UI/ADD_MASTERED_WORD` (payload { listId: string, wordId: string, when?: string })
- Implementation note: store the in-memory `masteredProgress` as `MasteredProgressMap` (Set values). For persistence, `UI/SET_MASTERED_PROGRESS` will accept serialized form and be converted to Sets by the reducer or provider.

3. `src/features/mandarin/context/ProgressContext.tsx`

- Provider init effects:
  - Call `migrateOldProgressFormat()` (from `progressHelpers`) early.
  - Read `userId` (via `state.user` or `getUserIdentity()`), call `getUserProgress(userId)`, call `restoreMasteredProgress()` (see helpers below) and dispatch `UI/SET_MASTERED_PROGRESS` (or directly set in UI state via a dispatch action). Also restore `selectedWords` if stored for selectedList.
- Persistence effect:
  - Watch compatibility fields (`state.ui.masteredProgress`, `state.ui.selectedList`, `state.ui.selectedWords`) and call `persistMasteredProgress()` to convert Sets to serialized form and then `saveUserProgress(userId, progress)`.
  - Use same triggers/order as legacy hook: init restore all lists, restore per-list when `selectedList` changes, persist after restoration when selectedList/mastered/selectedWords change.
- Keep ready gating (do not render children until compatibility init is done).

4. `src/features/mandarin/utils/serialization.ts` (new)

- Implement typed helpers:
  - `export function restoreMasteredProgress(userProgress: UserProgress): MasteredProgressMap` — convert stored `{ [wordId]: true }` into `Set<string>` per list exactly as legacy `extractMasteredSet` did.
  - `export function persistMasteredProgress(mastered: MasteredProgressMap, storedTemplate?: UserProgress): UserProgress` — convert Sets back to { [wordId]: true } per list and attach existing `words` arrays if present in template.
- Rationale: keep these conversions centralized and strictly typed.

5. `src/features/mandarin/hooks/useProgressActions.ts`

- Expand exported actions to include legacy API surface (memoized):
  - `setSelectedList(listId: string | null)` -> dispatch `UI/SET_SELECTED_LIST`
  - `setSelectedWords(words: Word[])` -> dispatch `UI/SET_SELECTED_WORDS`
  - `setLoading(isLoading: boolean)` -> dispatch `UI/SET_LOADING`
  - `setError(message?: string)` -> dispatch `UI/SET_ERROR`
  - `markWordLearned(wordId: string)` -> dispatch `UI/ADD_MASTERED_WORD` which updates `ui.masteredProgress[selectedList]` in-memory and optionally dispatch `MARK_WORD_LEARNED` to `listsReducer` for normalized mirroring.
  - `resetAndRedirectToVocabList()` -> dispatch reset actions for ui slice and call `window.location.href` fallback or return control.
- Implementation note: these functions must maintain identical semantics (synchronous state updates and persistent side-effects) the legacy hook provided.

6. `src/features/mandarin/hooks/useProgressState.ts` and `src/features/mandarin/hooks/useMandarinContext.ts`

- Export typed selectors or helper functions that return legacy-shaped helpers:
  - `calculateListProgress(listId: string, wordCount: number): { mastered: number; percent: number }` — compute using `ui.masteredProgress[listId]` if present.
  - `getMasteredSetForList(listId: string): Set<string> | undefined`
- Keep these available for current consumers (FlashCard, Sidebar, VocabularyListPage) unchanged.

7. `src/features/mandarin/hooks/useProgressContext.ts` (compat shim)

- Implement a small shim that wraps the new hooks and returns the legacy `ProgressContextType` shape to callers who import `useProgressContext` or `useProgressData`:
  - `export function useProgressData(): ProgressContextType { const state = useProgressState(s => s.ui); const actions = useProgressActions(); return { ...map fields/actions to legacy names/types }; }`
- This file should be small and only convert shapes; all heavy lifting occurs in provider/reducers.

## Runtime semantics to maintain (implementation notes)

- Restoration order:

  1. Restore global mastered sets for all lists on userId change.
  2. Restore selected-list mastered set and words when `selectedList` changes.
  3. Persist only after restoration effects complete so saved state matches the latest in-memory state.

- markWordLearned semantics:

  - Must add the word id to the Set for the currently selected list synchronously and then trigger persistence asynchronously (same as legacy).
  - If `selectedList` is null, set error and do not update.

- Persisted JSON shape: identical to existing `UserProgress` format (lists array with `id`, `progress: { [wordId]: true }`, `words: []`). Use `persistMasteredProgress` to produce this shape.

## Rollout plan (implementation phases)

Phase A — Compatibility surface (low risk, minimal changes)

- Implement typed interfaces and `ui` compatibility fields in `uiReducer`.
- Expand `useProgressActions` to expose legacy action names and semantics.
- Add `serialization.ts` helpers.
- Add `useProgressContext` shim that maps to new hooks.
- Smoke-check key pages (FlashCardPage, FlashCard, Sidebar) — they should work unchanged.

Phase B — Persistence wiring (medium risk)

- Hook provider init to restore compatibility state via `restoreMasteredProgress`.
- Add persistence effect that writes back via `persistMasteredProgress` and `saveUserProgress`.
- Verify behavior parity with legacy hook locally.

Phase C — Optional mirroring & cleanup (higher risk)

- Add mirroring to normalized `lists` slice if needed.
- When tests and behavior are stable, remove old monolithic hook or keep as a tiny shim.

## Notes & caveats

- This approach intentionally keeps duplicate state (compatibility `ui` slice and normalized `lists`) until mirroring/cleanup occurs; document the source-of-truth and mirroring direction.
- Keep all new code strictly typed and import types from centralized files.
- Avoid changing consumer code in this migration — keep all changes internal to provider/hooks/reducers.

- Code conventions: All new files and edits must follow the rules in `docs/guides/code-conventions.md` (TypeScript usage, naming, explicit types, no `any`, hook and filename conventions, etc.).

---

If you want I can start implementing Phase A now (compatibility slice + action exports + shim + serialization helpers). I will make minimal edits, run TypeScript check (`tsc --noEmit`) and report back. Which phase do you want me to start implementing?

## Legacy helper mapping and callsites (re-introduced)

Below are the original legacy helper names and callsites that existed in `useProgressData` and related files. For clarity and backwards-compatibility we re-introduce the names below and map each to the new helper or provider action to implement. When implementing the compatibility shim, keep these names available (either by re-implementing or by exporting thin adapters) so consumers and docs remain valid.

- extractMasteredSet(progressObj: Record<string, boolean>): Set<string>

  - Legacy: converted a list.progress object into a Set of mastered wordIds.
  - New mapping: `restoreMasteredProgress(userProgress)` implements the same conversion per list. You can also expose a small adapter `extractMasteredSet` that calls the new helper for a single object.
  - Example adapter:
    ```ts
    export function extractMasteredSet(progressObj: Record<string, boolean>) {
      return new Set(Object.keys(progressObj).filter((k) => progressObj[k]));
    }
    ```

- getOrCreateListEntry(userProgress, listId)

  - Legacy: created or returned a list entry in the stored `UserProgress` object.
  - New mapping: implement the same utility inside `serialization.ts` (used by `persistMasteredProgress`) — keep the same name/signature for backward compatibility.

- restoreProgress(userId)

  - Legacy: returned `{ [listId]: Set<string> }` for all lists for that user.
  - New mapping: provider init should call `getUserProgress(userId)` then `restoreMasteredProgress(userProgress)` to obtain the same map.

- restoreProgressForList(userId, listId)

  - Legacy: returned the mastered Set for a single list.
  - New mapping: implement `restoreMasteredProgressForList(userProgress, listId)` or call `restoreMasteredProgress(userProgress)[listId]` inside the provider effect that runs on `selectedList` changes.

- syncProgressWithStorage(userId, listId, masteredSet, words)

  - Legacy: saved a single listEntry.progress and words to storage.
  - New mapping: `persistMasteredProgress` should perform the same operation — convert the `Set` into `{ [wordId]: true }` and write via `saveUserProgress`. Keep a helper `syncProgressWithStorage` as a thin wrapper for backward compatibility if desired.
  - Example mapping:
    ```ts
    function syncProgressWithStorage(userId, listId, masteredSet, words) {
      const current = getUserProgress(userId);
      let entry = current.lists.find((l) => l.id === listId);
      if (!entry) {
        entry = { id: listId, listName: listId, progress: {}, words: [] };
        current.lists.push(entry);
      }
      entry.progress = {};
      masteredSet.forEach((id) => (entry.progress[id] = true));
      entry.words = words || entry.words || [];
      saveUserProgress(userId, current);
    }
    ```

- migrateOldProgressFormat()

  - Legacy: utility that moved old single-key storage to per-user storage.
  - New mapping: keep the existing `migrateOldProgressFormat` in `progressHelpers.ts` and call it during provider init.

- getUserProgress(userId) / saveUserProgress(userId, progress)

  - Legacy: canonical storage utilities.
  - New mapping: continue using `src/features/mandarin/utils/progressHelpers.ts` — add/keep strict `UserProgress` typing.

- useProgressData / useProgressContext

  - Legacy: the old hook that returned the large `ProgressContextType` object.
  - New mapping: implement `useProgressContext` as a tiny shim that maps into `useProgressState` + `useProgressActions` and returns the old shape. This preserves all callsites while moving logic into provider/reducers.

- loadProgressForList(listId, file) / selectVocabularyList(listId, words)

  - Legacy: functions used to load CSV words and set the selected list.
  - New mapping: provide the same functions via `useProgressActions()` (e.g., `loadProgressForList`) or implement them in the compat shim by delegating to `setSelectedList` and `setSelectedWords`.

- calculateListProgress(listId, wordCount)
  - Legacy: counted mastered Set size and returned percent.
  - New mapping: keep the same function signature and implement it using `ui.masteredProgress[listId]` when available, falling back to normalized state if desired.

Keep these names in the compatibility layer to avoid churn and ensure documentation & code examples remain valid. When ready, any of these adapters can be removed after the codebase is fully migrated and consumers updated.

## Existing references and files that still use legacy progress APIs

During the codebase scan there are multiple files that still reference the legacy `useProgressData` / `useProgressContext` behavior, helpers, or types. Below is a prioritized list (high -> low) of concrete files to inspect and migrate or adapt to the compatibility slice. For each entry I list why it matters and the recommended migration action.

High priority (fix or provide shim quickly)

- `src/features/mandarin/hooks/useProgressContext.ts`

  - Why: The canonical legacy hook implementing full state, effects and persistence.
  - Action: Convert this into a compatibility shim that delegates to the new provider/hooks and returns the exact `ProgressContextType` (typed). Alternatively, remove after all consumers migrated, but the shim minimizes risk.

- `src/features/mandarin/hooks/useProgressContext.test.tsx`

  - Why: Unit tests import the legacy hook and assert its API.
  - Action: Update tests to import the shim or rewrite to use the new hook API; keep behavior assertions identical.

- `src/features/mandarin/hooks/index.ts`

  - Why: Re-exports hooks; if you change names or remove legacy exports, imports break.
  - Action: Keep stable exports. Re-export the compatibility shim under the same name.

- `src/features/mandarin/pages/FlashCardPage.tsx`
  - Why: Calls `setSelectedList`, `setSelectedWords` from `useProgressActions()` and expects legacy semantics.
  - Action: Ensure `useProgressActions()` returns those setters (typed) or update the page to use new action names/selectors.

Medium priority (consolidate/centralize)

- `src/features/mandarin/hooks/useMandarinProgress.ts`

  - Why: Contains logic similar to legacy hook (restore/persist and in-memory Sets). May be redundant with the provider.
  - Action: Consolidate into provider or refactor it to delegate to the compatibility slice.

- `src/features/mandarin/utils/progressHelpers.ts`

  - Why: Storage helpers (`getUserProgress`, `saveUserProgress`) — canonical for persistence.
  - Action: Keep and strongly type these utilities (export `UserProgress` type); use them from the provider persistence effects.

- `src/features/mandarin/hooks/useProgressActions.ts`

  - Why: New action hook exists but currently lacks legacy setters.
  - Action: Extend it to return the legacy action surface (`setSelectedList`, `setSelectedWords`, `setLoading`, `setError`, `markWordLearned`) that updates the compatibility `ui` slice and triggers persistence.

- `src/features/mandarin/hooks/useProgressState.ts`
  - Why: Selector hook must provide selectors for `selectedList`, `selectedWords`, `masteredProgress`, `calculateListProgress`.
  - Action: Add typed convenience selectors or document and export helper selector functions.

Low priority (docs, tests, other consumers)

- `src/features/mandarin/components/FlashCard.tsx`, `Sidebar.tsx`, `NavBar.tsx`

  - Why: Consumers rely on `calculateListProgress`, `selectedList`, and `masteredProgress` semantics.
  - Action: Keep consumer code unchanged by exposing the legacy helpers via `useProgressState` / `useMandarinContext` compatibility layer.

- `src/features/mandarin/pages/VocabularyListPage.tsx` and other pages

  - Why: Use `calculateListProgress` selector; ensure selector exposed in compatibility layer.
  - Action: No change to consumers once selectors/actions are provided.

- Tests referencing legacy API (e.g., `flashcardpage.test.tsx`) and docs under `docs/issue-implementation/` and `docs/business-requirements`
  - Why: They reference old APIs and design docs.
  - Action: Update tests to use shim or new APIs; update docs after migration.

Migration recommendation summary

- Implement the compatibility shim in the provider and expand `useProgressActions` to return the legacy API surface. This is the lowest-risk path and satisfies your requirement to keep the old logic and data structures identical.
- Add typed serialization helpers (`restoreMasteredProgress`, `persistMasteredProgress`) and wire them into a persistence effect in `ProgressContext` that mirrors previous effect triggers.
- Update tests to either import the shim or to use the new action/selector APIs, ensuring TypeScript compilation (`tsc --noEmit`) is green.

If you want, I can start implementing the compatibility shim and the `useProgressActions` expansion now. I'll make the smallest possible changes to preserve behavior, add types, and run the TypeScript check and relevant tests. Which step should I do first?
