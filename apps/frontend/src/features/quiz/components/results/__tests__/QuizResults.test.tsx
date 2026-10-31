/**
 * QuizResults — the completion slot, the guest value rule, and the focus handoff.
 *
 * Epic 26 §26.2.2/§26.2.3 (one position-locked primary, identity decides it),
 * §26.4.5 (a guest's mock completion is `{totalScore: 0, maxScore: 0,
 * passed: false}` — the LOCAL session values must win), and §26.1 item 6
 * (the RESULTS mount takes focus, never an action button).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QuizResults } from "../QuizResults";
import { useQuizSessionStore } from "../../../stores/quizSessionStore";
import { quizService } from "../../../services/quizService";
import { createInitialSession } from "../../../types";
import type { AnswerResult, QuizQuestion } from "../../../types";

const authState = vi.hoisted(() => ({ isAuthenticated: false }));

vi.mock("features/auth", () => ({
  useAuth: () => ({ isAuthenticated: authState.isAuthenticated }),
}));

const PASS_THRESHOLD = 0.6;

/** Exactly what the server's OptionalAuthGuard stub returns for a guest attempt. */
const GUEST_STUB_RESULT = {
  totalScore: 0,
  maxScore: 0,
  passed: false,
  accuracy: 0,
  categoryBreakdown: { pinyin: 0, tones: 0, pairs: 0, rules: 0 },
};

const STRATEGY_CONFIG = {
  type: "audio-to-pinyin-tone",
  questionCount: 10,
  passThreshold: PASS_THRESHOLD,
  timeLimitMinutes: 2.5,
  tierRules: null,
};

const QUESTIONS: QuizQuestion[] = Array.from({ length: 10 }, (_, i) => ({
  id: `q${i + 1}`,
  audioKey: "bā",
  correctPinyin: "ba",
  correctTone: 1,
  category: "pinyin",
  displayPinyin: "bā",
}));

function makeAnswer(question: QuizQuestion, correct: boolean): AnswerResult {
  return {
    correct,
    userPinyin: correct ? question.correctPinyin : "bo",
    userTone: correct ? question.correctTone : 3,
    correctPinyin: question.correctPinyin,
    correctTone: question.correctTone,
    feedback: "",
    toneDescription: "high level",
  };
}

function seedResults(correctCount: number) {
  useQuizSessionStore.setState({
    ...createInitialSession("audio-to-pinyin-tone"),
    phase: "RESULTS",
    questions: QUESTIONS,
    answers: QUESTIONS.map((q, i) => makeAnswer(q, i < correctCount)),
    score: correctCount,
    timer: 42,
    strategyConfig: STRATEGY_CONFIG,
  });
}

function renderResults() {
  return render(
    <MemoryRouter>
      <QuizResults />
    </MemoryRouter>,
  );
}

describe("QuizResults — guest lane (Epic 26 §26.4.5)", () => {
  beforeEach(() => {
    authState.isAuthenticated = false;
    seedResults(9);
    useQuizSessionStore.setState({ attemptId: "guest-mock-attempt" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a guest's local score after a real completeAttempt, never the stub's 0/0", async () => {
    const completeSpy = vi
      .spyOn(quizService, "completeQuizAttempt")
      .mockResolvedValue(GUEST_STUB_RESULT);

    const result = await useQuizSessionStore.getState().completeAttempt();

    expect(completeSpy).toHaveBeenCalledWith("guest-mock-attempt");
    expect(result).toEqual(GUEST_STUB_RESULT);
    expect(useQuizSessionStore.getState().completionResult).toEqual(GUEST_STUB_RESULT);

    renderResults();

    // The local session wins: 9 of 10, 90 percent, passed at 0.6 — score card
    // plus both breakdown bars, and never the stub's 0/0 or its zeroed bars.
    expect(screen.getAllByText("9/10 (90%)")).toHaveLength(3);
    expect(screen.queryByText(/0\/0/)).not.toBeInTheDocument();
    expect(screen.queryByText("0/10 (0%)")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Passed" })).toBeInTheDocument();
  });

  it("gives the guest exactly one primary and one ghost, and claims nothing was saved", () => {
    renderResults();

    const primaries = Array.from(document.querySelectorAll(".btn-primary")).map((el) =>
      (el.textContent ?? "").trim(),
    );
    expect(primaries).toEqual(["Create an account to save your progress"]);
    expect(screen.getByRole("button", { name: "Back to Practices" }).className).toContain(
      "btn-ghost",
    );
    expect(screen.getByText(/not saved anywhere/i)).toBeInTheDocument();
  });
});

describe("QuizResults — registered identities (Epic 26 §26.2.3)", () => {
  beforeEach(() => {
    authState.isAuthenticated = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("puts one primary inside the slot, with the ghost passed into it as a node", () => {
    seedResults(7);
    renderResults();

    const slot = screen.getByRole("group", { name: "Next step" });
    const primaries = Array.from(slot.querySelectorAll(".btn-primary"));
    expect(primaries).toHaveLength(1);
    expect(primaries[0]).toHaveTextContent("Review what you missed");
    expect(slot.querySelectorAll(".btn-ghost")).toHaveLength(1);
    expect(screen.getByText(/3 of 10 answers were wrong/i)).toBeInTheDocument();
  });

  it("offers only the way out on a perfect score", () => {
    seedResults(10);
    renderResults();

    const slot = screen.getByRole("group", { name: "Next step" });
    expect(slot.querySelectorAll("button")).toHaveLength(1);
    expect(slot.querySelector(".btn-primary")).toHaveTextContent("Back to Practices");
    expect(slot.querySelector(".btn-ghost")).toBeNull();
  });

  it("moves focus to the results heading, and the first Tab reaches the slot's primary", async () => {
    const user = userEvent.setup();
    seedResults(7);
    renderResults();

    expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();

    await user.tab();

    expect(screen.getByRole("button", { name: "Review what you missed" })).toHaveFocus();
  });
});
