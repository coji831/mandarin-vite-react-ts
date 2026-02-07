# Vitest Monorepo Version Conflicts

**Category:** Testing / Build Configuration  
**Last Updated:** February 2, 2026  
**Related:** Epic 14 Story 14.1 (Jest to Vitest Migration)

## TL;DR Quick Reference

```bash
# Problem: Vitest bundles older Vite versions, causing type conflicts
# Symptom: "Plugin<any> not assignable to Plugin<any>[]" TypeScript error
# Diagnosis: npm list vite --all
# Solution: Upgrade Vitest to match Vite major version
# Prevention: Pin Vitest version explicitly in package.json
```

## Problem Statement

In monorepo environments, **Vitest may bundle an older version of Vite** as a nested dependency, causing TypeScript type conflicts when your frontend explicitly uses a newer Vite version.

### When This Happens

- You explicitly depend on `vite@6.x.x` in your frontend workspace
- You install `vitest@1.x.x` (which internally bundles `vite@5.x.x`)
- TypeScript sees **two different versions of Vite's plugin types**
- You get errors like: `Type 'Plugin<any>' is not assignable to type 'Plugin<any>[]'`

## Symptoms

### TypeScript Build Errors

```
apps/frontend/vite.config.ts(10,12): error TS2322: Type 'Plugin<any>' is not
assignable to type 'Plugin<any>[]'.
  Type 'Plugin<any>' is missing the following properties from type 'Plugin<any>[]':
  length, pop, push, concat, and 33 more.
```

### Workaround Required (Bad Sign)

If you need `as any` in your Vite config, you likely have a version mismatch:

```typescript
// ❌ BAD: Type assertion indicates version conflict
export default defineConfig({
  plugins: [react() as any],
  test: {
    /* ... */
  },
});
```

## Diagnosis

### Step 1: Check Vite Version Tree

```bash
cd apps/frontend
npm list vite --all
```

**Expected Output (Healthy)**:

```
frontend@0.1.0 f:\React\mandarin-vite-react-ts\apps\frontend
├── vite@6.4.1
└─┬ vitest@4.0.18
  └── vite@6.4.1 deduped
```

**Problem Output (Version Conflict)**:

```
frontend@0.1.0 f:\React\mandarin-vite-react-ts\apps\frontend
├── vite@6.4.1
└─┬ vitest@1.2.0
  └── vite@5.4.21  # ⚠️ Nested older version!
```

### Step 2: Identify TypeScript Confusion

TypeScript sees two conflicting `vite` module types:

- `node_modules/vite@6.4.1/types/*.d.ts`
- `node_modules/vitest/node_modules/vite@5.4.21/types/*.d.ts`

When you import `Plugin` from `'vite'`, TypeScript may resolve the wrong version depending on module resolution order.

## Solution

### Option 1: Upgrade Vitest (Recommended)

Upgrade Vitest to a version that **depends on the same major version of Vite**:

```bash
# Check Vitest releases: https://github.com/vitest-dev/vitest/releases
# Find version compatible with Vite 6.x

npm install --save-dev vitest@4.0.18  # Vite 6 compatible
npm install --save-dev @vitest/ui@4.0.18
npm install --save-dev @vitest/coverage-v8@4.0.18
```

**Verify deduplication**:

```bash
npm list vite --all
# Should show "vite@6.4.1 deduped" under vitest
```

### Option 2: Downgrade Vite (Not Recommended)

If you can't upgrade Vitest, downgrade Vite to match Vitest's bundled version:

```bash
npm install --save-dev vite@5.4.21
```

**Tradeoffs**:

- ❌ Lose latest Vite features and performance improvements
- ❌ Security updates delayed
- ✅ Simpler immediate fix

### Option 3: Force Resolution (Monorepo Only)

In root `package.json`, force a single Vite version across all workspaces:

```json
{
  "overrides": {
    "vite": "6.4.1"
  }
}
```

**Tradeoffs**:

- ⚠️ May break Vitest if it depends on Vite 5.x APIs
- ⚠️ Use only as a temporary workaround
- ✅ Guarantees version deduplication

## Prevention

### Pin Vitest Version Explicitly

Always specify exact or caret versions in `package.json`:

