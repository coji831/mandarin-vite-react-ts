# Story 14.1 Implementation: Jest to Vitest Migration

## Overview

**Story:** [Story 14.1: Jest to Vitest Migration](../../business-requirements/epic-14-api-modernization/story-14-1-jest-to-vitest-migration.md)

**Epic:** [Epic 14: API & Infrastructure Modernization](./README.md)

**Status:** Planned

**Last Update:** February 2, 2026

## Implementation Summary

Migrate all frontend tests from Jest to Vitest to resolve monorepo module resolution issues and align testing infrastructure with Vite tooling. This involves installing Vitest dependencies, updating configuration, migrating test syntax, and removing Jest.

## Files Changed

### New Files

- None (configuration only)

### Modified Files

- `apps/frontend/vite.config.ts` - Add Vitest configuration
- `apps/frontend/src/setupTests.ts` - Update for Vitest globals
- `apps/frontend/package.json` - Update test scripts, dependencies
- All `*.test.ts` and `*.test.tsx` files - Update imports and mock syntax

### Deleted Files

- `apps/frontend/jest.config.js` - Jest configuration (replaced by Vitest in vite.config.ts)
- `apps/frontend/tsconfig.test.json` - Test-specific TypeScript config (no longer needed)

## Implementation Steps

### Step 1: Install Vitest Dependencies

```bash
npm install --save-dev vitest@^1.2.0 @vitest/ui@^1.2.0 jsdom@^24.0.0 --workspace=apps/frontend
```

**Notes:**

- `@testing-library/react` and `@testing-library/jest-dom` already installed
- `jsdom` provides browser-like environment for React component tests
- `@vitest/ui` enables interactive UI test runner

### Step 2: Configure Vitest in vite.config.ts

**File:** `apps/frontend/vite.config.ts`

Add Vitest configuration to existing Vite config:

```typescript
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            if (req.headers.cookie) {
              proxyReq.setHeader("Cookie", req.headers.cookie);
            }
          });
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/setupTests.ts",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/",
        "dist/",
      ],
    },
  },
});
```

**Key Settings:**

- `globals: true` - Makes `describe`, `it`, `expect` available without imports
- `environment: 'jsdom'` - Simulates browser DOM for React tests
- `setupFiles` - Runs before each test file (sets up jest-dom matchers)
- `css: true` - Processes CSS imports in tests
- `coverage` - Configures coverage reporting with v8 provider

### Step 3: Update setupTests.ts for Vitest

**File:** `apps/frontend/src/setupTests.ts`

```typescript
import "@testing-library/jest-dom";
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { beforeAll, vi } from "vitest";

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock environment variables
beforeAll(() => {
  // Mock import.meta.env for tests
  vi.stubGlobal("import", {
    meta: {
      env: {
        VITE_API_URL: "http://localhost:3001",
        MODE: "test",
        DEV: false,
        PROD: false,
      },
    },
  });
});
```

**Changes from Jest:**

- Import `expect`, `afterEach`, `beforeAll`, `vi` from `vitest`
- `vi.stubGlobal` replaces process.env mocking for Vite's `import.meta.env`
- `cleanup()` still called after each test (RTL best practice)

### Step 4: Update package.json Scripts

**File:** `apps/frontend/package.json`

Update test scripts and dependencies:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.10.5",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.5",
    "@vitejs/plugin-react": "^4.3.4",
    "@vitest/ui": "^1.2.0",
    "eslint": "^9.17.0",
    "jsdom": "^24.0.0",
    "typescript": "~5.6.2",
    "vite": "^5.4.13",
    "vitest": "^1.2.0"
  }
}
```

**Changes:**

- Remove: `jest`, `ts-jest`, `@types/jest`, `jest-environment-jsdom`
- Add: `vitest`, `@vitest/ui`, `jsdom`
- Update scripts: Replace all Jest commands with Vitest equivalents

### Step 5: Migrate Test Files

**Pattern for all `.test.ts` and `.test.tsx` files:**

**Before (Jest):**

```typescript
import { jest } from "@jest/globals";

describe("Component", () => {
  it("should work", () => {
    const mockFn = jest.fn();
    jest.spyOn(console, "log");
    expect(mockFn).toHaveBeenCalled();
  });
});
```

**After (Vitest):**

```typescript
import { vi } from "vitest";

