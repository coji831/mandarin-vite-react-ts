/**
 * SentenceBuilderQuestion — the assembled answer and its per-add announcement
 * (§26.3.3).
 *
 * The answer channel is the existing two-argument
 * `submitAnswer(primary, tone)`: the placed tokens joined by a single ASCII
 * space, `selectedTone` = 0. Each add announces its position, because the answer
 * row grows without the focused chip moving.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SentenceBuilderQuestion } from "../SentenceBuilderQuestion";
import { useQuizSessionStore } from "../../../stores/quizSessionStore";
import { createInitialSession } from "../../../types";
import type { QuizQuestion } from "../../../types";

const SENTENCE: QuizQuestion = {
  id: "sbo-1",
  audioKey: "",
  correctPinyin: "我 打 人",
  correctTone: 0,
  category: "sentence-building",
  english: "I hit someone.",
  patternName: "simple sentence",
  tokens: ["人", "我", "打"],
  answerLength: 3,
};

function seed() {
  useQuizSessionStore.setState({
    ...createInitialSession("sentence-building"),
    phase: "INPUT",
    questions: [SENTENCE],
    currentIndex: 0,
  });
}

describe("SentenceBuilderQuestion", () => {
  beforeEach(() => {
    seed();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("announces each added token with its position", async () => {
    const user = userEvent.setup();
    render(<SentenceBuilderQuestion />);

    await user.click(screen.getByRole("button", { name: "我" }));
    expect(useQuizSessionStore.getState().announcement).toBe("Added 我, position 1 of 3.");

    await user.click(screen.getByRole("button", { name: "打" }));
    expect(useQuizSessionStore.getState().announcement).toBe("Added 打, position 2 of 3.");
  });

  it("submits the placed tokens joined by a single space", async () => {
    const user = userEvent.setup();
    const submitSpy = vi
      .spyOn(useQuizSessionStore.getState(), "submitAnswer")
      .mockResolvedValue(undefined);
    render(<SentenceBuilderQuestion />);

    await user.click(screen.getByRole("button", { name: "我" }));
    await user.click(screen.getByRole("button", { name: "打" }));
    await user.click(screen.getByRole("button", { name: "人" }));
    await user.click(screen.getByRole("button", { name: "Check" }));

    expect(submitSpy).toHaveBeenCalledWith("我 打 人", 0);
  });

  it("toggles a placed chip out of the answer and says so", async () => {
    const user = userEvent.setup();
    render(<SentenceBuilderQuestion />);

    await user.click(screen.getByRole("button", { name: "我" }));
    await user.click(screen.getByRole("button", { name: "我 (placed in your answer)" }));

    expect(useQuizSessionStore.getState().announcement).toBe("Removed 我.");
    expect(screen.getByText(/No words placed yet/i)).toBeInTheDocument();
  });
});
