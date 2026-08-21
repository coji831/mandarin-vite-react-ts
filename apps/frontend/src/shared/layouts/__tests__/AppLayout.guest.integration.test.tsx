/**
 * @file shared/layouts/__tests__/AppLayout.guest.integration.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) — the
 * CALIBRATED guest identity end-to-end (Story 24-7). The real `usePhaseGate`
 * hook fetches `GET /v1/progression/phase-gate` through `apiClient`; MSW
 * serves the ACTUAL calibrated guest gate — `createGuestPhaseGate()` →
 * `{currentPhase: 1, isGuest: true}` — imported from `@mandarin/shared-constants`
 * (the single source of truth). A guest shell must render the Phase-1
 * identity: the Foundations Learn item stays unlocked, Phase-2+ items
 * (Radicals/Grammar/…) render locked — NOT the old all-unlocked
 * `currentPhase: 4` guest.
 */
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createGuestPhaseGate } from "@mandarin/shared-constants";
import { server } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { AppLayout } from "../AppLayout";

// The HubModal is not under test — stub it so the shell renders lean.
vi.mock("features/lexical-hub/components", () => ({
  LexicalHubRouter: () => null,
}));

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

describe("AppLayout — calibrated guest identity (Story 24-7)", () => {
  it("renders the Phase-1 guest shape end-to-end (not all-unlocked)", async () => {
    // Serve the ACTUAL calibrated guest gate from the shared source of truth.
    server.use(http.get(PHASE_GATE_URL, () => HttpResponse.json(createGuestPhaseGate())));

    renderGuestShell();

    // Phase-1 Learn item (Foundations) stays unlocked for the guest…
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /Foundations/ })).not.toHaveAttribute("aria-disabled"),
    );
    // …and Phase-2+ items render locked — the guest is NOT all-unlocked.
    const grammar = screen.getByRole("link", { name: /Grammar/ });
    expect(grammar).toHaveAttribute("aria-disabled");
    expect(grammar).toHaveAttribute("title", "Complete Phase 2 to unlock");
  });

  it("keeps a guest Phase-1 (not all-unlocked) when the phase-gate fetch fails", async () => {
    // Backend unavailable → `usePhaseGate` falls back to phase-1 for a guest
    // (never the old all-unlocked `: 4` override).
    server.use(http.get(PHASE_GATE_URL, () => HttpResponse.error()));

    renderGuestShell();

    await waitFor(() => expect(screen.getByText("page content")).toBeInTheDocument());
    const grammar = screen.getByRole("link", { name: /Grammar/ });
    expect(grammar).toHaveAttribute("aria-disabled");
  });
});
