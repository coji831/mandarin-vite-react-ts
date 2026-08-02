# Storybook MSW Handler Factories

**Category:** Frontend / Storybook
**Last Updated:** August 1, 2026
**Difficulty:** Intermediate

> **Scope:** The `mswHandlers` object in `apps/frontend/.storybook/msw-handlers.ts` — a
> DRY, factory-based pattern for mocking API endpoints per Storybook visual state.

---

## Problem

Storybook stories need every API response shape (default, loading, empty, error) to render
realistically. Hand-writing inline `http.get(...)` handlers in every `.stories.tsx` file
duplicates mock data and drifts from the real API contract. We need one central registry of
endpoint factories that stories compose into per-state handler arrays.

## Root Cause

- MSW handlers are per-request; expressing "this endpoint, but loading / empty / error" inline
  means repeating the same URL and response scaffolding in each story.
- Fixture bodies (phase-gate records, radical progress, radical character lists) are shared
  across stories; hardcoding them in stories makes updates error-prone.

## Solution

### 1. Grouped `mswHandlers` object

`.storybook/msw-handlers.ts` exports a single grouped object keyed by domain (`auth`,
`progression`, `radicals`, `mnemonics`, `phoneticClusters`):

```ts
export const mswHandlers = {
  auth: [ /* array handlers that are always active */ ],
  progression: {
    phaseGate: (phase?: 1 | 2 | 3 | 4) => http.get(`${API_BASE}/progression/phase-gate`, ...),
    radicalProgress: {
      default: () => http.get(..., () => HttpResponse.json(RADICAL_PROGRESS_BODIES.all)),
      loading: () => http.get(..., () => new Promise(() => {})),
      empty:   () => http.get(..., () => HttpResponse.json([])),
      error:   () => http.get(..., () => HttpResponse.json({ error: "..." }, { status: 500 })),
    },
  },
  radicals: { default, loading, empty, error, byId, byIdLoading, byIdError, characters },
  // ...
};
```

### 2. Endpoint state factories (`.default() / .loading() / .empty() / .error()`)

Each fetch-capable endpoint exposes factory functions that return a ready-to-use MSW handler:

- `.default()` — 200 with realistic fixture data.
- `.loading()` — a never-resolving `new Promise(() => {})` to hold the loading state.
- `.empty()` — 200 with `[]` (or `null` / 404 where the UI treats it as empty).
- `.error()` — 500 (or 404) with an `{ error }` body.

### 3. Fixture maps with generic fallbacks

Reusable bodies live in module-scope maps — `PHASE_GATE_BODIES`, `RADICAL_PROGRESS_BODIES`,
`RADICAL_CHARACTERS`, `PHONETIC_CLUSTER_FAMILIES`. Per-id endpoints fall back to a generic
payload so unmapped ids still render:

```ts
const RADICAL_CHARACTERS: Record<string, Array<{ glyph: string; pinyin: string; meaning: string }>> = {
  rad_0001: [/* ... */],
  rad_0008: [/* ... */],
};

characters: (radicalId = "rad_0001") =>
  http.get(`${API_BASE}/radicals/${radicalId}/characters`, () =>
    HttpResponse.json({
      radicalId,
      characters:
        RADICAL_CHARACTERS[radicalId] ?? [
          { glyph: "一", pinyin: "yī", meaning: "one" },
          { glyph: "七", pinyin: "qī", meaning: "seven" },
        ],
    }),
  ),
```

Catch-all regex handlers cover "any id not explicitly handled", e.g.:

```ts
notFound: http.get(new RegExp(`^${API_BASE}/v1/mnemonics/.+`), () =>
  HttpResponse.json(null, { status: 404 }),
),
```

### 4. Consumption in stories — compose factories into handler arrays

`RadicalsPageFull.stories.tsx` composes factories per story and adds a `beforeEach` for
determinism:

```tsx
const PHASE2 = [mswHandlers.progression.phaseGate(2), mswHandlers.radicals.default()];
const PHASE3 = [
  mswHandlers.progression.phaseGate(3),
  mswHandlers.radicals.default(),
  mswHandlers.progression.radicalProgress.default(),
];

const MASTERED_RADICAL_IDS = ["rad_0001", "rad_0002", "rad_0003", "rad_0008", "rad_0009"];
const PHASE3_TREE = [
  ...PHASE3,
  ...MASTERED_RADICAL_IDS.map((id) => mswHandlers.radicals.characters(id)),
];

export const Trees: Story = {
  parameters: {
    layoutPath: "/learn/radicals?view=trees",
    msw: { handlers: PHASE3_TREE },
  },
  beforeEach: treeModeBeforeEach("radical"), // seeds localStorage.treeMode for determinism
};
```

The `treeModeBeforeEach` helper guarantees each story renders its intended tree regardless of
`localStorage.treeMode` persisted by other stories or the live app.

## Impact

- **DRY mock data** — fixtures live in one file; a story is a one-line composition.
- **Full state parity** — every UI state maps to a named factory, so stories and the
  production hook paths stay aligned (see the Storybook-Production Alignment instruction).
- **Deterministic story tests** — `beforeEach` seeding prevents cross-story pollution when
  stories run headlessly via `@storybook/addon-vitest`.

## Alternatives Considered

- **Per-story inline handlers** — simplest but duplicates URLs/bodies and drifts from the API.
- **A single default handler array** — fine for happy-path, cannot express loading/empty/error
  per story.
- **Full mock server (JSON fixtures via `msw` onMockedServer)** — more moving parts; the
  factory pattern already covers the required states.

## Pitfalls (from epic-21)

- **Full base URLs only** — every handler URL must be absolute
  (`${API_BASE}/...`, with `API_BASE = "http://localhost:3001/api/v1"`). MSW does
  not resolve relative paths in the Node test env or Storybook, so a relative
  `/api/v1/...` never matches.
- **`decodeURIComponent` percent-encoded path params** — for `:glyph`-style
  params the URL segment arrives percent-encoded (e.g. `%E4%BD%98`); decode
  before comparing: `const glyph = decodeURIComponent(String(params.glyph))`.
- **Refresh/me mocks return a well-formed, non-expired JWT** — the axios
  interceptor proactively refreshes when `isTokenExpired()` is true and
  refresh-then-retries on `401`/`403 INVALID_TOKEN`. A fake or expired token in
  the `/auth/refresh` / `/auth/me` mock makes the interceptor re-refresh → double
  refresh. Return a base64 JWT with a future `exp`.
- **State-fill exemptions** — MSW only covers the network. Persisted state
  (e.g. `localStorage.treeMode`) must be seeded with a `beforeEach` hook
  (`treeModeBeforeEach`), not with a handler.

## See Also

- [Storybook Story Tests via `@storybook/addon-vitest`](../testing/storybook-addon-vitest.md) —
  how these handlers feed headless story tests.
- `.github/instructions/storybook-production-alignment.instructions.md` — the operative
  container-as-story-target + state-parity rules.
- `apps/frontend/.storybook/msw-handlers.ts`,
  `apps/frontend/src/pages/learn/radicals/RadicalsPageFull.stories.tsx`.
