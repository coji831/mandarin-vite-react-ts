# Story 14.1: Jest to Vitest Migration

## Story Summary

**As a** frontend developer,
**I want to** migrate all frontend tests from Jest to Vitest,
**So that** testing infrastructure aligns with Vite tooling and avoids monorepo module resolution issues.

**Epic:** [Epic 14: API & Infrastructure Modernization](./README.md)

**Related Implementation:** [Story 14.1 Implementation](../../issue-implementation/epic-14-api-modernization/story-14-1-jest-to-vitest-migration.md)

**Status:** Planned

**Last Update:** February 2, 2026

## Background

The frontend currently uses Jest as the testing framework, which creates **module resolution conflicts** in the monorepo environment:

**Current Issues:**

- **Hoisted dependency conflicts**: Jest cannot resolve `ts-jest` preset or `axios` despite being installed in root `node_modules`
- **TypeScript module resolution mismatch**: Vite uses `moduleResolution: "bundler"`, but Jest requires `"node"` resolution
- **ESM/CommonJS friction**: Vite favors ESM, Jest traditionally uses CommonJS, requiring transform configurations
- **Separate TypeScript configs**: Need `tsconfig.test.json` with different settings than app config
- **Configuration complexity**: Requires `jest.config.js`, `setupTests.ts`, transform settings, moduleNameMapper patterns

**Vitest Advantages:**

- ✅ **Native Vite integration**: Uses same bundler and transform pipeline as app
- ✅ **Zero config overhead**: Reuses `vite.config.ts` with minimal test-specific additions
- ✅ **ESM-first**: Handles modern modules without transforms
- ✅ **Faster execution**: Leverages Vite's hot module replacement for watch mode
- ✅ **Compatible API**: Most Jest tests migrate with minimal changes (same `describe`, `it`, `expect`)

Migrating to Vitest **before** implementing Axios client setup (Story 14.2) ensures clean testing infrastructure for all new API interceptor/retry logic.

## Acceptance Criteria

- [ ] Vitest installed with React Testing Library support
- [ ] All existing test files execute successfully with Vitest
- [ ] Test commands updated in `package.json` (`test`, `test:watch`, `test:coverage`)
- [ ] Vite config extended with Vitest configuration
- [ ] Setup file migrated from `setupTests.ts` to Vitest globals
- [ ] Jest dependencies removed from `apps/frontend/package.json`
- [ ] `jest.config.js` deleted
- [ ] `tsconfig.test.json` deleted (no longer needed)
- [ ] All tests pass: `npm test --workspace=apps/frontend` succeeds
- [ ] Coverage reporting functional with `npm run test:coverage --workspace=apps/frontend`

## Technical Approach

### Installation

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom --workspace=apps/frontend
```

### Configuration Changes

**apps/frontend/vite.config.ts:**

```typescript
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    css: true,
  },
});
```

**apps/frontend/src/setupTests.ts:**

```typescript
import "@testing-library/jest-dom";
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

**apps/frontend/package.json** (update test scripts):

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

### Test File Migration

Most tests require **minimal changes**:

1. Replace Jest-specific imports:

   ```typescript
   // Before (Jest)
   import { jest } from "@jest/globals";

   // After (Vitest)
   import { vi } from "vitest";
   ```

2. Update mock functions:

   ```typescript
   // Before (Jest)
   const mockFn = jest.fn();
   jest.spyOn(module, "method");

   // After (Vitest)
   const mockFn = vi.fn();
   vi.spyOn(module, "method");
   ```

3. Keep everything else the same:
   - `describe`, `it`, `expect` work identically
   - React Testing Library usage unchanged
   - `beforeEach`, `afterEach`, `beforeAll`, `afterAll` unchanged

### Cleanup Steps

1. Remove Jest dependencies:

   ```bash
   npm uninstall jest ts-jest @types/jest jest-environment-jsdom --workspace=apps/frontend
   ```

2. Delete Jest configuration:

   ```bash
   rm apps/frontend/jest.config.js
   rm apps/frontend/tsconfig.test.json
   ```

3. Verify no Jest references remain in `package.json` or config files.

## Dependencies

**Blocks:**

- Story 14.2 (Axios setup with interceptors) - needs working test infrastructure

**Blocked By:**

- None (foundational change)

**Relates To:**

- Epic 9 (State Performance Core) - existing tests to migrate
- Epic 19 (State Refactor) - future tests will use Vitest

## Success Metrics

- All existing tests pass with Vitest (0 failures)
- Test execution time reduced by 30%+ compared to Jest
- No module resolution errors in test output
- Coverage reporting generates HTML reports successfully

## Out of Scope

- Migrating backend tests (remain on Jest for Node.js environment)
- Adding new test cases (only migrate existing)
- Performance optimization beyond default Vitest settings
- Integration/E2E tests (focus on unit/component tests)

## Testing Plan

1. **Phase 1: Install & Configure**
   - Install Vitest + dependencies
   - Configure `vite.config.ts` with test settings
   - Update `setupTests.ts` for Vitest
   - Update `package.json` test scripts

2. **Phase 2: Migrate Tests**
   - Identify all test files: `find apps/frontend/src -name "*.test.ts*"`
   - Update imports (`jest` → `vi`)
   - Update mock syntax
   - Run tests file-by-file to catch issues

3. **Phase 3: Validate**
   - Run full test suite: `npm test --workspace=apps/frontend`
   - Verify coverage: `npm run test:coverage --workspace=apps/frontend`
   - Check watch mode: `npm run test:watch --workspace=apps/frontend`

4. **Phase 4: Cleanup**
   - Remove Jest dependencies
   - Delete Jest config files
   - Verify build: `npm run build --workspace=apps/frontend`

## Implementation Notes

- Vitest uses Vite's `import.meta.env` natively (no special handling needed)
- `jsdom` environment required for React component tests
- Coverage provider: use `@vitest/coverage-v8` (default, no install needed)
- Watch mode more efficient than Jest (uses Vite HMR)

## Risk Assessment

**Low Risk:**

- Vitest API closely matches Jest
- Existing tests should migrate with minimal changes
- Can test migration incrementally before removing Jest

**Mitigation:**

- Keep Jest installed during migration to compare outputs
- Document any API differences encountered
- Maintain backup branch before Jest removal
