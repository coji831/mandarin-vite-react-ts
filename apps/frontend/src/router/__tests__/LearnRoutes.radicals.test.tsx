/**
 * @file router/__tests__/LearnRoutes.radicals.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) —
 * `LearnRoutes` Phase-2 gate for `/learn/radicals`.
 * Epic 25 Phase A: closes the OPEN radicals URL bypass — the route is now
 * data-driven gated (requiredPhase 2 from LEARN_REQUIRED_PHASE) like every
 * other Learn route.
 *
 * - currentPhase 1 → the shared LockedSurface gate screen renders ("Radicals
 *   unlocks in Phase 2"); RadicalsPage NOT mounted.
 * - currentPhase 2 → RadicalsPage renders (radicals unlocked); gate screen
 *   absent.
 *
 * The phase gate is fetched through the real `usePhaseGate` + `apiClient`,
 * intercepted by the MSW node server. `RadicalsPage` is stubbed so the
 * success branch stays focused on the gate (no radicals/radical-progress
 * network calls).
 */
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { LearnRoutes } from "../LearnRoutes";

// RadicalsPage fetches radicals + radical-progress on mount — stub it so the
// unlocked branch asserts the route gate, not page internals.
vi.mock("../../pages/learn/radicals/RadicalsPage", () => ({
  RadicalsPage: () => <div>RadicalsPage stub</div>,
}));

const PHASE_GATE_URL = "http://localhost:3001/api/v1/progression/phase-gate";

function phaseGateBody(currentPhase: number) {
  return {
    id: `pg-${currentPhase}`,
    currentPhase,
    phase1Passed: currentPhase >= 2,
    phase2Passed: currentPhase >= 3,
    phase3Passed: currentPhase >= 4,
    phase4Unlocked: currentPhase >= 4,
    qualificationScore: 90,
    placedPhase: null,
    phase1Retention: 92,
    phase2Retention: 88,
    phase3Retention: currentPhase >= 4 ? 89 : null,
    gateCriteria: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

function usePhaseGate(currentPhase: number) {
  server.use(http.get(PHASE_GATE_URL, () => HttpResponse.json(phaseGateBody(currentPhase))));
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("LearnRoutes — /learn/radicals phase gate (Epic 25: bypass closed)", () => {
  // The real app mounts LearnRoutes under `/learn/*` (Router.tsx) — replicate
  // that wiring so LearnRoutes' internal Routes match `/learn/radicals`.
  function renderAtRadicalsRoute() {
    renderWithProviders(
      <Routes>
        <Route path="/learn/*" element={<LearnRoutes />} />
      </Routes>,
      { route: "/learn/radicals" },
    );
  }

  it("renders the LockedSurface gate screen for a Phase-1 learner (no redirect, no content)", async () => {
    usePhaseGate(1);

    renderAtRadicalsRoute();

    await waitFor(() => expect(screen.getByTestId("locked-surface")).toBeInTheDocument());
    expect(screen.getByText("Radicals")).toBeInTheDocument();
    expect(screen.getByText("Unlocks in Phase 2.")).toBeInTheDocument();
    // RadicalsPage is never mounted below phase
    expect(screen.queryByText("RadicalsPage stub")).not.toBeInTheDocument();
  });

  it("renders RadicalsPage when the learner is at Phase 2", async () => {
    usePhaseGate(2);

    renderAtRadicalsRoute();

    await waitFor(() => expect(screen.getByText("RadicalsPage stub")).toBeInTheDocument());
    // Gate screen is absent once unlocked
    expect(screen.queryByTestId("locked-surface")).not.toBeInTheDocument();
  });
});
