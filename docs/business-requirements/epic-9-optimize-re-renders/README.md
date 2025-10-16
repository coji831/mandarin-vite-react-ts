# Epic: Optimize Re-Renders (Phase 1)

## Summary

Reduce unnecessary re-renders in the Mandarin feature by splitting contexts, stabilizing action identities, and introducing lightweight selectors. This will improve runtime performance for deep component trees such as vocabulary lists and conversation components with high update frequency.

## Goals

- Split the existing `ProgressContext` into `ProgressStateContext` and `ProgressDispatchContext`.
- Memoize action objects and selector results to provide stable references to consumers.
- Introduce `useProgressState(selector)` and `useProgressActions()` helpers for granular consumption.
- Maintain backward compatibility via a compatibility wrapper `useProgressContext()` during migration.

## Scope

Files to update (examples):

- `src/features/mandarin/context/ProgressContext.tsx`
- `src/features/mandarin/hooks/useProgressContext.ts`
- `src/features/mandarin/hooks/useMandarinContext.ts`
- `src/features/mandarin/components/*` (selectively update heavy consumers)

## Constraints

- Use only built-in React and TypeScript; no external libraries.
- Keep the public API stable during phased rollout (compatibility wrapper).

## Acceptance Criteria

- Heavy components (e.g., vocab list, `VocabularyCard`) show reduced re-renders in React Profiler when unrelated updates occur.
- Unit test validating action identity stability (same function reference across unrelated state changes).
- No UI regressions in staging.

## Risks & Mitigations

- Risk: Consumers expect a single object from `useProgressContext()`; migration may break them. Mitigation: retain a shim `useProgressContext()` that composes state+actions until all consumers are updated.

## Implementation Notes

Follow the repository conventions and keep export names in `src/features/mandarin/context/index.tsx`. Add small selector utilities and document `useProgressState` usage in a COMMENT in the provider file.

## Metrics

- Measure per-component render counts pre/post with React Profiler.
- Target: at least 30% render reduction for components previously re-rendering excessively.
