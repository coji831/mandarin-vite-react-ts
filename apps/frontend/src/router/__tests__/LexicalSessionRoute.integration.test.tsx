/**
 * @file __tests__/LexicalSessionRoute.integration.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) for the
 * lexical hub PEEK. Renders the REAL router + AppLayout + GrammarPage with
 * MSW-mocked APIs, clicks a grammar pattern, and proves the rework's promise
 * (rework-proposal §0): the hub opens as a cross-page sheet OVER the page, the
 * URL does not change, and the chrome does not flip to Focus.
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

describe("lexical hub as a peek", () => {
  it("opens a grammar pattern as a sheet over the page — URL unchanged, chrome untouched", async () => {
    server.use(
      ...grammarHandlers.default(),
      http.get(PHASE_GATE_URL, () => HttpResponse.json(phaseGateBody(4))),
    );

    const { container } = renderWithProviders(<MainRoutes />, { route: "/learn/grammar" });

    // Browse surface first: the grammar list renders cards.
    const card = await screen.findByRole("button", {
      name: /把 \(bǎ\) disposal construction/,
    });
    const urlBefore = window.location.pathname;

    fireEvent.click(card);

    // The entity body renders inside the SHEET.
    const sheet = await screen.findByRole("dialog");
    expect(sheet).toHaveAttribute("data-modal", "false");
    await waitFor(() => expect(screen.getByText("Structure")).toBeInTheDocument());
    expect(screen.getByText("Explanation")).toBeInTheDocument();

    // It is a peek, not a location: the URL never becomes `/learn/hub/...`.
    expect(window.location.pathname).toBe(urlBefore);
    expect(window.location.pathname).not.toContain("/learn/hub");

    // Chrome does NOT flip: Browse keeps its standard top bar and the origin
    // list is still mounted behind the sheet (nothing was dismantled).
    expect(container.querySelector(".app-top-bar--recessed")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Chengyu/ })).toBeInTheDocument();
  });
});
