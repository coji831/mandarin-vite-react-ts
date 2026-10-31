/**
 * DictationQuestion — the replay lock and the IME guard (§26.3.4).
 *
 * Two rules that are easy to lose with a typed answer:
 *  - the replay control is `aria-disabled` while audio is playing, never
 *    `disabled` (the control that was just activated keeps focus);
 *  - Enter must not submit while an IME composition is in flight — a Mandarin
 *    learner typing pinyin would otherwise commit a half-composed string.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DictationQuestion } from "../DictationQuestion";
import { useQuizSessionStore } from "../../../stores/quizSessionStore";
import { createInitialSession } from "../../../types";
import type { QuizQuestion } from "../../../types";

const audioState = vi.hoisted(() => ({
  isPlaying: false,
  isLoading: false,
  error: null as string | null,
}));
const playSpy = vi.hoisted(() => vi.fn());

vi.mock("shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("shared/hooks")>();
  return {
    ...actual,
    useAudioItemPlayback: () => ({
      play: playSpy,
      pause: vi.fn(),
      stop: vi.fn(),
      status: audioState.isPlaying ? "playing" : "idle",
      isPlaying: audioState.isPlaying,
      isLoading: audioState.isLoading,
      error: audioState.error,
    }),
  };
});

const DICTATION: QuizQuestion = {
  id: "dct-1",
  audioKey: "你好",
  character: "你好",
  correctPinyin: "nǐ hǎo",
  correctTone: 0,
  category: "dictation",
  displayPinyin: "nǐ hǎo",
  meaning: "hello",
};

function seed() {
  useQuizSessionStore.setState({
    ...createInitialSession("listening-dictation"),
    phase: "INPUT",
    questions: [DICTATION],
    currentIndex: 0,
  });
}

describe("DictationQuestion", () => {
  beforeEach(() => {
    audioState.isPlaying = false;
    audioState.isLoading = false;
    audioState.error = null;
    playSpy.mockClear();
    seed();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("never shows the answer glyph — the prompt is the audio alone", () => {
    render(<DictationQuestion />);

    // `promptGlyph: "hide"` is the contract: the glyph is the answer, so it must
    // not be on screen before the learner types it.
    expect(screen.queryByText("你好")).not.toBeInTheDocument();
    expect(screen.queryByText("nǐ hǎo")).not.toBeInTheDocument();
  });

  it("keeps the replay control focusable while playing (aria-disabled, never disabled)", () => {
    audioState.isPlaying = true;
    render(<DictationQuestion />);

    const replay = screen.getByRole("button", { name: /playing/i });
    expect(replay).toHaveAttribute("aria-disabled", "true");
    expect(replay).not.toBeDisabled();

    // Pressing it while playing is a no-op — the early return, not the attribute.
    fireEvent.click(replay);
    expect(playSpy).not.toHaveBeenCalled();
  });

  it("plays the glyph on demand and counts the replays", async () => {
    const user = userEvent.setup();
    render(<DictationQuestion />);

    await user.click(screen.getByRole("button", { name: "Play" }));

    expect(playSpy).toHaveBeenCalledWith("你好");
    expect(screen.getByRole("button", { name: "Replay (1)" })).toBeInTheDocument();
  });

  it("does not submit on Enter while an IME composition is in flight", () => {
    const submitSpy = vi
      .spyOn(useQuizSessionStore.getState(), "submitAnswer")
      .mockResolvedValue(undefined);
    render(<DictationQuestion />);

    const field = screen.getByLabelText("Your transcription");
    fireEvent.change(field, { target: { value: "ni hao" } });

    fireEvent.keyDown(field, { key: "Enter", isComposing: true });
    expect(submitSpy).not.toHaveBeenCalled();

    fireEvent.keyDown(field, { key: "Enter", keyCode: 229 });
    expect(submitSpy).not.toHaveBeenCalled();

    fireEvent.keyDown(field, { key: "Enter" });
    expect(submitSpy).toHaveBeenCalledWith("ni hao", 0);
  });
});