```json
{
  "devDependencies": {
    "vite": "^6.4.1",
    "vitest": "^4.0.18", // ✅ Major version matches Vite
    "@vitest/ui": "^4.0.18",
    "@vitest/coverage-v8": "^4.0.18"
  }
}
```

### Pre-Install Checks

Before adding Vitest to a workspace:

1. Check current Vite version: `npm list vite`
2. Check Vitest compatibility: https://github.com/vitest-dev/vitest/releases
3. Verify matching major versions (Vite 6.x ↔ Vitest 4.x)
4. Install Vitest at compatible version

### Continuous Monitoring

```bash
# Run after any dependency updates
npm list vite --all | grep -E "vite@[0-9]"
```

If you see multiple Vite versions (especially without "deduped"), investigate immediately.

## Vitest Version History

| Vitest Version | Bundled Vite Version | Status                          |
| -------------- | -------------------- | ------------------------------- |
| 1.x.x          | 5.x.x                | Legacy (Vite 5 compatible)      |
| 2.x.x          | 5.x.x                | Transition (Vite 5 compatible)  |
| 3.x.x          | 6.x.x                | Stable (Vite 6 compatible)      |
| 4.x.x          | 6.x.x                | **Current** (Vite 6 compatible) |

**Rule of Thumb**: Vitest major version ≈ Vite major version + 1 or 2 (varies)

## When to Use Which

### Use Vitest 4.x When:

- ✅ Using Vite 6.x (latest)
- ✅ Starting new projects
- ✅ Want latest testing features
- ✅ Can accommodate breaking changes (reporter syntax, coverage options)

### Stay on Vitest 1.x When:

- ❌ Locked to Vite 5.x for compatibility
- ❌ Large test suite with complex setup (migration cost high)
- ⚠️ Only as temporary measure (upgrade path required)

## Vitest 4.x Breaking Changes (From 1.x)

### Reporter Syntax

```bash
# ❌ Old (Vitest 1.x)
vitest --reporter=basic

# ✅ New (Vitest 4.x)
vitest --reporter=verbose
# or
vitest --reporter=default
```

### Coverage Options

```typescript
// ❌ Old (Vitest 1.x)
coverage: {
  all: true,  // Include all files in coverage
}

// ✅ New (Vitest 4.x)
coverage: {
  // 'all' option removed, use include/exclude instead
  include: ['src/**/*.{ts,tsx}'],
  exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts'],
}
```

### Test Globals

```typescript
// No breaking changes - still works identically
test: {
  globals: true,  // describe, it, expect available globally
}
```

## Real-World Example (Epic 14 Story 14.1)

### Problem Encountered

```bash
$ npm run build

apps/frontend/vite.config.ts(10,12): error TS2322: Type 'Plugin<any>'
is not assignable to type 'Plugin<any>[]'.
```

### Investigation

```bash
$ npm list vite --all
frontend@0.1.0
├── vite@6.4.1
└─┬ vitest@1.2.0
  └── vite@5.4.21  # Conflict!
```

### Resolution

```bash
# Upgraded Vitest to Vite 6 compatible version
npm install --save-dev vitest@4.0.18 @vitest/ui@4.0.18 @vitest/coverage-v8@4.0.18

# Verified deduplication
$ npm list vite --all
frontend@0.1.0
├── vite@6.4.1
└─┬ vitest@4.0.18
  └── vite@6.4.1 deduped  # ✅ Fixed!
```

### Result

```typescript
// ✅ GOOD: Type-safe configuration, no assertions
export default defineConfig({
  plugins: [react()], // No 'as any' needed
  test: {
    /* ... */
  },
});
```

**Build output**: Clean TypeScript compilation, 53/66 tests passing.

## Additional Resources

- [Vitest Releases](https://github.com/vitest-dev/vitest/releases)
- [Vite Releases](https://github.com/vitejs/vite/releases)
- [Vitest Migration Guide](https://vitest.dev/guide/migration.html)
- [NPM Dependency Resolution](https://docs.npmjs.com/cli/v9/using-npm/scripts#dependencies)

## Related Documentation

- [Testing Guide](../guides/testing-guide.md) - Frontend Vitest configuration
- [ES Modules Testing](./testing-es-modules-vitest.md) - Vitest ESM patterns
- [Vite Configuration Guide](../guides/vite-configuration-guide.md) - Production config
