---
description: "Use when adding new logic, writing tests, or completing a story. Covers minimum testing requirements for new code: what must be tested and at what level. Prevents untested code from shipping."
applyTo: "apps/frontend/src/**/*.ts,apps/frontend/src/**/*.tsx,apps/backend/src/**/*.ts"
---

# Testing Standards — The Testing Trophy

This project follows Kent C. Dodds' **Testing Trophy**: the broadest, cheapest
checks at the bottom; fewer, heavier, slowest checks at the top. Write most of
your tests as **integration tests** (the largest slice) and keep unit tests
small, pure, and fast. Never rely on a test you haven't written.

```
            E2E (few)              Playwright — critical user journeys only
        INTEGRATION (largest)      component+service+MSW · hook+store+MSW · service+repo+DB
            UNIT (small)           pure logic: utils, formatters, reducers, pure strategy fns
       STATIC (broadest)           build (type-check) · eslint · design-lint · pre-delivery checklist
```

A new feature ships with: the **static** tier satisfied, the pure logic covered by
**unit** tests, and the data-flowing surfaces covered by **integration** tests.
E2E is reserved for a handful of critical journeys.

---

## 1. STATIC — base tier (always, cheapest, broadest)

The STATIC tier is a **test-writing requirement** — every change must satisfy
it — not a gate definition. Authoritative gate commands live in the canonical
two-tier model in `project-workflow.instructions.md` (source of truth); this
section only describes what the tier covers.

| Check                  | Command                                                                              | Requirement |
| ---------------------- | ------------------------------------------------------------------------------------ | ----------- |
| Type-check             | `npm run build` (canonical type-check gate — covers all workspaces + the test graph) | 0 errors    |
| Lint                   | `npm run lint`                                                                       | 0 errors    |
| Design lint            | `npx @google/design.md lint DESIGN.md`                                               | 0 drift     |
| Pre-delivery checklist | `.github/instructions/frontend-pre-delivery-checklist.instructions.md`               | all items   |

> ⚠️ Use `npm run build` for the type-check gate — not a bare `npx tsc`, which
> omits the test graph (`tsconfig.test`) and lets type errors in test files slip through.

Static analysis catches the cheapest class of bugs — wrong types, unused code,
design-token drift, missed states — before a single test runs. **If static
fails, don't write tests yet; fix the code.**

## 2. UNIT — small slice, pure logic only

Unit tests cover **pure functions** with no I/O: input in, output out. If a
function touches the DOM, a store, `fetch`, or `apiClient`, it is **not** a
unit candidate — write an integration test instead.

| What to unit test     | Examples in this repo                                                  |
| --------------------- | ---------------------------------------------------------------------- |
| Pinyin / tone utils   | `pinyinUtils`, `stripToneMarks`, `extractToneNumber`, tone-sandhi math |
| Stroke utils          | `strokeUtils`, segmenter/parser logic                                  |
| Date / format helpers | formatting, clamping, mapping helpers                                  |
| Pure store reducers   | `quizSessionStore` reducers, `uiStore` state transitions               |
| Quiz scoring math     | score/accuracy calculations, pass/fail thresholds                      |
| Pure strategy fns     | strategy-pattern selection logic (no `apiClient`)                      |

**Conventions**

