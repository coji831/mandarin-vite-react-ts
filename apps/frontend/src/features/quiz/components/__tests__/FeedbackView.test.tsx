/**
 * FeedbackView — §7 close-out contract
 *
 * The feedback card is the moment the learner reads their mistake, so it states
 * the verdict ONCE, marks it with the shared `Icon` (not emoji), and offers
 * exactly ONE primary — `Next Question` is the way on, `Play Again` the ghost.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeedbackView } from "../FeedbackView";
import { useQuizSessionStore } from "../../stores/quizSessionStore";
import type { AnswerResult, QuizQuestion } from "../../types";

vi.mock("../../../auth", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

const QUESTION: QuizQuestion = {
  id: "q1",
  audioKey: "bā",
  correctPinyin: "ba",
  correctTone: 1,
  category: "pinyin",
  displayPinyin: "bā",
  character: "八",
  meaning: "eight",
};

const WRONG_ANSWER: AnswerResult = {
  correct: false,
  userPinyin: "du",
  userTone: 1,
  correctPinyin: "ba",
  correctTone: 1,
  feedback: "",
  toneDescription: "high level",
};

const RIGHT_ANSWER: AnswerResult = { ...WRONG_ANSWER, correct: true, correctPinyin: "ba" };

function seed(answer: AnswerResult) {
  useQuizSessionStore.setState({
    questions: [QUESTION],
    answers: [answer],
    currentIndex: 0,
    strategyType: "audio-to-pinyin-tone",
  });
}

describe("FeedbackView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("states an incorrect verdict exactly once", () => {
    seed(WRONG_ANSWER);
    render(<FeedbackView />);

    expect(screen.getAllByText(/incorrect/i)).toHaveLength(1);
    expect(screen.getByText("Incorrect")).toBeInTheDocument();
    // The explanation states the fact, not the verdict again.
    expect(screen.getByText(/The audio was/i)).toBeInTheDocument();
  });

  it("offers exactly ONE primary action (Next Question)", () => {
    seed(WRONG_ANSWER);
    const { container } = render(<FeedbackView />);

    const primaries = Array.from(container.querySelectorAll(".btn-primary")).map((el) =>
      (el.textContent ?? "").trim(),
    );
    expect(primaries).toHaveLength(1);
    expect(primaries[0]).toContain("Next Question");
    expect(screen.getByRole("button", { name: /Play Again/i }).className).not.toContain(
      "btn-primary",
    );
  });

  it("keeps no emoji in the verdict", () => {
    seed(RIGHT_ANSWER);
    const { container } = render(<FeedbackView />);

    expect(container.textContent).not.toMatch(/✅|❌/);
    expect(screen.getByText("Correct")).toBeInTheDocument();
  });
});
