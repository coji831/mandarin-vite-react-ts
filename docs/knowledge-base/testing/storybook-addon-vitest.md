# Storybook Story Tests via `@storybook/addon-vitest`

**Category:** Testing / Storybook
**Last Updated:** August 1, 2026
**Difficulty:** Advanced

> **Scope:** Running Storybook 10.x stories as Vitest tests in the frontend workspace, using
> the `@storybook/addon-vitest` plugin plus the `@vitest/browser-playwright` browser provider.

---

## Problem

Storybook stories are great for visual review, but they are also executable specs. We run them
locally via `npm run test-storybook --workspace=@mandarin/frontend` as a **MANUAL/local Tier-2
gate** — the repo's CI does **NOT** run story tests (it currently runs only `build-storybook` +
`lint:css`). Story tests exercise the story graph without maintaining a separate test suite
that duplicates story data. The challenge is wiring Storybook's story graph into the existing
Vitest runner — and doing it on Storybook 10.x, where the old `storybook test` subcommand no
longer exists.

## Root Cause

- Storybook 10.4 **removed the `test` subcommand** (`storybook test` / `storybook --test`).
  The supported path is now the **Vitest addon**: `@storybook/addon-vitest` exposes a
  `storybookTest()` plugin that registers a Vitest project which reads `.storybook/main.ts`
  and runs every story as a test.
- Story tests render into a **real browser**, so the project needs a browser provider. The
  repo pairs `storybookTest()` with `@vitest/browser-playwright` (headless Chromium), not the
  default jsdom environment.

## Solution

### 1. Add the addon to `.storybook/main.ts`

`@storybook/addon-vitest` must be registered as a Storybook addon so the browser-runner
integration is available:

```ts
// apps/frontend/.storybook/main.ts
const config: StorybookConfig = {
  // ...
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
  ],
  framework: { name: "@storybook/react-vite", options: {} },
};
```

### 2. Register a `storybook` test project in `vite.config.ts`

Add a second entry to `test.projects[]` (the first is the default jsdom project). The
`storybook` project composes the `storybookTest()` plugin (pointed at the Storybook config
directory) with the Playwright browser provider:

```ts
// apps/frontend/vite.config.ts
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

test: {
  projects: [
    { /* default jsdom project: globals, jsdom env, setupFiles ./src/setupTests.ts, css: true */ },
    {
      extends: true,
      plugins: [
        storybookTest({
          configDir: path.join(dirname, ".storybook"),
        }),
      ],
      test: {
        name: "storybook",
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{ browser: "chromium" }],
        },
      },
    },
  ],
}
```

### 3. Add the `test-storybook` script

```jsonc
// apps/frontend/package.json
{
  "scripts": {
    "test-storybook": "vitest run --project storybook",
  },
}
```

Run it from the repo root with `npm run test-storybook --workspace=@mandarin/frontend` (or
`npm run test-storybook` from `apps/frontend/`). This is a **manual/local Tier-2 gate** — it is
not invoked by CI. Story tests can also be filtered by name, e.g.
`vitest run --project storybook RadicalsPageFull`.

### 4. Keep stories browser-safe

Because the `storybook` project renders in real Chromium, stories must not rely on jsdom-only
behaviors. Use MSW handlers (see [Storybook MSW Handlers](./storybook-msw-handlers.md)) and
`beforeEach` hooks (e.g., seeding `localStorage.treeMode`) for deterministic per-story state.

## Impact

- **One source of truth** — stories double as tests; no parallel test data to drift.
- **Visual states execute and assert** — loading/empty/error stories actually run (locally, on
  demand) and assert, rather than relying on screenshots alone.
- **Fast feedback** — `test-storybook` runs alongside `npm test`, sharing the same Vitest
  (run it manually whenever stories change).
- **Future-proof on Storybook 10.x** — no reliance on the removed `test` subcommand.

## Alternatives Considered

- **`storybook test` CLI (pre-10.4)** — removed; only exists as the Vitest addon on 10.x.
- **Playwright Test (separate suite)** — decouples story tests from Vitest but duplicates
  configuration and loses single-runner DX.
- **Chromatic visual testing only** — catches pixels, not behavior; kept as a complement.

## Nuances & Pitfalls

- **Bare `vitest run` can hang** — the `storybook` browser project renders in real
  Chromium and can hang when the whole suite runs unscoped. Scope the frontend suite
  with `--project='!storybook'` (as `npm test` / `npm run test:full` do:
  `vitest run --changed --project='!storybook'` / `vitest run --project='!storybook'`)
  and run story tests ONLY via `npm run test-storybook` (`vitest run --project storybook`).
- **No nested story exports** — Storybook registers only top-level named exports as
  stories. Keep one export per state, flattened at the top level. Nested groupings
  (e.g. an object of states inside a single export) are silently unregistered — a
  story that is "missing" in `test-storybook` results is usually a nested export.

## See Also

- [Vitest Version Conflicts in a Monorepo](./vitest-monorepo-version-conflicts.md) — keeping
  the `storybook` project's Vitest in sync with the jsdom project.
- [Storybook MSW Handlers](./storybook-msw-handlers.md) — the handler-factory pattern that
  makes story tests deterministic.
- `apps/frontend/vite.config.ts`, `apps/frontend/.storybook/main.ts`,
  `apps/frontend/package.json`.
