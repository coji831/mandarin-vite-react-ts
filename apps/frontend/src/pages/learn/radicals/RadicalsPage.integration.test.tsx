/**
 * @file pages/learn/radicals/RadicalsPage.integration.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) — page-level
 * render with MSW-mocked API data.
 *
 * Unlike `RadicalsPage.test.tsx` (which mocks the service + phase-gate hook),
 * this test renders the real page and lets it fetch radicals + phase gate
 * through the real services + `apiClient`, intercepted by the MSW node server.
 *
 * Story 19.1: Radicals Browser Structure
 */
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { RadicalsPage } from "./RadicalsPage";

const RADICALS_URL = "http://localhost:3001/api/v1/radicals";
const PHASE_GATE_URL = "http://localhost:3001/api/v1/progression/phase-gate";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const SAMPLE_RADICALS = [
  {
    id: "rad_0001",
    glyph: "一",
    alternate_glyphs: [],
    name_pinyin: "yī",
    name_chinese: "一",
    meaning: "one",
    stroke_count: 1,
    is_recommended: true,
    kangxi_index: 1,
    metadata: {},
  },
  {
    id: "rad_0030",
    glyph: "口",
    alternate_glyphs: [],
    name_pinyin: "kǒu",
    name_chinese: "口",
    meaning: "mouth",
    stroke_count: 3,
    is_recommended: true,
    kangxi_index: 30,
    metadata: {},
  },
];

const PHASE_THREE_GATE = {
  id: "pg-1",
  currentPhase: 3,
  phase1Passed: true,
  phase2Passed: true,
  phase3Passed: false,
  phase4Unlocked: false,
  qualificationScore: 90,
  placedPhase: null,
  phase1Retention: 92,
  phase2Retention: 88,
  phase3Retention: null,
  gateCriteria: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("RadicalsPage (integration + MSW)", () => {
  it("renders radicals fetched from the API (loading → grid)", async () => {
    server.use(
      http.get(RADICALS_URL, () => HttpResponse.json(SAMPLE_RADICALS)),
      http.get(PHASE_GATE_URL, () => HttpResponse.json(PHASE_THREE_GATE)),
    );

    renderWithProviders(<RadicalsPage />, { route: "/learn/radicals" });

    // Loading state first
    expect(screen.getByText(/loading radicals/i)).toBeInTheDocument();

    // Grid populated from the MSW-mocked API data
    await waitFor(() => expect(screen.getByText("一")).toBeInTheDocument());
    expect(screen.getByText("口")).toBeInTheDocument();
  });
});
