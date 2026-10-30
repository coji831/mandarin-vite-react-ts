/**
 * @file router/__tests__/LearnRoutes.guestAtPhase1.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) — the four
 * Learn routes that never had a wall test (`foundations`, `radicals`,
 * `phonetic-clusters`, `readers`) are OPEN to a guest at Phase 1
 * (Story 25-3 / A25; BM-1 §3 "Learn — all content … no lock", L6).
 *
 * Companion to the inverted wall tests (`LearnRoutes.grammar.test.tsx`,
 * `LearnRoutes.chengyu.test.tsx`) — together they pin the guest-at-phase-1
 * assertion on all six Learn routes.
 *
 * The guest gate is served through MSW from the single source of truth
 * (`createGuestPhaseGate()` → `{currentPhase: 1, isGuest: true}`) so a returning
 * route wall would read it and redirect — and these assertions would fail.
 * The four page modules are stubbed: each route's contract under test is
 * "the router resolves straight to the page", not page-level data fetching.
 */
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createGuestPhaseGate } from "@mandarin/shared-constants";
import { server } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { LearnRoutes } from "../LearnRoutes";

vi.mock("../../pages/learn/foundations/FoundationsPage", () => ({
  FoundationsPage: () => <div>FoundationsPage page</div>,
}));

vi.mock("../../pages/learn/radicals/RadicalsPage", () => ({
  RadicalsPage: () => <div>RadicalsPage page</div>,
}));

vi.mock("../../pages/learn/phonetic-clusters/PhoneticClustersPage", () => ({
  PhoneticClustersPage: () => <div>PhoneticClustersPage page</div>,
}));

vi.mock("../../features/readers", () => ({
  ReadersPage: () => <div>ReadersPage page</div>,
}));

const PHASE_GATE_URL = "http://localhost:3001/api/v1/progression/phase-gate";
const FOUNDATIONS_PAGE = "FoundationsPage page";

const ROUTES = [
  { path: "/learn/foundations", page: FOUNDATIONS_PAGE },
  { path: "/learn/radicals", page: "RadicalsPage page" },
  { path: "/learn/phonetic-clusters", page: "PhoneticClustersPage page" },
  { path: "/learn/readers", page: "ReadersPage page" },
];

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe.each(ROUTES)("LearnRoutes — $path is un-gated (A25)", ({ path, page }) => {
  function renderAtRoute() {
    renderWithProviders(
      <Routes>
        <Route path="/learn/*" element={<LearnRoutes />} />
      </Routes>,
      { route: path, auth: { isAuthenticated: false, user: null } },
    );
  }

  it("renders the page for a guest at Phase 1 (no gate screen, no redirect)", async () => {
    // The calibrated guest gate — Phase 1 — served through the real MSW server.
    server.use(http.get(PHASE_GATE_URL, () => HttpResponse.json(createGuestPhaseGate())));

    renderAtRoute();

    await waitFor(() => expect(screen.getByText(page)).toBeInTheDocument());
    if (path !== "/learn/foundations") {
      // Nothing redirected to the old gate target.
      expect(screen.queryByText(FOUNDATIONS_PAGE)).not.toBeInTheDocument();
    }
  });
});
