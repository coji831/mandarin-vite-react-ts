# Epic 11: Testing & Dependency Injection

## Epic Summary

**Goal:** Improve test ergonomics by introducing provider test utilities and optional dependency injection (DI) in hooks so tests are easier to write, less brittle, and require fewer heavy mocks.

**Key Points:**

- Add `Providers` test wrapper and `customRender` / `renderHookWithProviders` helpers to centralize test environment setup.
- Allow hooks and services to accept optional DI overrides (storage, fetcher, cache) to make unit tests deterministic without module-level mocks.
- Provide example tests demonstrating reduced mocking and clearer assertions.
- Update CI tests gradually to use the new test utilities and keep existing tests working until conversions are complete.
- Document migration steps and sample patterns in `docs/business-requirements/epic-11-testing-dependency-injection/implementation/`.
- Remove legacy/brittle tests (heavy `jest.mock()` usage and fragile integration tests) as part of the migration, but do this incrementally: convert tests to the new helpers first, verify CI, then delete legacy artifacts.
- Test runner: standardize on Vitest (Vite-native runner) for unit tests. Use `vi` for mocks/spies, `@testing-library/react` for component testing, and MSW for network-level mocking. Apply Vitest modestly during the migration (setup once, run focused tests per-priority, expand coverage gradually).

**Status:** Planned

**Last Update:** 2025-10-16
**Short outline (summary is distributed below in Key Points, Acceptance Criteria, and Implementation notes).**

## Background

Many tests in the codebase rely on heavy `jest.mock()` usage and ad-hoc provider setup. This increases test fragility and makes it harder to write focused unit tests. By standardizing test providers and allowing DI in key hooks, tests become faster, simpler, and less coupled to implementation details.

Current project test runner: Jest (package.json currently uses `jest`). This BR prescribes migrating to Vitest, but removal of Jest (devDependencies and the `test` script) must only happen after Vitest is configured and a converted test subset passes reliably in CI.

## User Stories

1. #XXXX / **Add test-utils provider wrappers**

- As a test author, I want a `Providers` wrapper and `customRender` so I can render components with minimal boilerplate and consistent context providers.

2. #XXXX / **DI-enabled hooks**

- As a developer, I want hooks to accept optional DI overrides (e.g., `useProgressData({ storage, fetcher } = {})`) so tests can inject fake storage/fetchers instead of mocking modules.

3. #XXXX / **Example tests & docs**

- As a team member, I want example tests and migration docs that show how to convert existing tests to use the new helpers.
<!-- Add issue numbers when available -->

## Story Breakdown Logic

- Stories 11.1: Add `test-utils.tsx` with `Providers` and `customRender`.
- Stories 11.2: Update one or two hooks to accept DI and update their tests as examples.
- Stories 11.3: Gradually convert other tests and document patterns.
  Rationale: start with the tooling (Providers), then change a couple of high-value hooks to accept DI and show examples before converting the rest.

## Acceptance Criteria

- [ ] `src/test-utils.tsx` added and exports `Providers`, `customRender`, and `renderHookWithProviders`.
- [ ] Vitest configured (`vitest.setup.ts`) and package.json scripts added (`test:vitest`, `test:vitest:watch`, `test:vitest:coverage`). After validating Vitest in CI, update the main `test` script to point to Vitest and remove Jest devDependencies/config.
- [ ] `useProgressData`/`useProgressContext` accept optional DI (storage/fetcher) and one DI test exists.
- [ ] 3–5 high-value tests migrated to `customRender`/DI and legacy brittle tests removed in validated batches.
- [ ] Add `implementation/Vitest-Integration-Guide.md` describing how to integrate Vitest into a React + TypeScript app (install, config, setup file, scripts, small conversion examples).

## Architecture Decisions

- Decision: Test runner — Vitest (choice)

  - Rationale: Vitest is Vite-native, faster for local runs, and integrates well with the existing Vite build configuration.
  - Alternatives considered: Keep Jest (current), or use Jest with Vite plugin. Keeping Jest avoids conversion work but misses the faster Vite-native tooling.
  - Implications: Tests and CI need incremental conversion (jest -> vi mock APIs), add Vitest config, and validate coverage parity.

