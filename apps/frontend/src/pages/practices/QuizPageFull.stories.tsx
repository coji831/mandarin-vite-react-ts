/**
 * QuizPageFull.stories.tsx
 * Storybook stories for QuizSessionPage — all visual states via Zustand store manipulation.
 *
 * Each story uses withQuizState to pre-populate the Zustand store with mock data,
 * then renders QuizSessionPage directly (bypassing the QuizPage router).
 */

import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "../../shared/layouts/AppLayout";
import { QuizSessionPage } from "./QuizSessionPage";
import { useQuizSessionStore, createInitialSession } from "../../features/quiz";
import type { QuizQuestion, AnswerResult, QuizSession } from "../../features/quiz";
import { withGuestAuth } from "../../../.storybook/decorators";

// ── Mock data ──────────────────────────────────────────────────────

const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    audioKey: "bā",
    correctPinyin: "ba",
    correctTone: 1,
    category: "pinyin",
    displayPinyin: "bā",
  },
  {
    id: "q2",
    audioKey: "pó",
    correctPinyin: "po",
    correctTone: 2,
    category: "tones",
    displayPinyin: "pó",
  },
  {
    id: "q3",
    audioKey: "mǎ",
    correctPinyin: "ma",
    correctTone: 3,
    category: "pairs",
    displayPinyin: "mǎ",
  },
  {
    id: "q4",
    audioKey: "dà",
    correctPinyin: "da",
    correctTone: 4,
    category: "rules",
    displayPinyin: "dà",
  },
  {
    id: "q5",
    audioKey: "tā",
    correctPinyin: "ta",
    correctTone: 1,
    category: "pinyin",
    displayPinyin: "tā",
  },
];

const TONE_DESCS: Record<number, string> = {
  1: "high level",
  2: "rising",
  3: "low dipping",
  4: "falling",
  0: "neutral",
};

function makeCorrectAnswer(question: QuizQuestion): AnswerResult {
  return {
    correct: true,
    userPinyin: question.correctPinyin,
    userTone: question.correctTone,
    correctPinyin: question.correctPinyin,
    correctTone: question.correctTone,
    feedback: "Correct!",
    toneDescription: TONE_DESCS[question.correctTone],
  };
}

// ── IME Simulator mock questions (Story 21.18) ────────────────────

const MOCK_IME_QUESTIONS: QuizQuestion[] = [
  {
    id: "ime-q1",
    audioKey: "hǎo",
    correctPinyin: "hao",
    correctTone: 3,
    category: "ime",
    displayPinyin: "hǎo",
    character: "好",
    meaning: "good",
  },
  {
    id: "ime-q2",
    audioKey: "nǐ",
    correctPinyin: "ni",
    correctTone: 3,
    category: "ime",
    displayPinyin: "nǐ",
    character: "你",
    meaning: "you",
  },
  {
    id: "ime-q3",
    audioKey: "mā",
    correctPinyin: "ma",
    correctTone: 1,
    category: "ime",
    displayPinyin: "mā",
    character: "妈",
    meaning: "mother",
  },
  {
    id: "ime-q4",
    audioKey: "míng",
    correctPinyin: "ming",
    correctTone: 2,
    category: "ime",
    displayPinyin: "míng",
    character: "明",
    meaning: "bright",
  },
  {
    id: "ime-q5",
    audioKey: "shuō",
    correctPinyin: "shuo",
    correctTone: 1,
    category: "ime",
    displayPinyin: "shuō",
    character: "说",
    meaning: "to speak",
  },
];

function makeCorrectIMEAnswer(question: QuizQuestion, classification: string): AnswerResult {
  return {
    correct: true,
    userPinyin: question.character ?? "",
    userTone: 0,
    correctPinyin: question.correctPinyin,
    correctTone: question.correctTone,
    feedback: `Correct! ${question.character}`,
    toneDescription: "",
    classification,
  };
}

