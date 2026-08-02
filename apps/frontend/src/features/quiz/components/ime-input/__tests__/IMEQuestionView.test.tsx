/**
 * @file IMEQuestionView.test.tsx
 * @description Integration tests for the IME question radical-hint fetch.
 * Story 21.18: IME Simulator Phonetic Hints — V19 refetch-loop regression.
 *
 * Guards against the V19 defect: for characters without radical data (e.g. 佘)
 * `getRadicalHint` resolves `null`, and the previous effect condition
 * `!radicalHintData && !radicalLoading` re-fired forever (39+ fetches in 3s),
 * pinning the UI on "Loading radical hint..." and hiding the penalty indicator.
 *
 * The fetch must run at most once per question and the UI must leave the
 * loading state.
 */
import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "src/mocks/server";
import { IMEQuestionView } from "../IMEQuestionView";
import { useQuizSessionStore } from "../../../stores/quizSessionStore";
import { createInitialSession } from "../../../types/session";
import type { QuizQuestion } from "../../../types";

function makeQuestion(glyph: string, meaning = "ancient surname"): QuizQuestion {
  return {
    id: `q-${glyph}`,
    audioKey: "she",
    correctPinyin: "she",
    correctTone: 4,
    category: "ime",
    displayPinyin: "shè",
    character: glyph,
    meaning,
  };
}

/** Seed the quiz session store with a single IME question and radical hint requested. */
function seedSession(question: QuizQuestion) {
  useQuizSessionStore.setState({
    strategyType: "ime-simulator",
    phase: "INPUT",
    questions: [question],
    currentIndex: 0,
    answers: [],
    score: 0,
    timer: 150,
    error: null,
    attemptId: null,
    completionResult: null,
    strategyConfig: null,
    hintsRemaining: 1,
    currentPhoneticHint: null,
    showRadicalHint: true,
    maxScorePenalty: 0.05,
    scoreByType: {},
  });
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  useQuizSessionStore.setState(createInitialSession("ime-simulator"));
});

afterAll(() => server.close());

