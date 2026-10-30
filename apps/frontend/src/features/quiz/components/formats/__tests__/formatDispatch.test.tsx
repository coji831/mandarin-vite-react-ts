/**
 * Question dispatch (§26.3.1) — the map, not an if-chain.
 *
 * With four new formats, two of them single-select, the old
 * `MULTIPLE_CHOICE_STRATEGIES` if-chain would have silently routed a cloze
 * question through the pinyin `QuestionView` (audio + typed pinyin). These tests
 * pin the routing for all four, and pin that the pinyin surface is NOT what a
 * cloze session mounts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QuizRouter } from "../../QuizRouter";
import { QUESTION_VIEWS } from "../../questionViews";
import { useQuizSessionStore } from "../../../stores/quizSessionStore";
import { createInitialSession } from "../../../types";
import type { QuizQuestion, StrategyType } from "../../../types";

vi.mock("shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("shared/hooks")>();
  return {
    ...actual,
    useAudioItemPlayback: () => ({
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      status: "idle",
      isPlaying: false,
      isLoading: false,
      error: null,
    }),
  };
});

const CLOZE: QuizQuestion = {
  id: "cloze-1",
  audioKey: "",
  correctPinyin: "把",
  correctTone: 0,
  category: "cloze",
  chinese: "我把人打了。",
  english: "I hit someone.",
  patternName: "把-construction",
  blankIndex: 1,
  segments: [
    { text: "我", pinyin: "wǒ", blank: false },
    { text: "把", pinyin: "bǎ", blank: true },
    { text: "人打了。", pinyin: "rén dǎ le", blank: false },
  ],
  options: [
    { id: "opt-0", glyph: "把", meaning: "object marker" },
    { id: "opt-1", glyph: "被", meaning: "passive marker" },
    { id: "opt-2", glyph: "了", meaning: "completed" },
    { id: "opt-3", glyph: "的", meaning: "possessive" },
  ],
};

const SENTENCE: QuizQuestion = {
  id: "sbo-1",
  audioKey: "",
  correctPinyin: "我 打 人",
  correctTone: 0,
  category: "sentence-building",
  english: "I hit someone.",
  tokens: ["人", "我", "打"],
  answerLength: 3,
};

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

function seed(strategyType: StrategyType, question: QuizQuestion) {
  useQuizSessionStore.setState({
    ...createInitialSession(strategyType),
    phase: "INPUT",
    questions: [question],
    currentIndex: 0,
  });
}

function renderRouter() {
  return render(
    <MemoryRouter>
      <QuizRouter />
    </MemoryRouter>,
  );
}

const PINYIN_PROMPT = "Listen to the audio, then:";

describe("QUESTION_VIEWS dispatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("names a view for every strategy id in the union", () => {
    const union: StrategyType[] = [
      "audio-to-pinyin",
      "audio-to-tone",
      "audio-to-pinyin-tone",
      "ime-simulator",
      "radical-gate",
      "cloze",
      "sentence-building",
      "listening-dictation",
      "tone-judgment",
    ];
    for (const id of union) expect(QUESTION_VIEWS[id]).toBeDefined();
  });

  it("routes a cloze session to the cloze view, never the pinyin one", () => {
    seed("cloze", CLOZE);
    renderRouter();

    expect(screen.getByRole("heading", { name: "Fill the blank in the sentence" })).toBeVisible();
    expect(screen.queryByText(PINYIN_PROMPT)).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /把/ })).toBeInTheDocument();
  });

  it("routes sentence-building to the builder", () => {
    seed("sentence-building", SENTENCE);
    renderRouter();

    expect(screen.getByRole("heading", { name: "Build the sentence" })).toBeVisible();
    expect(screen.queryByText(PINYIN_PROMPT)).not.toBeInTheDocument();
  });

  it("routes listening-dictation to the dictation field", () => {
    seed("listening-dictation", DICTATION);
    renderRouter();

    expect(screen.getByRole("heading", { name: "Type what you hear" })).toBeVisible();
    expect(screen.queryByText(PINYIN_PROMPT)).not.toBeInTheDocument();
  });

  it("routes tone-judgment to the written tone surface", () => {
    seed("tone-judgment", TONE);
    renderRouter();

    expect(
      screen.getByRole("heading", { name: /What tone does 你 surface as here/ }),
    ).toBeVisible();
    expect(screen.queryByText(PINYIN_PROMPT)).not.toBeInTheDocument();
  });
});