function makeWrongIMEAnswer(question: QuizQuestion, classification: string): AnswerResult {
  return {
    correct: false,
    userPinyin: "X",
    userTone: 0,
    correctPinyin: question.correctPinyin,
    correctTone: question.correctTone,
    feedback: `Incorrect. The correct answer was: ${question.character}`,
    toneDescription: "",
    classification,
    phoneticHint: { glyph: "子", pinyin: "zǐ", meaning: "child" },
  };
}

function makeWrongAnswer(question: QuizQuestion): AnswerResult {
  const wrongTone = question.correctTone === 1 ? 3 : 1;
  return {
    correct: false,
    userPinyin: question.correctPinyin,
    userTone: wrongTone,
    correctPinyin: question.correctPinyin,
    correctTone: question.correctTone,
    feedback: `Incorrect. The audio was "${question.displayPinyin}" (${TONE_DESCS[question.correctTone]}).`,
    toneDescription: TONE_DESCS[question.correctTone],
  };
}

// ── Meta ───────────────────────────────────────────────────────────

const meta: Meta<typeof QuizSessionPage> = {
  title: "Pages/Practices/Quiz",
  component: QuizSessionPage,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof QuizSessionPage>;

// ── Decorators ─────────────────────────────────────────────────────

/**
 * withAppLayoutAt — wraps the story in AppLayout at the given path.
 * Needed because the global decorator's Route path doesn't handle query strings.
 */
const withAppLayoutAt = (initialPath: string): Decorator => {
  const pathname = initialPath.split("?")[0];
  return (Story) => (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={pathname} element={<Story />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

/**
 * withQuizState — pre-populates the Zustand quiz session store with desired state.
 *
 * Call this during render (before child effects) to set the store to a known state.
 * Overrides `initialize` with a no-op to prevent `useQuizEngine` from fetching real data.
 */
function withQuizState(overrides: Partial<QuizSession>): Decorator {
  return (Story) => {
    const initialState = createInitialSession("audio-to-pinyin-tone");
    useQuizSessionStore.setState({
      ...initialState,
      ...overrides,
      initialize: async () => {
        /* no-op — prevent useQuizEngine from re-initializing */
      },
    });
    return <Story />;
  };
}

// ── Stories ────────────────────────────────────────────────────────

/**
 * Loading — shows the LOADING phase with spinner + "Loading quiz..." text.
 */
export const Loading: Story = {
  args: { strategyType: "audio-to-pinyin-tone" },
  decorators: [
    withQuizState({
      phase: "LOADING",
      questions: [],
      currentIndex: 0,
      answers: [],
      score: 0,
      timer: 150,
    }),
    withAppLayoutAt("/practices/quiz"),
  ],
};

/**
 * Question — shows the INPUT phase with a question ready.
 */
export const Question: Story = {
  args: { strategyType: "audio-to-pinyin-tone" },
  decorators: [
    withQuizState({
      strategyType: "audio-to-pinyin-tone",
      phase: "INPUT",
      questions: MOCK_QUESTIONS,
      currentIndex: 0,
      answers: [],
      score: 0,
      timer: 150,
    }),
    withAppLayoutAt("/practices/quiz"),
  ],
};

/**
 * CorrectFeedback — shows the FEEDBACK phase with a correct answer.
 */
export const CorrectFeedback: Story = {
  args: { strategyType: "audio-to-pinyin-tone" },
  decorators: [
    withQuizState({
      strategyType: "audio-to-pinyin-tone",
      phase: "FEEDBACK",
      questions: MOCK_QUESTIONS,
      currentIndex: 2,
      answers: [
        makeCorrectAnswer(MOCK_QUESTIONS[0]),
        makeCorrectAnswer(MOCK_QUESTIONS[1]),
        makeCorrectAnswer(MOCK_QUESTIONS[2]),
      ],
      score: 3,
      timer: 120,
    }),
    withAppLayoutAt("/practices/quiz"),
  ],
};

/**
 * WrongFeedback — shows the FEEDBACK phase with a wrong answer.
 */
export const WrongFeedback: Story = {
  args: { strategyType: "audio-to-pinyin-tone" },
  decorators: [
    withQuizState({
      strategyType: "audio-to-pinyin-tone",
      phase: "FEEDBACK",
      questions: MOCK_QUESTIONS,
      currentIndex: 2,
      answers: [
        makeCorrectAnswer(MOCK_QUESTIONS[0]),
        makeCorrectAnswer(MOCK_QUESTIONS[1]),
        makeWrongAnswer(MOCK_QUESTIONS[2]),
      ],
      score: 2,
      timer: 120,
    }),
    withAppLayoutAt("/practices/quiz"),
  ],
};

/**
 * Results — shows the RESULTS phase with quiz completion screen.
 * Score 3/5 (60%) meets the passThreshold of 0.6 (60%).
 */
export const Results: Story = {
  args: { strategyType: "audio-to-pinyin-tone" },
  decorators: [
    withQuizState({
      strategyType: "audio-to-pinyin-tone",
      phase: "RESULTS",
      questions: MOCK_QUESTIONS,
      currentIndex: 4,
      answers: [
        makeCorrectAnswer(MOCK_QUESTIONS[0]),
        makeCorrectAnswer(MOCK_QUESTIONS[1]),
        makeWrongAnswer(MOCK_QUESTIONS[2]),
        makeCorrectAnswer(MOCK_QUESTIONS[3]),
        makeWrongAnswer(MOCK_QUESTIONS[4]),
      ],
      score: 3,
      timer: 90,
      strategyConfig: {
        type: "audio-to-pinyin-tone",
        questionCount: 5,
        passThreshold: 0.6,
        timeLimitMinutes: 2.5,
        tierRules: null,
      },
    }),
    withAppLayoutAt("/practices/quiz"),
  ],
};

/**
 * GuestResultsPassed — guest user passed the quiz.
 * Shows PhaseGateBadge with guest-specific messaging ("Register to save your progress")
 * and Register CTA button instead of "Continue to Phase N".
 */
export const GuestResultsPassed: Story = {
  args: { strategyType: "audio-to-pinyin-tone" },
  decorators: [
    withQuizState({
      strategyType: "audio-to-pinyin-tone",
      phase: "RESULTS",
      questions: MOCK_QUESTIONS,
      currentIndex: 4,
      answers: [
        makeCorrectAnswer(MOCK_QUESTIONS[0]),
        makeCorrectAnswer(MOCK_QUESTIONS[1]),
        makeCorrectAnswer(MOCK_QUESTIONS[2]),
        makeCorrectAnswer(MOCK_QUESTIONS[3]),
        makeCorrectAnswer(MOCK_QUESTIONS[4]),
      ],
      score: 5,
      timer: 90,
      strategyConfig: {
        type: "audio-to-pinyin-tone",
        questionCount: 5,
        passThreshold: 0.6,
        timeLimitMinutes: 2.5,
        tierRules: null,
      },
    }),
    withGuestAuth,
    withAppLayoutAt("/practices/quiz"),
  ],
};

/**
 * GuestResultsFailed — guest user failed the quiz.
 * Shows PhaseGateBadge with guest-specific messaging ("Register to track your scores")
 * and retry button with register prompt below.
 */
export const GuestResultsFailed: Story = {
  args: { strategyType: "audio-to-pinyin-tone" },
  decorators: [
    withQuizState({
      strategyType: "audio-to-pinyin-tone",
      phase: "RESULTS",
      questions: MOCK_QUESTIONS,
      currentIndex: 4,
      answers: [
        makeCorrectAnswer(MOCK_QUESTIONS[0]),
        makeWrongAnswer(MOCK_QUESTIONS[1]),
        makeWrongAnswer(MOCK_QUESTIONS[2]),
        makeCorrectAnswer(MOCK_QUESTIONS[3]),
        makeWrongAnswer(MOCK_QUESTIONS[4]),
      ],
      score: 2,
      timer: 90,
      strategyConfig: {
        type: "audio-to-pinyin-tone",
        questionCount: 5,
        passThreshold: 0.6,
        timeLimitMinutes: 2.5,
        tierRules: null,
      },
    }),
    withGuestAuth,
    withAppLayoutAt("/practices/quiz"),
  ],

  // ─────────────────────────────────────────────────────────────────
  // IME Simulator Stories (Story 21.18)
  // ─────────────────────────────────────────────────────────────────

  /**
   * IMEQuestion — IME Simulator INPUT phase with meaning clue and IME input.
   */
  IMEQuestion: {
    args: { strategyType: "ime-simulator" },
    decorators: [
      withQuizState({
        strategyType: "ime-simulator",
        phase: "INPUT",
        questions: MOCK_IME_QUESTIONS,
        currentIndex: 0,
        answers: [],
        score: 0,
        timer: 150,
        hintsRemaining: 3,
      }),
      withAppLayoutAt("/practices/quiz"),
    ],
  },

  /**
   * IMEHintDisplay — IME Simulator question with phonetic hint visible.
   */
  IMEHintDisplay: {
    args: { strategyType: "ime-simulator" },
    decorators: [
      withQuizState({
        strategyType: "ime-simulator",
        phase: "INPUT",
        questions: MOCK_IME_QUESTIONS,
        currentIndex: 1,
        answers: [],
        score: 0,
        timer: 130,
        hintsRemaining: 3,
        currentPhoneticHint: {
          data: { glyph: "子", pinyin: "zǐ", meaning: "child" },
          hasPhoneticComponent: true,
        },
      }),
      withAppLayoutAt("/practices/quiz"),
    ],
  },

  /**
   * IMEHintExhausted — IME Simulator question with 0 hints remaining.
   */
  IMEHintExhausted: {
    args: { strategyType: "ime-simulator" },
    decorators: [
      withQuizState({
        strategyType: "ime-simulator",
        phase: "INPUT",
        questions: MOCK_IME_QUESTIONS,
        currentIndex: 2,
        answers: [],
        score: 0,
        timer: 120,
        hintsRemaining: 0,
        currentPhoneticHint: {
          data: null,
          hasPhoneticComponent: false,
        },
      }),
      withAppLayoutAt("/practices/quiz"),
    ],
  },

  /**
   * IMEHintRadicalShown — IME Simulator question with radical hint toggled on.
   */
  IMEHintRadicalShown: {
    args: { strategyType: "ime-simulator" },
    decorators: [
      withQuizState({
        strategyType: "ime-simulator",
        phase: "INPUT",
        questions: MOCK_IME_QUESTIONS,
        currentIndex: 0,
        answers: [],
        score: 0,
        timer: 140,
        hintsRemaining: 2,
        showRadicalHint: true,
        maxScorePenalty: 0.05,
        currentPhoneticHint: {
          data: { glyph: "子", pinyin: "zǐ", meaning: "child" },
          hasPhoneticComponent: true,
        },
      }),
      withAppLayoutAt("/practices/quiz"),
    ],
  },

  /**
   * IMEResults — IME Simulator RESULTS phase with score-by-type breakdown.
   */
  IMEResults: {
    args: { strategyType: "ime-simulator" },
    decorators: [
      withQuizState({
        strategyType: "ime-simulator",
        phase: "RESULTS",
        questions: MOCK_IME_QUESTIONS,
        currentIndex: 4,
        answers: [
          makeCorrectIMEAnswer(MOCK_IME_QUESTIONS[0], "phono_semantic"),
          makeWrongIMEAnswer(MOCK_IME_QUESTIONS[1], "pictograph"),
          makeCorrectIMEAnswer(MOCK_IME_QUESTIONS[2], "phono_semantic"),
          makeCorrectIMEAnswer(MOCK_IME_QUESTIONS[3], "compound_ideograph"),
          makeWrongIMEAnswer(MOCK_IME_QUESTIONS[4], "ideograph"),
        ],
        score: 3,
        timer: 90,
        hintsRemaining: 1,
        strategyConfig: {
          type: "ime-simulator",
          questionCount: 5,
          passThreshold: 0.6,
          timeLimitMinutes: 2.5,
          tierRules: null,
        },
        scoreByType: {
          pictograph: { correct: 0, total: 1 },
          phono_semantic: { correct: 2, total: 2 },
          compound_ideograph: { correct: 1, total: 1 },
          ideograph: { correct: 0, total: 1 },
        },
      }),
      withAppLayoutAt("/practices/quiz"),
    ],
  },
};