describe("IMEQuestionView radical hint", () => {
  it("fetches exactly once for a character with no radical data and leaves the loading state", async () => {
    let requests = 0;

    server.use(
      // Full URL required — MSW does not resolve relative paths in the node test env.
      http.get("http://localhost:3001/api/v1/characters/:glyph", ({ params }) => {
        // The URL path segment is percent-encoded (e.g. %E4%BD%98); decode before comparing.
        const glyph = decodeURIComponent(String(params.glyph));
        if (glyph !== "佘") return HttpResponse.json({}, { status: 404 });
        requests += 1;
        // No radical data — getRadicalHint resolves to null
        return HttpResponse.json({ glyph: "佘", radical: null }, { status: 200 });
      }),
    );

    seedSession(makeQuestion("佘"));
    render(<IMEQuestionView />);

    // Leaves the loading state and shows the no-data message
    await waitFor(() => {
      expect(screen.getByText("No radical data available for this character.")).toBeInTheDocument();
    });
    expect(screen.queryByText("Loading radical hint...")).not.toBeInTheDocument();

    // The penalty indicator still renders because the hint WAS applied
    expect(screen.getByText("(-5% penalty applied)")).toBeInTheDocument();

    // Allow any (buggy) re-fetch a chance to fire, then assert exactly one fetch
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(requests).toBe(1);
  });

  it("renders the hint data and penalty indicator when radical data is available", async () => {
    server.use(
      http.get("http://localhost:3001/api/v1/characters/:glyph", ({ params }) => {
        const glyph = decodeURIComponent(String(params.glyph));
        if (glyph !== "女") return HttpResponse.json({}, { status: 404 });
        return HttpResponse.json(
          { glyph: "女", radical: { glyph: "女", meaning: "woman" } },
          { status: 200 },
        );
      }),
    );

    seedSession(makeQuestion("女", "woman"));
    render(<IMEQuestionView />);

    await waitFor(() => {
      // The hint paragraph nests the "Radical:" label inside a <strong>, so match
      // on the paragraph's full textContent rather than a single text node.
      expect(
        screen.getByText(
          (_content, element) =>
            element?.tagName === "P" &&
            element.textContent?.includes("Radical:") &&
            element.textContent?.includes("woman"),
        ),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("(-5% penalty applied)")).toBeInTheDocument();
    expect(screen.queryByText("Loading radical hint...")).not.toBeInTheDocument();
  });
});

describe("IMEQuestionView live candidates (VisFix W6a)", () => {
  /** Override the pinyin search endpoint with a deterministic candidate list. */
  function usePinyinSearchHandler(
    makeResults: (q: string) => Array<{
      glyph: string;
      pinyin: string;
      tone: number;
      meaning: string | null;
    }>,
  ) {
    server.use(
      http.get("http://localhost:3001/api/v1/pinyin/search", ({ request }) => {
        const q = new URL(request.url).searchParams.get("q") ?? "";
        const results = makeResults(q);
        return HttpResponse.json({
          query: q,
          totalResults: results.length,
          page: 1,
          pageSize: 30,
          results,
        });
      }),
    );
  }

  it("shows candidate chips while the user types pinyin (before submit)", async () => {
    usePinyinSearchHandler(() => [
      { glyph: "家", pinyin: "jiā", tone: 1, meaning: "home" },
      { glyph: "加", pinyin: "jiā", tone: 1, meaning: "to add" },
    ]);

    seedSession(makeQuestion("家", "home"));
    render(<IMEQuestionView />);

    const input = screen.getByPlaceholderText("Type character here...");
    fireEvent.change(input, { target: { value: "jia" } });

    // Candidates must appear while typing — debounce (500ms) then fetch.
    await waitFor(
      () => {
        expect(screen.getByLabelText("家 — jiā — home")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
    // Candidate chips use the shared Chip component (interactive buttons)
    const candidateChip = screen.getByLabelText("家 — jiā — home");
    expect(candidateChip).toHaveClass("chip");
    expect(candidateChip.tagName).toBe("BUTTON");
    expect(screen.getByLabelText("加 — jiā — to add")).toBeInTheDocument();
    // Post-submit feedback is not shown yet.
    expect(screen.queryByText(/Correct!/)).not.toBeInTheDocument();
  });

  it("selecting a candidate commits the glyph and Submit grades it", async () => {
    usePinyinSearchHandler(() => [{ glyph: "家", pinyin: "jiā", tone: 1, meaning: "home" }]);

    seedSession(makeQuestion("家", "home"));
    render(<IMEQuestionView />);

    const input = screen.getByPlaceholderText("Type character here...");
    fireEvent.change(input, { target: { value: "jia" } });

    await waitFor(
      () => {
        expect(screen.getByLabelText("家 — jiā — home")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Clicking the candidate sets the answer (the glyph) in the input.
    fireEvent.click(screen.getByLabelText("家 — jiā — home"));
    expect(input).toHaveValue("家");

    // Submit still grades the committed glyph (pinyin is not sent).
    const submitSpy = vi.spyOn(useQuizSessionStore.getState(), "submitAnswer").mockResolvedValue();
    try {
      fireEvent.click(screen.getByRole("button", { name: "Submit Answer" }));
      expect(submitSpy).toHaveBeenCalledWith("家", 0);
    } finally {
      submitSpy.mockRestore();
    }
  });

  it("renders a candidate with an empty meaning without crashing", async () => {
    usePinyinSearchHandler(() => [{ glyph: "蛇", pinyin: "shé", tone: 2, meaning: null }]);

    seedSession(makeQuestion("佘", "ancient surname"));
    render(<IMEQuestionView />);

    const input = screen.getByPlaceholderText("Type character here...");
    fireEvent.change(input, { target: { value: "she" } });

    await waitFor(
      () => {
        // A null-meaning candidate still renders (glyph + pinyin, no meaning line).
        expect(screen.getByLabelText("蛇 — shé")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("does not append the correct answer to an unrelated pinyin query", async () => {
    usePinyinSearchHandler((q) =>
      q === "jia"
        ? [{ glyph: "家", pinyin: "jiā", tone: 1, meaning: "home" }]
        : [{ glyph: "陆", pinyin: "lù", tone: 4, meaning: "land" }],
    );

    seedSession(makeQuestion("家", "home"));
    render(<IMEQuestionView />);

    const input = screen.getByPlaceholderText("Type character here...");
    fireEvent.change(input, { target: { value: "lu" } });

    await waitFor(
      () => {
        expect(screen.getByLabelText("陆 — lù — land")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
    // 家 (correct, pinyin jiā) must not be merged into a "lu" candidate list.
    expect(screen.queryByLabelText("家 — jiā")).not.toBeInTheDocument();
  });
});