- Decision: Optional DI in hooks (choice)

  - Rationale: Allowing hooks to accept optional `storage`, `fetcher`, or `cache` makes unit tests deterministic without module-level mocking.
  - Implications: Production code paths remain unchanged if DI defaults are preserved; add small API surface to hooks and update example tests.

- Decision: Central test-utils (`Providers` / `customRender`) (choice)

  - Rationale: Centralizing providers reduces boilerplate and prevents divergent provider setups across tests.
  - Implications: Create a single `src/test-utils.tsx` and encourage team to use `customRender` and `renderHookWithProviders` in new/converted tests.

- Decision: Use MSW for network mocking (choice)

  - Rationale: MSW provides realistic network-level mocking and can run in node mode for unit tests, avoiding brittle manual mocks.
  - Implications: Add `src/mocks` and a shared MSW server setup in `vitest.setup.ts`.

## Implementation Plan

1. Add `src/test-utils.tsx` and a minimal `src/test-utils/vitest.setup.ts` that imports `@testing-library/jest-dom` and configures MSW (PR 11.1).
2. Add `test:vitest`, `test:vitest:watch`, and `test:vitest:coverage` scripts and a minimal `vitest.config.ts` or `test` block in `vite.config.ts` (PR 11.1).
3. Convert `src/features/mandarin/hooks/useProgressContext.ts` to accept optional DI and update its tests to use DI + `renderHookWithProviders` (PR 11.2).
4. Convert 3–5 high-value tests (useProgressData, csvLoader, PlayButton) to use `customRender`/`vi` and MSW where appropriate; run focused suites locally and in CI (PR 11.3).
5. Validate test stability and coverage in CI. If stable, update the main `test` script to point to Vitest and remove Jest devDependencies/config (PR 11.4).
6. Continue converting remaining tests in small batches, using the same pattern and PR checklist.

Mapping: Acceptance Criteria map to steps above (AC: test-utils -> step 1, AC: Vitest configured -> step 2, AC: DI test -> step 3, AC: 3–5 migrated -> step 4, AC: Guide -> step 1/2 docs).

## Risks & mitigations

- Risk: CI breakage when switching test runners — Severity: High

  - Mitigation: Keep Jest and its `test` script until a converted subset passes under Vitest in CI. Add `test:vitest` and run focused suites first.
  - Rollback: Revert PR that changes the main `test` script and re-enable Jest pipeline if necessary.

- Risk: Flaky or brittle tests after conversion — Severity: Medium

  - Mitigation: Use MSW for network mocking, convert tests incrementally, add timeouts/retries only when necessary, and prefer unit-level tests with DI.
  - Rollback: Restore the previous test implementation for any failing test and investigate root causes in a follow-up PR.

- Risk: Coverage regression — Severity: Medium

  - Mitigation: Run coverage on converted subsets and compare to baseline before full switch; require coverage gate in CI for converted suites.
  - Rollback: Delay full switch until coverage parity is achieved; keep Jest for any uncovered areas until conversion.

## Implementation notes

- Conventions: follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`.
- Quick setup: add Vitest dev-dependency, scripts (`test:vitest`, `test:vitest:watch`, `test:vitest:coverage`) and a minimal `vitest.setup.ts` to initialize `@testing-library/jest-dom` and MSW — see `docs/business-requirements/epic-11-testing-dependency-injection/implementation/Vitest-Integration-Guide.md` for full steps.
- Initial conversion target: `src/features/mandarin/hooks/useProgressContext.ts` (useProgressData).
- For examples, diffs, and operational details, see `docs/business-requirements/epic-11-testing-dependency-injection/implementation/`.
- Test runner: Vitest (use `vi` for mocks).
- Add dev-deps and scripts: `test:vitest`, `test:vitest:watch`, `test:vitest:coverage`.
- Minimal setup: create `src/test-utils/vitest.setup.ts` to import `@testing-library/jest-dom` and start MSW in node mode.
- Full install/config examples, sample `vitest.config.ts`, and PR checklist: see `docs/business-requirements/epic-11-testing-dependency-injection/implementation/Vitest-Integration-Guide.md`.