- Co-locate: `src/<module>/__tests__/<thing>.test.ts` (or `.test.tsx` for pure components that don't fetch).
- 1 test per exported function (happy path + at least 1 edge case).
- **No mocking of I/O in unit tests.** If you need a mock, it belongs in the integration tier.
- `npm test -- --run src/<module>/` to run a focused slice.

```typescript
// utils/__tests__/pinyinUtils.test.ts
import { stripToneMarks } from "../pinyinUtils";

describe("stripToneMarks", () => {
  it("removes tone marks", () => expect(stripToneMarks("mā")).toBe("ma"));
  it("leaves neutral tone untouched", () => expect(stripToneMarks("ma")).toBe("ma"));
});
```

## 3. INTEGRATION — the LARGEST slice (most of your tests)

Integration tests verify that **pieces work together**: a component with its
service, a hook with its store, a page with real API-shaped data. This is where
the trophy is won — most regressions (missing provider, wrong API shape,
broken store wiring) live here.

### Backend

- **Scope**: Service + Repository + DB. Real Prisma against a **test database** (never the dev/prod DB).
- **Location**: `apps/backend/tests/integration/**`.
- **Minimum**: 1 integration test per service public method that reads/writes the DB.
- Runs via `vitest.integration.config.ts`.

### Frontend

- **Scope**: component + MSW · hook + store + MSW · page-level render with API data.
- **Infrastructure** (already in place):
  - `apps/frontend/src/test-utils.tsx` → `renderWithProviders(ui, opts)` — wraps `AuthContext` (mock), `MemoryRouter`, and store providers. **Always use this for anything rendering a component** so `useAuth`/routing/zustand work.
  - `apps/frontend/src/mocks/server.ts` → MSW `setupServer` built from `src/mocks/handlers/*`.
  - `src/mocks/handlers/*` → per-endpoint MSW handlers (also used by Storybook).
- **MSW URLs must be absolute** — in `server.use(...)` and handlers use full
  `http://localhost:3001/api/v1/...` URLs (MSW does not resolve relative paths),
  and `decodeURIComponent(String(params.x))` for percent-encoded path params.
- **Per-test lifecycle** (in each integration test file):

```typescript
import { server } from "src/mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- **Override** the default server per test with `server.use(http.get(...))` — this is how you stub a specific endpoint for a specific scenario.
- **Minimum**:
  - Every data-fetching component: 1 integration test covering loading → success (and error where cheap).
  - Every data-fetching hook: 1 hook + store + MSW test (happy path + 1 edge).
  - Every page that renders API data: 1 page-level render with MSW-mocked data.
- **Assert the DISPLAY output, not just loading → success.** For async-enriched data, the test
  must assert the enriched/derived field actually renders (e.g. a `ClassificationBadge` appears),
  not merely that the fetch resolved. A component that renders the raw fetch shape instead of
  the `displayFamily`-style enriched data is a bug — real case: `PhoneticFamilyNode` rendered
  `family.members` instead of `displayFamily.members`, so badges never appeared after enrichment.

```tsx
// features/readers/hooks/__tests__/usePassages.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "src/mocks/server";
import { usePassages } from "../usePassages";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it("loads passages from the API", async () => {
  server.use(
    http.get("http://localhost:3001/api/v1/readers/passages", () =>
      HttpResponse.json({ data: [{ id: "p1", title: "A" }] }),
    ),
  );
  const { result } = renderHook(() => usePassages());
  expect(result.current.isLoading).toBe(true);
  await waitFor(() => expect(result.current.passages).toHaveLength(1));
});
```

## 4. E2E — few, critical journeys only

Playwright (browser) tests. **≤ 10 scenarios**, only user journeys that cross
the full stack and are painful to cover any other way:

- login → quiz (auth + quiz flow)
- login → read a passage → bookmark it (readers + auth)
- review flow (review → rating → progress)

**Location**: `apps/frontend/e2e/`.

**Never add** E2E for a page you already cover with an integration test — E2E
is slow and flaky; integration is the workhorse.

---

## Minimum Requirements by Tier

| Tier                   | What MUST be tested                                 | Min per new code                            | File convention                                           |
| ---------------------- | --------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| STATIC                 | build (type-check), lint, design-lint, pre-delivery | always required                             | —                                                         |
| UNIT                   | pure functions, pure reducers, strategy math        | 1 test per exported fn + 1 edge             | `__tests__/*.test.ts`                                     |
| INTEGRATION (backend)  | service public methods w/ DB                        | 1 per method                                | `apps/backend/tests/integration/**`                       |
| INTEGRATION (frontend) | components w/ API, hooks + stores + API, pages      | loading → success per data-fetching surface | `__tests__/*.test.tsx` + `renderWithProviders` + `server` |
| E2E                    | critical journeys                                   | only if journey not covered lower           | `apps/frontend/e2e/` (≤10)                                |

## ❌ Never Ship Untested (per tier)

- ❌ No "will add tests later" — write them with the code.
- ❌ No skipping tests because "it works in dev" or "it's simple".
- ❌ No shipping with **static** failures (build type-check/lint/design-lint) — fix those first.
- ❌ No shipping a data-fetching component with **no integration test** — a `vi.mock` of the service is not a substitute for a component + MSW test.
- ❌ No mocking a service to fake "unit coverage" of a component — that hides the wiring bugs integration tests catch.
- ❌ No converting an integration test into a unit test by over-mocking internals.

## Gates (Pointer to Canonical Model)

Gates are defined in the canonical two-tier model in
`project-workflow.instructions.md` (source of truth). Quick ref:

- **Static:** `npm run build` + `npm run lint`
- **Full suite:** `npm run test:full` + `npm run test-storybook --workspace=@mandarin/frontend`
- **Design:** `npx @google/design.md lint DESIGN.md` + `npm run design-audit`

`npm test` is NOT a gate — it is the changed-scope Tier-1 runner
(`vitest run --changed`) for fast local iteration only. The full-suite gate
is `npm run test:full`.

## Reasoning

The trophy is shaped the way it is because test value ≠ test count. Static
analysis catches the cheapest bugs; a fat layer of integration tests catches
the regressions that actually bite (provider missing, API shape drift, store
wiring); unit tests pin down tricky pure logic cheaply; and a thin E2E layer
guards the few journeys that need a real browser. "Story complete" means the
static tier is satisfied AND the right slice of tests exists and passes.

---

**See also:** `frontend-api-client.instructions.md` (service layer to test) • `quiz-architecture.instructions.md` (strategy pattern testing) • `frontend-input-handling.instructions.md` (timer edge case tests) • `frontend-component-architecture.instructions.md` (import/barrel rules tests enforce)
