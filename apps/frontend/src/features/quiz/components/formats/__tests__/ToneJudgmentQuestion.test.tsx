/**
 * ToneJudgmentQuestion — the distinction from `audio-to-tone` (§26.3.5).
 *
 * `audio-to-tone` is perception from audio. This format has NO audio at all: the
 * learner reads a written, tone-marked phrase and states the SURFACE tone of one
 * syllable, so a learner who hears perfectly can still fail it. The absence of
 * any audio primitive is the format, so it is asserted rather than assumed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToneJudgmentQuestion } from "../ToneJudgmentQuestion";
import { useQuizSessionStore } from "../../../stores/quizSessionStore";
import { createInitialSession } from "../../../types";
import type { QuizQuestion } from "../../../types";

const TONE: QuizQuestion = {
  id: "tsj-1",
  audioKey: "",
  correctPinyin: "nǐ",
  correctTone: 2,
  category: "tone-judgment",
  chinese: "你好",
  dictionaryPinyin: "nǐ hǎo",
  targetIndex: 0,
  targetGlyph: "你",
  targetSyllable: "nǐ",
  baseTone: 3,
  ruleId: "rule-3rd-sandhi",
  ruleTitle: "Third-tone sandhi",
};

function seed() {
  useQuizSessionStore.setState({
    ...createInitialSession("tone-judgment"),
    phase: "INPUT",
    questions: [TONE],
    currentIndex: 0,
  });
}

describe("ToneJudgmentQuestion", () => {
  beforeEach(() => {
    seed();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the written phrase with no audio player — the format is not audio-to-tone", () => {
    render(<ToneJudgmentQuestion />);

    expect(
      screen.getByRole("heading", { name: "What tone does 你 surface as here?" }),
    ).toBeInTheDocument();
    // The written stimulus and its dictionary tones are the prompt.
    expect(screen.getByText("nǐ")).toBeInTheDocument();
    expect(screen.getByText("hǎo")).toBeInTheDocument();
    expect(screen.getAllByText("base third tone")).toHaveLength(2);
    expect(screen.getByText("Third-tone sandhi")).toBeInTheDocument();

    // No audio affordance of any kind: no Play/Replay control, no media element.
    expect(screen.queryByRole("button", { name: /play|replay/i })).not.toBeInTheDocument();
    expect(document.querySelector("audio")).toBeNull();
  });

  it("commits the judged syllable and the chosen tone through submitAnswer", async () => {
    const user = userEvent.setup();
    const submitSpy = vi
      .spyOn(useQuizSessionStore.getState(), "submitAnswer")
      .mockResolvedValue(undefined);
    render(<ToneJudgmentQuestion />);

    await user.click(screen.getByRole("radio", { name: "Second tone (2)" }));
    // Selecting must NOT grade: a keyboard learner arrowing through the group
    // cannot be thrown into feedback before choosing (WCAG 3.2.2).
    expect(submitSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Check" }));

    expect(submitSpy).toHaveBeenCalledWith("nǐ", 2);
  });
});
