/**
 * @file router/__tests__/LearnRoutes.grammar.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) —
 * `LearnRoutes` Phase-2 gate for `/learn/grammar`.
 * Story 22.3: Grammar UI
 *
 * - currentPhase 1 → PhaseGate redirects to `/learn/foundations` (GrammarPage NOT rendered)
 * - currentPhase 2 → GrammarPage renders (grammar unlocked)
 *
 * The phase gate is fetched through the real `usePhaseGate` + `apiClient`,
 * intercepted by the MSW node server. `FoundationsPage` is stubbed so the
 * redirect target (which fetches pinyin data on mount) doesn't pull in
 * unrelated network calls.
 */
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { server, grammarHandlers } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { LearnRoutes } from "../LearnRoutes";

// FoundationsPage fetches pinyin data on mount — stub it so the redirect
// assertion targets navigation, not Foundations internals.
vi.mock("../../pages/learn/foundations/FoundationsPage", () => ({
  FoundationsPage: () => <div>FoundationsPage stub</div>,
}));

const PHASE_GATE_URL = "http://localhost:3001/api/v1/progression/phase-gate";
// The intro paragraph is longer than the leading sentence — match a substring.
const GRAMMAR_PAGE_INTRO = /Browse the core sentence patterns of Mandarin/;

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

describe("LearnRoutes — /learn/grammar phase gate", () => {
  // The real app mounts LearnRoutes under `/learn/*` (Router.tsx) — replicate
  // that wiring so LearnRoutes' internal Routes match `/learn/grammar`.
  function renderAtGrammarRoute() {
    renderWithProviders(
      <Routes>
        <Route path="/learn/*" element={<LearnRoutes />} />
      </Routes>,
      { route: "/learn/grammar" },
    );
  }

  it("redirects to /learn/foundations when the learner is below Phase 2", async () => {
    usePhaseGate(1);

    renderAtGrammarRoute();

    // Phase gate resolves → Navigate to /learn/foundations (stubbed page renders)
    await waitFor(() => expect(screen.getByText("FoundationsPage stub")).toBeInTheDocument());
    // GrammarPage is never mounted
    expect(screen.queryByText(GRAMMAR_PAGE_INTRO)).not.toBeInTheDocument();
  });

  it("renders the GrammarPage when the learner is at Phase 2", async () => {
    usePhaseGate(2);
    server.use(...grammarHandlers.default());

    renderAtGrammarRoute();

    await waitFor(() => expect(screen.getByText(GRAMMAR_PAGE_INTRO)).toBeInTheDocument());
    // Grammar data flows through the real page
    await waitFor(() => expect(screen.getByText("吗 yes/no questions")).toBeInTheDocument());
  });
});
