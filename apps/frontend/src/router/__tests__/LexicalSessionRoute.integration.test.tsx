/**
 * @file __tests__/LexicalSessionRoute.integration.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) for S2 —
 * "session = route, not modal". Renders the REAL router + AppLayout + GrammarPage
 * with MSW-mocked APIs, clicks a grammar pattern, and proves the session lands as
 * a routed Focus page (detail archetype chrome) instead of a dialog overlay.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server, grammarHandlers } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { grammarService } from "features/grammar";
import MainRoutes from "../Router";

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

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  grammarService.clearCache();
});
afterAll(() => server.close());

describe("lexical session as a route", () => {
  it("opens a grammar pattern as a routed Focus detail page, not a modal", async () => {
    server.use(
      ...grammarHandlers.default(),
      http.get(PHASE_GATE_URL, () => HttpResponse.json(phaseGateBody(4))),
    );

    const { container } = renderWithProviders(<MainRoutes />, { route: "/learn/grammar" });

    // Browse surface first: the grammar list renders cards.
    const card = await screen.findByRole("button", {
      name: /把 \(bǎ\) disposal construction/,
    });
    fireEvent.click(card);

    // The session body renders through the ROUTE (`/learn/hub/grammar/:id`).
    await waitFor(() => expect(screen.getByText("Structure")).toBeInTheDocument());
    expect(screen.getByText("Explanation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();

    // Focus chrome, derived from the detail archetype: recessed top bar + the
    // rail forced to icons (Browse's expandable Learn group is gone).
    expect(container.querySelector(".app-top-bar--recessed")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Chengyu/ })).not.toBeInTheDocument();

    // And it is NOT an overlay.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
