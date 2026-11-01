/**
 * @file __tests__/pages.a11y.test.tsx
 * @description Page-level axe gate — the unit suite's half of the accessibility contract.
 *
 * Component-level a11y is already enforced by `test-storybook`: `.storybook/preview.tsx` sets
 * `parameters.a11y.test: "error"`, so every story fails on an axe violation. Pages were not
 * covered there — Storybook is a components-only surface and the nineteen page stories were
 * deleted, which left all twenty routes in `.github/page-inventory.json` with no automated
 * accessibility check at all. This file closes that gap without re-adding page stories: it
 * renders each page through the real router, in guest state, against the shared MSW handlers,
 * and runs the same axe rule selection the Storybook gate runs.
 *
 * Why the assertion fails on EVERY violation, not only `critical`/`serious`: the Storybook gate
 * does. `@storybook/addon-a11y`'s `afterEach` calls `expect(result).toHaveNoViolations()` and
 * `vitest-axe`'s matcher filters by impact only when `toolOptions.impactLevels` is set, which
 * `preview.tsx` never sets. Matching that here keeps the two surfaces agreeing on what
 * "accessible" means instead of running a quieter gate on pages.
 *
 * Known scope limits, stated rather than hidden:
 *   - axe runs against the RTL `container`, so document-scope rules that select `html`
 *     (`html-has-lang`, `document-title`, `landmark-one-main`, `page-has-heading-one`) do not
 *     run here. Those are properties of `apps/frontend/index.html` (`lang="en"`, a `<title>`),
 *     not of a page, and the jsdom test document has neither — running at document scope would
 *     report the test harness as two serious failures on every page.
 *   - jsdom has no layout or cascade, so `color-contrast` and `target-size` come back as
 *     `incomplete`, never as violations. Contrast stays a browser/design-layer check.
 *   - the shared MSW handler set covers six endpoint families, not every endpoint a page calls.
 *     Unmocked endpoints are answered with a deterministic 404 by `API_FALLBACK` below, so a
 *     page that owns no fixture is checked in its empty/error data state — never in a state
 *     that needed the network.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { act, render, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { AuthContext, type AuthContextValue } from "features/auth";
import { handlers } from "src/mocks/server";
import MainRoutes from "src/router/Router";

const here = path.dirname(fileURLToPath(import.meta.url));
const INVENTORY_PATH = path.resolve(here, "../../../../.github/page-inventory.json");

type InventoryPage = {
  route: string;
  component: string | null;
  archetype: string | null;
  status: string;
};

/** Mirrors `parameters.a11y.options.runOnly` in `.storybook/preview.tsx`, tag for tag. */
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

const A11Y_OPTIONS = {
  runOnly: { type: "tag", values: AXE_TAGS },
} as axe.RunOptions;

/**
 * `color-contrast` probes every text node through a 2-D canvas to spot icon ligatures. jsdom has
 * no canvas, so each probe logs a "Not implemented: HTMLCanvasElement.prototype.getContext" stack
 * — 22 KB of noise per run that would bury a real failure. axe gets no pixels there either way
 * (the call throws and the check lands in `incomplete`), so answering `null` changes no outcome:
 * the rule cannot evaluate under jsdom and never produces a violation. Deleting this does not
 * widen the gate, it only stops the harness shouting.
 */
const canvasGetContext = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "getContext");

/**
 * Answers every API call the shared handlers do not, so a page without a fixture renders its
 * empty/error data state instead of attempting the request over the network. Registered last,
 * so a real handler still wins.
 */
const API_FALLBACK = http.all(/\/api\//, () =>
  HttpResponse.json(
    { error: "No fixture for this endpoint in the page a11y test" },
    { status: 404 },
  ),
);

const server = setupServer(...handlers, API_FALLBACK);

/** Requests MSW has not answered yet — the settling signal, so no wait has to guess a duration. */
let inFlight = 0;

/** Guest state: no account, no tokens — the state most visitors arrive in. */
const GUEST_AUTH: AuthContextValue = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshTokens: async () => "guest-token",
};

/**
 * The inventory names one route as a pattern, not an address. `*` is `NotFoundPage`, so it
 * needs a concrete URL that no other route claims.
 */
const ROUTE_OVERRIDES: Record<string, string> = {
  "*": "/this-route-does-not-exist",
};

/**
 * Pages that cannot be rendered as their own surface. Each one is a decision a reviewer can
 * argue with — an unexplained skip is exactly the failure this test exists to prevent.
 */
const EXCLUDED: Record<string, string> = {
  "/learn":
    "Redirect alias: the `LearnRoutes` index is `<Navigate to='/learn/foundations'>`, so it has no page component of its own (inventory status: diverges).",
  "/learn/basic":
    "Redirect alias: `LearnRoutes` maps `basic` to `<Navigate to='/learn/foundations'>`; that surface is checked at `/learn/foundations` (inventory status: diverges).",
};

type AllowlistEntry = {
  rule: string;
  impact: string;
  target: string;
  reason: string;
};