describe("Component", () => {
  it("should work", () => {
    const mockFn = vi.fn();
    vi.spyOn(console, "log");
    expect(mockFn).toHaveBeenCalled();
  });
});
```

**Migration Checklist Per File:**

1. Remove `import { jest } from '@jest/globals'` (if exists)
2. Add `import { vi } from 'vitest'` (if using mocks/spies)
3. Replace `jest.fn()` → `vi.fn()`
4. Replace `jest.spyOn()` → `vi.spyOn()`
5. Replace `jest.mock()` → `vi.mock()`
6. Replace `jest.useFakeTimers()` → `vi.useFakeTimers()`
7. Keep all other code unchanged (`describe`, `it`, `expect`, RTL queries)

**Automated Migration Script (Optional):**

```bash
# Find all test files
find apps/frontend/src -name "*.test.ts*" -type f

# For each file, run replacements:
# jest.fn() → vi.fn()
# jest.spyOn → vi.spyOn
# jest.mock → vi.mock
# jest.useFakeTimers → vi.useFakeTimers
```

### Step 6: Verify Migration

Run tests incrementally:

```bash
# Run all tests
npm test --workspace=apps/frontend

# Run specific test file
npm test --workspace=apps/frontend -- axiosClient.test.ts

# Run with coverage
npm run test:coverage --workspace=apps/frontend

# Run with UI
npm run test:ui --workspace=apps/frontend
```

**Expected Output:**

- All tests pass (same count as Jest)
- No module resolution errors
- Coverage reports generated in `apps/frontend/coverage/`

### Step 7: Remove Jest Dependencies

```bash
npm uninstall jest ts-jest @types/jest jest-environment-jsdom --workspace=apps/frontend
```

**Verify removal:**

```bash
grep -r "jest" apps/frontend/package.json
# Should return only @testing-library/jest-dom (needed for matchers)
```

### Step 8: Delete Jest Configuration Files

```bash
rm apps/frontend/jest.config.js
rm apps/frontend/tsconfig.test.json
```

**Rationale:**

- `jest.config.js` - No longer needed (Vitest configured in `vite.config.ts`)
- `tsconfig.test.json` - No longer needed (Vitest uses main `tsconfig.json` with Vite's module resolution)

### Step 9: Final Validation

```bash
# Verify all tests pass
npm test --workspace=apps/frontend

# Verify build succeeds
npm run build --workspace=apps/frontend

# Verify no Jest references remain
grep -r "jest" apps/frontend/src
# Should only show @testing-library/jest-dom imports in setupTests.ts
```

## Technical Decisions

### Decision: Vitest Over Jest

**Rationale:**

- Native Vite integration eliminates module resolution issues
- Faster execution via Vite's transform pipeline
- Same API as Jest (minimal migration effort)
- Better ESM support (Axios, future dependencies)

**Alternatives Considered:**

- Keep Jest, fix module resolution → Ongoing maintenance burden
- Use Vitest alongside Jest → Unnecessary duplication

**Implications:**

- One-time migration cost (~4-6 hours)
- Team learns Vitest patterns (minor learning curve)
- Future tests written in Vitest (no Jest knowledge needed)

### Decision: globals: true in Vitest Config

**Rationale:**

- Matches Jest behavior (no import needed for `describe`, `it`, `expect`)
- Simplifies migration (no need to add imports to every test file)
- Standard Vitest pattern for Jest migrations

**Alternatives Considered:**

- Explicit imports → More verbose, no real benefit

**Implications:**

- Test files cleaner (fewer imports)
- TypeScript may warn if `vitest/globals` not in types

### Decision: Keep @testing-library/jest-dom

**Rationale:**

- Provides essential matchers (`toBeInTheDocument`, `toHaveTextContent`, etc.)
- Works perfectly with Vitest (name is legacy, functionality is universal)
- Removing would require rewriting all assertion logic

**Alternatives Considered:**

- None viable (matchers are essential for React component tests)

**Implications:**

- Dependency name mentions "jest" but works with Vitest
- Team should understand this is a matcher library, not Jest itself

## Validation Checklist

- [ ] `npm test --workspace=apps/frontend` passes all tests
- [ ] `npm run test:coverage --workspace=apps/frontend` generates coverage report
- [ ] `npm run build --workspace=apps/frontend` succeeds without errors
- [ ] No `jest` references in `apps/frontend/package.json` (except `@testing-library/jest-dom`)
- [ ] `jest.config.js` deleted
- [ ] `tsconfig.test.json` deleted
- [ ] `vite.config.ts` contains `test` configuration block
- [ ] `setupTests.ts` imports from `vitest`
- [ ] All test files use `vi` instead of `jest` for mocks/spies

## Related Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Vitest Configuration](https://vitest.dev/config/)
- [Migrating from Jest](https://vitest.dev/guide/migration.html)
- [Testing Library with Vitest](https://testing-library.com/docs/react-testing-library/setup#vitest)
