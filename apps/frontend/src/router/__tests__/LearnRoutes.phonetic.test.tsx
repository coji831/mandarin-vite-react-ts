/**
 * @file router/__tests__/LearnRoutes.phonetic.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) —
 * `LearnRoutes` Phase-3 gate for `/learn/phonetic-clusters`.
 * Epic 25 Phase A: closes the OPEN phonetic-clusters URL bypass — the route is
 * now data-driven gated (requiredPhase 3 from LEARN_REQUIRED_PHASE) like every
 * other Learn route.
 *
 * - currentPhase 2 → the shared LockedSurface gate screen renders ("Phonetic
 *   unlocks in Phase 3"); PhoneticClustersPage NOT mounted.
 * - currentPhase 3 → PhoneticClustersPage renders (phonetic clusters
 *   unlocked); gate screen absent.
 *
 * The phase gate is fetched through the real `usePhaseGate` + `apiClient`,
 * intercepted by the MSW node server. `PhoneticClustersPage` is stubbed so the
 * success branch stays focused on the gate (no phonetic-clusters network
 * calls).
 */
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { LearnRoutes } from "../LearnRoutes";

// PhoneticClustersPage fetches cluster families on mount — stub it so the
// unlocked branch asserts the route gate, not page internals.
vi.mock("../../pages/learn/phonetic-clusters/PhoneticClustersPage", () => ({
  PhoneticClustersPage: () => <div>PhoneticClustersPage stub</div>,
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

describe("LearnRoutes — /learn/phonetic-clusters phase gate (Epic 25: bypass closed)", () => {
  // The real app mounts LearnRoutes under `/learn/*` (Router.tsx) — replicate
  // that wiring so LearnRoutes' internal Routes match `/learn/phonetic-clusters`.
  function renderAtPhoneticRoute() {
    renderWithProviders(
      <Routes>
        <Route path="/learn/*" element={<LearnRoutes />} />
      </Routes>,
      { route: "/learn/phonetic-clusters" },
    );
  }

  it("renders the LockedSurface gate screen for a Phase-2 learner (no redirect, no content)", async () => {
    usePhaseGate(2);

    renderAtPhoneticRoute();

    await waitFor(() => expect(screen.getByTestId("locked-surface")).toBeInTheDocument());
    expect(screen.getByText("Phonetic")).toBeInTheDocument();
    expect(screen.getByText("Unlocks in Phase 3.")).toBeInTheDocument();
    // PhoneticClustersPage is never mounted below phase
    expect(screen.queryByText("PhoneticClustersPage stub")).not.toBeInTheDocument();
  });

  it("renders PhoneticClustersPage when the learner is at Phase 3", async () => {
    usePhaseGate(3);

    renderAtPhoneticRoute();

    await waitFor(() => expect(screen.getByText("PhoneticClustersPage stub")).toBeInTheDocument());
    // Gate screen is absent once unlocked
    expect(screen.queryByTestId("locked-surface")).not.toBeInTheDocument();
  });
});