/**
 * Violations this test knowingly carries, per page. Empty today. Every entry added here names
 * the rule, the impact, the element it sits on and the decision it waits for, and it is listed
 * in the run report — an allowlist nobody can see is how a gate stops being one.
 */
const ALLOWLIST: Record<string, AllowlistEntry[]> = {};

function loadInventoryPages(): InventoryPage[] {
  const inventory = JSON.parse(readFileSync(INVENTORY_PATH, "utf8")) as {
    pages: InventoryPage[];
  };
  return inventory.pages;
}

const INVENTORY_PAGES = loadInventoryPages();
const TESTABLE_PAGES = INVENTORY_PAGES.filter((page) => !(page.route in EXCLUDED));

/**
 * The pages share nothing about how they load, so the wait cannot be one locator. It happens in
 * three steps, none of them a fixed sleep: let the mount effects issue their requests, wait until
 * MSW has answered every one of them (`inFlight`), then wait until the DOM has stopped changing
 * for three consecutive ticks — the point at which React has committed what the responses changed.
 * The hard cap keeps a page that polls forever from hanging the suite instead of failing it.
 */
async function settlePage(
  container: HTMLElement,
  { stableTicks = 3, tickMs = 15, timeoutMs = 4000 } = {},
): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
  await waitFor(() => expect(inFlight).toBe(0), { timeout: timeoutMs, interval: 10 });

  const startedAt = Date.now();
  let previous = "";
  let stable = 0;

  while (Date.now() - startedAt < timeoutMs) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, tickMs));
    });
    const current = container.innerHTML;
    stable = current === previous ? stable + 1 : 0;
    previous = current;
    if (stable >= stableTicks) return;
  }
}

/** Reads the router's live location so a redirect cannot pass for a rendered page. */
let lastPathname = "";
function LocationSpy() {
  lastPathname = useLocation().pathname;
  return null;
}

function renderRoute(route: string) {
  lastPathname = "";
  return render(
    <AuthContext.Provider value={GUEST_AUTH}>
      <MemoryRouter initialEntries={[route]}>
        <LocationSpy />
        <MainRoutes />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

beforeAll(() => {
  // Mirrors `parameters.a11y.config` in `.storybook/preview.tsx`.
  axe.configure({ rules: [{ id: "color-contrast", enabled: true }] });
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: () => null,
  });
  server.events.on("request:start", () => {
    inFlight += 1;
  });
  server.events.on("request:end", () => {
    inFlight -= 1;
  });
  server.listen({ onUnhandledRequest: "warn" });
});
afterEach(() => {
  inFlight = 0;
  server.resetHandlers();
});

afterAll(() => {
  server.close();
  server.events.removeAllListeners();
  if (canvasGetContext) {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", canvasGetContext);
  }
});

describe("page accessibility (axe, WCAG 2.2 A/AA)", () => {
  it("derives its page list from the inventory instead of a hand-typed array", () => {
    expect(INVENTORY_PAGES.length).toBeGreaterThan(0);
    expect(TESTABLE_PAGES.length).toBeGreaterThan(0);
    // Every inventory route is either rendered or explicitly excluded — no silent skips.
    expect(TESTABLE_PAGES.length + Object.keys(EXCLUDED).length).toBe(INVENTORY_PAGES.length);
  });

  for (const page of TESTABLE_PAGES) {
    const route = ROUTE_OVERRIDES[page.route] ?? page.route;

    it(`${page.route} (${page.component ?? "route"}) has no axe violations`, async () => {
      const { container } = renderRoute(route);
      await settlePage(container);

      const main = container.querySelector("main");
      expect(
        main,
        `${page.route} rendered no <main> region — the route did not resolve`,
      ).not.toBeNull();
      expect(
        main?.innerHTML.trim().length ?? 0,
        `${page.route} rendered an empty <main> — nothing was checked`,
      ).toBeGreaterThan(0);

      const results = await axe.run(container, A11Y_OPTIONS);

      const entries = ALLOWLIST[page.route] ?? [];
      const matched = new Set<AllowlistEntry>();
      const failing: string[] = [];

      for (const violation of results.violations) {
        for (const node of violation.nodes) {
          const target = node.target.join(" ");
          const entry = entries.find(
            (candidate) => candidate.rule === violation.id && target.includes(candidate.target),
          );
          if (entry) {
            matched.add(entry);
            continue;
          }
          const summary = node.failureSummary?.replace(/\n/g, "\n        ") ?? "";
          failing.push(
            `[${violation.impact}] ${violation.id} — ${violation.help}\n        at ${target}\n        ${summary}`,
          );
        }
      }

      expect(
        matched.size,
        `${page.route} carries an allowlist entry that no longer matches a violation — prune it rather than keeping a stale excuse`,
      ).toBe(entries.length);

      expect(
        failing,
        `${page.route} (guest state, ${route} → ${lastPathname}) has ${failing.length} axe violation node(s):\n      ${failing.join("\n      ")}`,
      ).toEqual([]);
    });
  }
});
