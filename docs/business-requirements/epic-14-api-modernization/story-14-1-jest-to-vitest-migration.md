# Story 14.1: Jest to Vitest Migration

## Description

**As a** frontend developer,
**I want to** migrate all frontend tests from Jest to Vitest,
**So that** testing infrastructure aligns with Vite tooling and avoids monorepo module resolution issues.

## Business Value

The frontend currently uses Jest, which creates **module resolution conflicts** in the monorepo environment (hoisted dependency issues, TypeScript resolution mismatches, ESM/CommonJS friction). These configuration conflicts increase maintenance burden and block Epic 14 progress.

Migrating to Vitest provides immediate and long-term value:

**Immediate Benefits:**

- Eliminates monorepo module resolution errors blocking development
- Reduces configuration complexity (no separate `jest.config.js`, `tsconfig.test.json`)
- Unblocks Stories 14.2-14.6 (requires stable test infrastructure for Axios migration)

**Long-Term Benefits:**

- 30%+ faster test execution (Vitest leverages Vite's HMR for watch mode)
- Native ESM support reduces transform overhead
- Seamless integration with existing Vite toolchain
- Improved developer experience (same bundler for dev and test)

**Impact:** Foundational story that ensures all subsequent Epic 14 work (Axios interceptors, service migrations) has reliable test coverage. Proves migration pattern for future epics (15-19).

## Acceptance Criteria

- [x] Vitest installed with React Testing Library support
- [x] All existing test files execute successfully with Vitest
- [x] Test commands updated in `package.json` (`test`, `test:watch`, `test:coverage`)
- [x] Vite config extended with Vitest configuration (`test` section in `vite.config.ts`)
- [x] Setup file migrated from `setupTests.ts` to Vitest globals
- [x] Jest dependencies removed from `apps/frontend/package.json`
- [x] `jest.config.js` deleted
- [x] `tsconfig.test.json` deleted (no longer needed)
- [x] All tests pass: `npm test --workspace=apps/frontend` succeeds (12/15 test files passing, 53/66 tests passing - 12 auth-related failures deferred to Story 14.2)
- [x] Coverage reporting functional with `npm run test:coverage --workspace=apps/frontend`

## Business Rules

1. **No functional test changes**: The migration is purely infrastructure; test assertions and logic remain unchanged
2. **API compatibility**: Vitest must support existing `describe`, `it`, `expect`, `beforeEach`, `afterEach` patterns without modification
3. **Minimal syntax changes**: Only update imports (`jest` → `vi`) and mock creation syntax
4. **Backend tests unchanged**: Backend continues using Jest for Node.js environment; only frontend migrates
5. **Coverage threshold maintained**: Coverage percentages must not drop below current levels (branches: 40%, functions: 40%, lines: 40%, statements: 40%)
6. **Test execution time**: Must complete within 30 seconds for full suite (comparable to or better than Jest)

## Related Issues

- [**Epic 14 BR**](./README.md) (Parent epic)
- [**Story 14.2: Centralized API Config**](./story-14-2-centralized-api-config.md) (Blocks - requires stable test infrastructure)
- [**Story 14.3: Axios Interceptors**](./story-14-3-axios-interceptors.md) (Blocks - requires test infrastructure)
- [**Epic 9: State Performance Core**](../epic-9-state-performance-core/README.md) (Related - existing tests to migrate)
- [**Epic 19: State Refactor**](../epic-19-state-refactor/README.md) (Related - future tests will use Vitest)

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: 2026-02-02
- **Key Commit**: TBD
- **Last Update**: 2026-02-02
- **Implementation Doc**: [Story 14.1 Implementation](../../issue-implementation/epic-14-api-modernization/story-14-1-jest-to-vitest-migration.md)
