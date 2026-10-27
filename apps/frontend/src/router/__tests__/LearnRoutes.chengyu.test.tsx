/**
 * @file router/__tests__/LearnRoutes.chengyu.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) —
 * `/learn/chengyu` is OPEN to every visitor (Story 25-3 / A25; BM-1 §3, L6).
 * Story 23.3: Chengyu UI — inverted by Story 25-3.
 *
 * - guest at currentPhase 3 → ChengyuPage renders (the old PhaseGate redirect
 *   to `/learn/foundations` is deleted)
 * - currentPhase 4 → ChengyuPage renders (unchanged)
 *
 * The MSW gate handler is kept deliberately: it serves a guest-shaped gate
 * (`currentPhase: 3` — still below Chengyu's former Phase-4 wall), so if a
 * route wall ever comes back it redirects and the assertion fails.
 * `FoundationsPage` is stubbed so the old redirect target can be asserted
 * ABSENT.
 */
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { server, chengyuHandlers } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { LearnRoutes } from "../LearnRoutes";

// FoundationsPage fetches pinyin data on mount — stub it so the assertion
// targets the route's page, not unrelated network calls.
vi.mock("../../pages/learn/foundations/FoundationsPage", () => ({
  FoundationsPage: () => <div>FoundationsPage stub</div>,
}));

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

describe("LearnRoutes — /learn/chengyu is un-gated (A25)", () => {
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

  it("renders the ChengyuPage below the former Phase-4 wall (no gate, no redirect)", async () => {
    usePhaseGate(3);
    server.use(...chengyuHandlers.default());

    renderAtChengyuRoute();

    await waitFor(() => expect(screen.getByText(CHENGYU_PAGE_INTRO)).toBeInTheDocument());
    // Chengyu data flows through the real page
    await waitFor(() => expect(screen.getByText("破釜沉舟")).toBeInTheDocument());
    // The retired redirect target never renders.
    expect(screen.queryByText("FoundationsPage stub")).not.toBeInTheDocument();
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
