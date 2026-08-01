/**
 * @file components/tones/__tests__/SandhiDrill.integration.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) — component + MSW.
 *
 * Renders the real `SandhiDrill` component, clicks "Start Drill", and lets it
 * fetch questions through `sandhiDrillService` + `apiClient`, intercepted by
 * the MSW node server. Demonstrates loading → success against the real wiring.
 *
 * Story 21.17: Tone Sandhi Practice Quiz
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { SandhiDrill } from "../SandhiDrill";

const QUESTIONS_URL = "http://localhost:3001/api/v1/quiz/sandhi-drill/questions";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const SAMPLE_QUESTIONS = [
  {
    id: "q1",
    characters: "你好",
    dictionaryPinyin: "nǐ hǎo",
    correctAnswer: "ní hǎo",
    ruleId: "3-3-sandhi",
    options: ["ní hǎo", "nǐ hǎo", "nǐ háo", "nì hǎo"],
  },
  {
    id: "q2",
    characters: "很好",
    dictionaryPinyin: "hěn hǎo",
    correctAnswer: "hén hǎo",
    ruleId: "3-3-sandhi",
    options: ["hén hǎo", "hěn hǎo", "hěn háo", "hèn hǎo"],
  },
];

describe("SandhiDrill (integration + MSW)", () => {
  it("rules intro → Start Drill → loading → questions from the API", async () => {
    server.use(
      http.get(QUESTIONS_URL, () => {
        // sandhiDrillService returns response.data directly
        return HttpResponse.json(SAMPLE_QUESTIONS);
      }),
    );

    renderWithProviders(<SandhiDrill />);

    // Rules intro screen first
    expect(screen.getByRole("button", { name: "Start Drill" })).toBeInTheDocument();

    // Start the drill → fetches from the API
    fireEvent.click(screen.getByRole("button", { name: "Start Drill" }));

    // Loading state while the request is in flight
    expect(screen.getByText(/loading sandhi drill questions/i)).toBeInTheDocument();

    // First question rendered from the MSW-mocked API data
    await waitFor(() => expect(screen.getByText("你好")).toBeInTheDocument());
    // The correct-answer option is rendered as an answer button
    expect(screen.getByRole("button", { name: "ní hǎo" })).toBeInTheDocument();
  });

  it("shows an error state when the API fails", async () => {
    server.use(
      http.get(QUESTIONS_URL, () =>
        HttpResponse.json({ error: "Failed to generate sandhi drill questions" }, { status: 500 }),
      ),
    );

    renderWithProviders(<SandhiDrill />);

    fireEvent.click(screen.getByRole("button", { name: "Start Drill" }));

    await waitFor(() =>
      expect(screen.getByText(/failed to load sandhi drill questions/i)).toBeInTheDocument(),
    );
  });
});
