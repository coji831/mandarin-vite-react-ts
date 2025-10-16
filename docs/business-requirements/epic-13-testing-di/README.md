# Epic: Testing Ergonomics & Dependency Injection (Phase 5)

## Summary

Improve testability by adding shared test utilities, dependency injection hooks for externalities (storage, fetch), and lightweight wrappers so tests can use real providers without heavy module mocking.

## Goals

- Add `src/test-utils.tsx` with `Providers` and `customRender`/`renderHook` helpers.
- Allow `useProgressData` and other hooks to accept optional dependency overrides (e.g., `getUserProgress`), defaulting to existing utils.
- Create example tests demonstrating `renderHook` + providers and reducer unit tests.

## Scope

Files to add/update:

- `src/test-utils.tsx`
- `src/features/mandarin/hooks/useProgressContext.ts` (optional DI additions)
- Example tests in `src/features/mandarin/hooks/__tests__/*`

## Constraints

- Keep test helpers small and focused. Use React Testing Library patterns.

## Acceptance Criteria

- New tests can run without jest.mock of internal utils. Only external network or browser APIs get mocked.
- Documentation and examples added in `docs/` showing how to test hooks/components.

## Risks & Mitigations

- Risk: Slight duplication between test and app providers. Mitigation: Keep `Providers` importable from same provider module or share a small wrapper used by both.

## Metrics

- Reduced number of tests that rely on `jest.mock` for internal modules.
- Test flakiness rate decrease (tracked by CI historic results).
