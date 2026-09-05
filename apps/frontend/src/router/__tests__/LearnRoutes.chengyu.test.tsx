/**
 * @file router/__tests__/LearnRoutes.chengyu.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) —
 * `LearnRoutes` Phase-4 gate for `/learn/chengyu`.
 * Story 23.3: Chengyu UI · Epic 25 Phase A: data-driven gate on all 6 routes.
 *
 * - currentPhase 3 → the shared LockedSurface gate screen renders ("Chengyu
 *   unlocks in Phase 4") — replaces the old silent redirect-to-foundations
 *   (ChengyuPage NOT rendered).
 * - currentPhase 4 → ChengyuPage renders (chengyu unlocked).
 *
 * The phase gate is fetched through the real `usePhaseGate` + `apiClient`,
 * intercepted by the MSW node server.
 */
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server, chengyuHandlers } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { LearnRoutes } from "../LearnRoutes";

const PHASE_GATE_URL = "http://localhost:3001/api/v1/progression/phase-gate";
// The intro paragraph is longer than the leading sentence — match a substring.
const CHENGYU_PAGE_INTRO = /Browse Mandarin idioms by theme and era/;

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

describe("LearnRoutes — /learn/chengyu phase gate", () => {
  // The real app mounts LearnRoutes under `/learn/*` (Router.tsx) — replicate
  // that wiring so LearnRoutes' internal Routes match `/learn/chengyu`.
  function renderAtChengyuRoute() {
    renderWithProviders(
      <Routes>
        <Route path="/learn/*" element={<LearnRoutes />} />
      </Routes>,
      { route: "/learn/chengyu" },
    );
  }

  it("renders the LockedSurface gate screen when the learner is below Phase 4", async () => {
    usePhaseGate(3);

    renderAtChengyuRoute();

    // Phase gate resolves → the shared locked-surface screen (not a redirect)
    await waitFor(() => expect(screen.getByTestId("locked-surface")).toBeInTheDocument());
    expect(screen.getByText("Chengyu")).toBeInTheDocument();
    expect(screen.getByText("Unlocks in Phase 4.")).toBeInTheDocument();
    // ChengyuPage is never mounted
    expect(screen.queryByText(CHENGYU_PAGE_INTRO)).not.toBeInTheDocument();
  });

  it("renders the ChengyuPage when the learner is at Phase 4", async () => {
    usePhaseGate(4);
    server.use(...chengyuHandlers.default());

    renderAtChengyuRoute();

    await waitFor(() => expect(screen.getByText(CHENGYU_PAGE_INTRO)).toBeInTheDocument());
    // Chengyu data flows through the real page
    await waitFor(() => expect(screen.getByText("破釜沉舟")).toBeInTheDocument());
  });
});
