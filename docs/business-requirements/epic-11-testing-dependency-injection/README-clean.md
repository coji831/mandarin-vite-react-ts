# Epic 11: Testing & Dependency Injection

## Epic Summary

**Goal:** Improve test ergonomics by introducing provider test utilities and optional dependency injection (DI) in hooks so tests are easier to write, less brittle, and require fewer heavy mocks.

**Key Points:**

- Add `Providers` test wrapper and `customRender` / `renderHookWithProviders` helpers to centralize test environment setup.
- Allow hooks and services to accept optional DI overrides (storage, fetcher, cache) to make unit tests deterministic without module-level mocks.
- Provide example tests demonstrating reduced mocking and clearer assertions.
- Update CI tests gradually to use the new test utilities and keep existing tests working until conversions are complete.
- Document migration steps and sample patterns in `docs/business-requirements/epic-11-testing-dependency-injection/implementation/`.

**Status:** Planned

**Last Update:** 2025-10-16

## Background

Many tests in the codebase rely on heavy `jest.mock()` usage and ad-hoc provider setup. This increases test fragility and makes it harder to write focused unit tests. By standardizing test providers and allowing DI in key hooks, tests become faster, simpler, and less coupled to implementation details.

## User Stories

1. #XXXX / **Add test-utils provider wrappers**

   - As a test author, I want a `Providers` wrapper and `customRender` so I can render components with minimal boilerplate and consistent context providers.

2. #XXXX / **DI-enabled hooks**

   - As a developer, I want hooks to accept optional DI overrides (e.g., `useProgressData({ storage, fetcher } = {})`) so tests can inject fake storage/fetchers instead of mocking modules.

3. #XXXX / **Example tests & docs**

   - As a team member, I want example tests and migration docs that show how to convert existing tests to use the new helpers.

## Story Breakdown Logic

- Stories 11.1: Add `test-utils.tsx` with `Providers` and `customRender`.
- Stories 11.2: Update one or two hooks to accept DI and update their tests as examples.
- Stories 11.3: Gradually convert other tests and document patterns.

Rationale: start with the tooling (Providers), then change a couple of high-value hooks to accept DI and show examples before converting the rest.

## Acceptance Criteria

- [ ] `src/test-utils.tsx` (or `src/features/mandarin/test-utils.tsx`) exports `Providers`, `customRender`, and `renderHookWithProviders`.
- [ ] At least two hook tests updated to use DI overrides instead of `jest.mock()`.
- [ ] Example documentation and migration guide present in `docs/business-requirements/epic-11-testing-dependency-injection/implementation/`.
- [ ] CI tests run with the new helpers without regressing existing coverage.

## Architecture Decisions

- Decision: Provide DI via optional function arguments to hooks

  - Rationale: Minimal API changes and easy to use in tests; keeps production calls unchanged.
  - Alternatives considered: Large-scale refactor to an IoC container (too heavy).

- Decision: Centralize providers in `src/test-utils.tsx`

  - Rationale: Single place to update provider list and wrappers for future tests.

## Implementation Plan

1. PR 11.1 — Add `test-utils.tsx` with `Providers` and `customRender`, and document usage in a short README snippet.
2. PR 11.2 — Update one or two hooks to accept DI overrides and update their tests to demonstrate the pattern.
3. PR 11.3 — Gradually convert other tests to use `customRender` and remove unnecessary `jest.mock` calls.

## Risks & mitigations

- Risk: Large number of tests to convert — Severity: Low/Medium

  - Mitigation: Convert high-value tests first and leave the rest for follow-up sprints.

## Implementation notes

- Conventions: follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`.
- Operational notes: Keep DI optional in hooks to avoid changing existing production code paths.
- Links: Use `docs/templates/feature-design-template.md` and `docs/templates/implementation-large-epic-template.md` for design and PR templates.

---

Generated on: 2025-10-16
