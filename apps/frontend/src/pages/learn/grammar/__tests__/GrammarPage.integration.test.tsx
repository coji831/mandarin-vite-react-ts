/**
 * @file pages/learn/grammar/__tests__/GrammarPage.integration.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) — page-level
 * render with MSW-mocked API data.
 * Story 22.3: Grammar UI
 *
 * Renders the REAL GrammarPage and lets it fetch grammar patterns + the phase
 * gate through the real services + `apiClient`, intercepted by the MSW node
 * server. Covers search / HSK / phase filtering, locked-card rendering for
 * higher-phase patterns, and loading / empty / error+retry states.
 */
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server, grammarHandlers } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { GrammarPage } from "../GrammarPage";
import { grammarService } from "features/grammar";

const GRAMMAR_URL = "http://localhost:3001/api/v1/grammar/patterns";
const PHASE_GATE_URL = "http://localhost:3001/api/v1/progression/phase-gate";

const SEARCH_LABEL = "Search grammar by keyword or pattern name...";

/** Phase-gate body — guests are Phase 1 (calibrated, Story 24-7); tests pin a specific phase. */
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

/** Pin the phase gate to the given phase for every request. */
function usePhaseGate(currentPhase: number) {
  server.use(http.get(PHASE_GATE_URL, () => HttpResponse.json(phaseGateBody(currentPhase))));
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  grammarService.clearCache();
});
afterAll(() => server.close());

describe("GrammarPage (integration + MSW)", () => {
  it("renders patterns fetched from the API (loading → grid)", async () => {
    server.use(...grammarHandlers.default());
    usePhaseGate(2);

    renderWithProviders(<GrammarPage />, { route: "/learn/grammar" });

    // Loading skeleton first
    expect(screen.getByLabelText("Loading grammar patterns")).toBeInTheDocument();

    // Grid populated from the MSW-mocked API data
    await waitFor(() => expect(screen.getByText("吗 yes/no questions")).toBeInTheDocument());
    expect(screen.getByText("把 (bǎ) disposal construction")).toBeInTheDocument();
    expect(screen.getByText("被 (bèi) passive construction")).toBeInTheDocument();
  });

  it("filters by HSK level when an HSK chip is clicked", async () => {
    server.use(...grammarHandlers.default());
    usePhaseGate(2);

    renderWithProviders(<GrammarPage />, { route: "/learn/grammar" });
    await waitFor(() => expect(screen.getByText("吗 yes/no questions")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "HSK 4" }));

    // Only Phase-4 / HSK-4 patterns remain (fetch refires on filter change)
    await waitFor(() =>
      expect(screen.getByText("把 (bǎ) disposal construction")).toBeInTheDocument(),
    );
    expect(screen.getByText("被 (bèi) passive construction")).toBeInTheDocument();
    expect(screen.queryByText("吗 yes/no questions")).not.toBeInTheDocument();
  });

  it("filters by phase when a phase chip is clicked", async () => {
    server.use(...grammarHandlers.default());
    usePhaseGate(2);

    renderWithProviders(<GrammarPage />, { route: "/learn/grammar" });
    await waitFor(() => expect(screen.getByText("吗 yes/no questions")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Phase 4" }));

    await waitFor(() =>
      expect(screen.getByText("把 (bǎ) disposal construction")).toBeInTheDocument(),
    );
    expect(screen.getByText("被 (bèi) passive construction")).toBeInTheDocument();
    expect(screen.queryByText("吗 yes/no questions")).not.toBeInTheDocument();
  });

  it("filters by search query (debounced) when text is typed", async () => {
    // The default MSW handler does not filter by search — provide a search-aware handler.
    server.use(
      http.get(GRAMMAR_URL, ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get("search") ?? "";
        const items = [
          {
            id: "gr_0005",
            name: "吗 yes/no questions",
            structure: "Statement + 吗？",
            phase: 2,
            hskLevel: 1,
            sortOrder: 5,
            exampleCount: 3,
            previewExample: "你好吗？",
          },
          {
            id: "gr_0018",
            name: "把 (bǎ) disposal construction",
            structure: "Subject + 把 + Object + Verb + Complement",
            phase: 4,
            hskLevel: 4,
            sortOrder: 18,
            exampleCount: 3,
            previewExample: "我把书放在桌子上。",
          },
        ].filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
        return HttpResponse.json(
          { items, total: items.length, page: 1, pageSize: 20 },
          { status: 200 },
        );
      }),
    );
    usePhaseGate(2);

    renderWithProviders(<GrammarPage />, { route: "/learn/grammar" });
    await waitFor(() => expect(screen.getByText("吗 yes/no questions")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(SEARCH_LABEL), { target: { value: "把" } });

    // Debounce (500ms) → refetch with ?search=把 → 吗 no longer matches. Waiting
    // for it to DISAPPEAR is what proves the debounced refetch completed (the
    // 把 card is present from the initial unfiltered load already).
    await waitFor(() => expect(screen.queryByText("吗 yes/no questions")).not.toBeInTheDocument(), {
      timeout: 2000,
    });
    expect(screen.getByText("把 (bǎ) disposal construction")).toBeInTheDocument();
  });

  it("renders locked/preview cards for patterns above the learner's phase", async () => {
    server.use(...grammarHandlers.default());
    usePhaseGate(2);

    renderWithProviders(<GrammarPage />, { route: "/learn/grammar" });

    await waitFor(() => expect(screen.getByText("吗 yes/no questions")).toBeInTheDocument());

    // gr_0005 (Phase 2) → unlocked; gr_0018 / gr_0019 (Phase 4) → locked for a Phase-2 learner
    expect(screen.getByText("吗 yes/no questions")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Locked until Phase 4")).toHaveLength(2);
  });

  it("renders the empty state when no patterns match", async () => {
    server.use(...grammarHandlers.empty());
    usePhaseGate(2);

    renderWithProviders(<GrammarPage />, { route: "/learn/grammar" });

    await waitFor(() => expect(screen.getByText("No grammar patterns found")).toBeInTheDocument());
  });

  it("renders the error state with a working retry", async () => {
    server.use(...grammarHandlers.error());
    usePhaseGate(2);

    renderWithProviders(<GrammarPage />, { route: "/learn/grammar" });

    // ErrorScreen renders the title (heading) + the message — query the heading.
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Failed to load grammar patterns" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Try Again")).toBeInTheDocument();

    // Retry after switching to the populated handlers → data loads
    server.use(...grammarHandlers.default());
    fireEvent.click(screen.getByText("Try Again"));

    await waitFor(() => expect(screen.getByText("吗 yes/no questions")).toBeInTheDocument());
  });
});
