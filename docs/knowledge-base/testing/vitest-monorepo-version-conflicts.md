---
purpose: Vitest version conflicts in a monorepo
status: active
last-verified: 2026-08-01
type: guide
---

# Vitest Version Conflicts in a Monorepo

**Category:** Testing
**Last Updated:** August 1, 2026
**Difficulty:** Intermediate

> **Scope:** How the `mandarin-vite-react-ts` monorepo keeps a single, consistent Vitest
> version across all workspaces and the failure modes it guards against.

---

## Problem

In an npm-workspaces monorepo, tests suddenly fail with confusing symptoms that all trace
back to **more than one version of Vitest (or `@vitest/*` helpers) resolving in the tree**:

- Type errors on `defineConfig` — one workspace's config imports `vitest/config` from Vitest 4
  while another (or a transitive dependency) resolves Vitest 3.
- `storybookTest()` plugin incompatibility — the `@storybook/addon-vitest` plugin expects a
  specific Vitest major; a mismatched hoisted copy throws at config evaluation.
- The Storybook test-runner project (`--project storybook`) fails to start, or the browser
  provider (`@vitest/browser-playwright`) reports a version skew with the installed `vitest`.
- `npm ls vitest` shows `vitest@4.x` at the root but a nested `vitest@3.x` (or 2.x) under a
  workspace's `node_modules`.

In this repo the shared Vitest is **`vitest@^4.1.9`** (both `@mandarin/frontend` and
`@mandarin/backend`), with aligned `@vitest/ui@^4.0.18`, `@vitest/coverage-v8@^4.0.18`
(frontend), and `@vitest/browser-playwright@^4.1.9`. The lockfile currently hoists a single
`vitest@4.1.9` at the root `node_modules/vitest` — that is the state this guide keeps intact.

## Root Cause

1. **npm hoisting is per-range, not per-package.** npm installs one copy per distinct
   resolvable version. If one workspace writes `"vitest": "^4.1.9"` and a dependency (or a
   second workspace) pins a non-overlapping range such as `^3.2.0`, npm keeps **both** — the
   newer one hoisted, the older one nested. Each copy has its own `@vitest/*` transitive set.
2. **`vitest/config` is version-specific.** Config files import `defineConfig` from
   `vitest/config`. When two copies exist, a config may silently bind to the wrong copy —
   `defineConfig` types mismatch (Vitest 3 vs 4 flags) and runtime behavior diverges.
3. **Plugin/browser provider coupling.** `@storybook/addon-vitest`'s `storybookTest()` and
   `@vitest/browser-playwright`'s `playwright()` must be paired with the Vitest they were
   built for. A nested older Vitest breaks the browser-project pipeline even though the
   default jsdom project still passes.
4. **Workspace-local config location differences.** The frontend shares `vite.config.ts`
   (Vitest 4, `envDir` at repo root), the backend uses `vitest.config.ts`. Both must resolve
   the same hoisted Vitest; otherwise `test.projects[]` and `coverage` behave inconsistently.

## Solution

### 1. Align every `vitest` and `@vitest/*` range to one major

Both workspaces declare overlapping ranges on the same major (currently `^4.1.9`):

```jsonc
// apps/frontend/package.json  and  apps/backend/package.json
{
  "devDependencies": {
    "vitest": "^4.1.9",
    "@vitest/ui": "^4.0.18",
    "@vitest/coverage-v8": "^4.0.18", // frontend only
  },
}
```

Frontend-only storybook deps stay on the same major:

```jsonc
// apps/frontend/package.json
{
  "devDependencies": {
    "@storybook/addon-vitest": "^10.4.6",
    "@vitest/browser-playwright": "^4.1.9",
  },
}
```

### 2. Force a single hoisted copy with root `overrides` (if a transitive pins older)

If `npm ls vitest` ever shows nested copies, add a root-level override instead of bumping
each workspace:

```jsonc
// package.json (root)
{
  "overrides": {
    "vitest": "^4.1.9",
    "@vitest/browser-playwright": "^4.1.9",
  },
}
```

Then reinstall and confirm:

```bash
npm install
npm ls vitest          # expect a single vitest@4.x
npx vitest --version   # 4.1.x from the hoisted root copy
```

### 3. Keep `defineConfig` imports consistent

Always import `defineConfig` from `vitest/config` (never from `vite`) so the config type-checks
against the installed Vitest. The frontend does exactly this — see `apps/frontend/vite.config.ts`:

```ts
import { defineConfig } from "vitest/config";
// "Type-safe with Vitest 4.x (Vite 6 compatible)"
```

### 4. Run the storybook test project against the same Vitest

The frontend registers a second `test.projects[]` entry, `name: "storybook"`, that composes
`storybookTest({ configDir })` with the `playwright({})` browser provider — see
`apps/frontend/vite.config.ts`. Invoke it with the dedicated script:

```bash
npm run test-storybook   # = vitest run --project storybook
```

A single hoisted Vitest is what lets this project mix the jsdom project and the browser
project without provider/version drift.

## Impact

- **One canonical version** in the lockfile → reproducible CI, no "works on my machine".
- **Type-safe configs** — `defineConfig` from `vitest/config` catches flag/type drift at build.
- **Stable Storybook test runner** — the `storybook` project reliably boots Chromium via
  `@vitest/browser-playwright` because the plugin and browser provider share the Vitest major.
- **Same test DX across workspaces** — `npm test` / `npm run test:full` behave identically in
  `apps/frontend` and `apps/backend`.

## Alternatives Considered

- **Per-workspace lockfiles (pnpm/yarn isolated)** — strongest isolation but a bigger repo
  restructuring; npm workspaces + a single hoisted Vitest is sufficient here.
- **Exact-pinning every Vitest package** — prevents drift but blocks minor-version patches and
  still needs `overrides` to squash transitive copies.
- **Dropping the storybook project from Vitest** — avoids browser-provider coupling but loses
  story-level test coverage; not acceptable given the Storybook-first workflow.

## See Also

- [Storybook Tests via `@storybook/addon-vitest`](./storybook-addon-vitest.md) — wiring the
  `storybook` project end-to-end.
- [ES Modules + Testing Patterns](./testing-es-modules-vitest.md) — Jest→Vitest migration
  context from Epics 13/14.
- `apps/frontend/vite.config.ts` — the `test.projects[]` configuration this article describes.
