/**
 * @file router/__tests__/LearnRoutes.guest.integration.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) — Epic 25
 * Phase A guest identity end-to-end through the FULL shell (AppLayout +
 * LearnRoutes). The real `usePhaseGate` fetches
 * `GET /v1/progression/phase-gate` via `apiClient`; MSW serves the ACTUAL
 * calibrated guest gate — `createGuestPhaseGate()` → `{currentPhase: 1,
 * isGuest: true}` — imported from `@mandarin/shared-constants`.
 *
 * Asserts the guest Phase-1 shell (sidebar Foundations unlocked, Phase-2+
 * items locked, passive Guest badge in the AppTopBar) AND that direct
 * higher-phase Learn navigation renders the shared LockedSurface gate screen
 * (not content, not a redirect). Foundations stays always-accessible.
 */
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createGuestPhaseGate } from "@mandarin/shared-constants";
import { server } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { AppLayout } from "../../shared/layouts/AppLayout";
import { LearnRoutes } from "../LearnRoutes";

// The HubModal is not under test — stub it so the shell renders lean.
vi.mock("features/lexical-hub/components", () => ({
  LexicalHubRouter: () => null,
}));

// FoundationsPage fetches pinyin data on mount — stub it so the
// always-accessible assertion targets the route gate, not page internals.
vi.mock("../../pages/learn/foundations/FoundationsPage", () => ({
  FoundationsPage: () => <div>FoundationsPage stub</div>,
}));

const PHASE_GATE_URL = "http://localhost:3001/api/v1/progression/phase-gate";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => localStorage.clear());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

function renderGuestAt(path: string) {
  // Serve the ACTUAL calibrated guest gate from the shared source of truth.
  server.use(http.get(PHASE_GATE_URL, () => HttpResponse.json(createGuestPhaseGate())));
  renderWithProviders(
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/learn/*" element={<LearnRoutes />} />
      </Route>
    </Routes>,
    { route: path, auth: { isAuthenticated: false, user: null } },
  );
}

describe("Epic 25 — guest direct higher-phase nav renders the gate screen (not content)", () => {
  it("guest Phase-1 shell + LockedSurface on direct /learn/grammar nav", async () => {
    renderGuestAt("/learn/grammar");

    // ── Phase-1 shell: passive Guest badge in the AppTopBar (S1, no CTA) ──
    await waitFor(() => expect(screen.getByTestId("guest-identity-badge")).toBeInTheDocument());
    expect(screen.getByTestId("guest-identity-badge")).toHaveTextContent("Guest");

    // Foundations stays unlocked for the guest…
    expect(screen.getByRole("link", { name: /Foundations/ })).not.toHaveAttribute("aria-disabled");
    // …and Phase-2+ items (Grammar) render locked — the guest is NOT all-unlocked.
    const grammarLink = screen.getByRole("link", { name: /Grammar/ });
    expect(grammarLink).toHaveAttribute("aria-disabled");
    expect(grammarLink).toHaveAttribute("title", "Complete Phase 2 to unlock");

    // ── Route gate: direct /learn/grammar nav shows the locked-surface screen ──
    // (scope to the gate screen — the sidebar also has a "Grammar" label)
    const lockedSurface = await screen.findByTestId("locked-surface");
    expect(within(lockedSurface).getByText("Grammar")).toBeInTheDocument();
    expect(within(lockedSurface).getByText("Unlocks in Phase 2.")).toBeInTheDocument();
    // Grammar content is NOT mounted; no redirect target either.
    expect(screen.queryByText("FoundationsPage stub")).not.toBeInTheDocument();
  });

  it("keeps Foundations always accessible for a guest (no gate screen)", async () => {
    renderGuestAt("/learn/foundations");

    await waitFor(() => expect(screen.getByText("FoundationsPage stub")).toBeInTheDocument());
    // Guest badge still present (guest identity is app-shell-wide).
    expect(screen.getByTestId("guest-identity-badge")).toBeInTheDocument();
    expect(screen.queryByTestId("locked-surface")).not.toBeInTheDocument();
  });
});
