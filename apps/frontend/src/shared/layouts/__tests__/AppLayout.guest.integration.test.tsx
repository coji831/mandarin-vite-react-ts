/**
 * @file shared/layouts/__tests__/AppLayout.guest.integration.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) — the guest
 * shell end-to-end. The real `usePhaseGate` hook would fetch
 * `GET /v1/progression/phase-gate` through `apiClient`; MSW serves the ACTUAL
 * calibrated guest gate — `createGuestPhaseGate()` → `{currentPhase: 1,
 * isGuest: true}` — imported from `@mandarin/shared-constants` (the single
 * source of truth).
 *
 * Story 25-3 / A25 inverted this file: a guest at `/learn/grammar` sees the page
 * and an unimpeded sidebar. The gate handler is kept ON PURPOSE — the shell no
 * longer reads it for navigation, so if a phase wall (route or nav) ever comes
 * back it will read this Phase-1 gate, lock Phase-2+ items, and fail here.
 * Guest state lives on the Browse dashboard, never in this layout.
 */
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createGuestPhaseGate } from "@mandarin/shared-constants";
import { LEARN_NAV_ITEMS } from "shared/constants";
import { server } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { AppLayout } from "../AppLayout";

const PHASE_GATE_URL = "http://localhost:3001/api/v1/progression/phase-gate";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => localStorage.clear());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

function renderGuestShell() {
  renderWithProviders(
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="*" element={<div>page content</div>} />
      </Route>
    </Routes>,
    { route: "/learn/grammar", auth: { isAuthenticated: false, user: null } },
  );
}

function expectEveryLearnItemEnabled() {
  for (const item of LEARN_NAV_ITEMS) {
    const link = screen.getByRole("link", { name: item.label });
    expect(link).toHaveAttribute("href", item.path);
    expect(link).not.toHaveAttribute("aria-disabled");
    expect(link).not.toHaveAttribute("tabindex");
    expect(link.getAttribute("title") ?? "").not.toMatch(/unlock|locked|requires/i);
  }
}

describe("AppLayout — guest shell (A25: no phase wall)", () => {
  it("renders the guest page and an unimpeded Learn group at /learn/grammar", async () => {
    // Serve the ACTUAL calibrated guest gate from the shared source of truth.
    server.use(http.get(PHASE_GATE_URL, () => HttpResponse.json(createGuestPhaseGate())));

    renderGuestShell();

    // The routed page renders for a Phase-1 guest — no gate screen, no redirect.
    await waitFor(() => expect(screen.getByText("page content")).toBeInTheDocument());
    expectEveryLearnItemEnabled();
  });

  it("renders the same unimpeded shell when the phase-gate fetch fails", async () => {
    // Backend unavailable → irrelevant now: navigation reads no gate at all.
    server.use(http.get(PHASE_GATE_URL, () => HttpResponse.error()));

    renderGuestShell();

    await waitFor(() => expect(screen.getByText("page content")).toBeInTheDocument());
    expectEveryLearnItemEnabled();
  });
});
