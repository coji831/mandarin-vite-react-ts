/**
 * @file SandhiDrill.stories.tsx
 * @description Storybook stories for SandhiDrill component (Story 21.17)
 *
 * Covers: rules intro, drill active, results (pass/fail), loading, error.
 * Uses MSW to mock the GET /v1/quiz/sandhi-drill/questions endpoint.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { SandhiDrill } from "../SandhiDrill";
import { quizHandlers } from "../../../../../mocks/handlers/quiz-handlers";

const meta: Meta<typeof SandhiDrill> = {
  title: "Features/Foundations/Tones/SandhiDrill",
  component: SandhiDrill,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof SandhiDrill>;

// ─── Helper: complete the full 10-question drill ───────────────────────

const CORRECT_ANSWERS = [
  "ní hǎo",
  "hén hǎo",
  "bú shì",
  "bú huì",
  "yí gè",
  "yí cì",
  "yì bān",
  "yì nián",
  "shuí guǒ",
  "yì qǐ",
];

/** Return a wrong option for the given question index (0-based). */
function getWrongAnswer(index: number): string {
  const sampleWrong: string[] = [
    "nǐ hǎo",
    "hěn hǎo",
    "bù shì",
    "bù huì",
    "yī gè",
    "yī cì",
    "yī bān",
    "yī nián",
    "shuǐ guǒ",
    "yī qǐ",
  ];
  return sampleWrong[index] ?? CORRECT_ANSWERS[0];
}

/**
 * Click "Start Drill", then answer all 10 questions according to the
 * `correct` boolean array (true = pick correct answer, false = pick wrong).
 * Waits for the 1200ms auto-advance between questions.
 */
async function completeDrill(
  canvas: ReturnType<typeof within>,
  correct: boolean[],
): Promise<void> {
  const startButton = await canvas.findByRole("button", { name: /start drill/i });
  await userEvent.click(startButton);

  for (let i = 0; i < 10; i++) {
    const answer = correct[i] ? CORRECT_ANSWERS[i] : getWrongAnswer(i);
    const btn = await canvas.findByRole("button", { name: answer });
    await userEvent.click(btn);

    if (i < 9) {
      // Wait for auto-advance to next question (1200ms delay in component)
      await expect(
        await canvas.findByText(`Question ${i + 2} of 10`, {}, { timeout: 3000 }),
      ).toBeInTheDocument();
    }
  }
}

// ─── Stories ────────────────────────────────────────────────────────────

/**
 * Rules intro state — shows 2×2 grid of rule explanation cards
 * with a "Start Drill" button. No API calls needed.
 */
export const RulesIntro: Story = {};

/**
 * Loading state — skeleton/loading indicator while fetching questions.
 * Uses a never-resolving promise handler to keep the component in loading.
 */
export const Loading: Story = {
  parameters: {
    msw: { handlers: [quizHandlers.loading.sandhiQuestions] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const startButton = await canvas.findByRole("button", { name: /start drill/i });
    await userEvent.click(startButton);
    await expect(canvas.getByText(/loading sandhi drill/i)).toBeInTheDocument();
  },
};

/**
 * Drill active state — shows progress bar, character, and 4 pinyin options.
 * Questions are loaded from the mocked API after clicking "Start Drill".
 */
export const DrillActive: Story = {
  parameters: {
    msw: { handlers: [quizHandlers.default.sandhiQuestions] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const startButton = await canvas.findByRole("button", { name: /start drill/i });
    await userEvent.click(startButton);
    await expect(
      await canvas.findByText(/question 1 of 10/i),
    ).toBeInTheDocument();
  },
};

/**
 * Results state with passing score (100% — all correct).
 * Plays through the full 10-question drill answering every question correctly.
 */
export const ResultsPass: Story = {
  parameters: {
    msw: { handlers: [quizHandlers.default.sandhiQuestions] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const allCorrect = Array(10).fill(true);
    await completeDrill(canvas, allCorrect);
    await expect(canvas.getByText("Drill Complete!")).toBeInTheDocument();
    await expect(canvas.getByText(/passed/i)).toBeInTheDocument();
  },
};

/**
 * Results state with failing score (50% — 5/10 correct).
 * Plays through the full 10-question drill with a mix of correct/wrong answers.
 */
export const ResultsFail: Story = {
  parameters: {
    msw: { handlers: [quizHandlers.default.sandhiQuestions] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 5 correct, 5 wrong = 50% (below 70% pass threshold)
    const correctPattern = [true, true, true, true, true, false, false, false, false, false];
    await completeDrill(canvas, correctPattern);
    await expect(canvas.getByText("Drill Complete!")).toBeInTheDocument();
    await expect(canvas.getByText(/needs review/i)).toBeInTheDocument();
  },
};

/**
 * Error state — shows ErrorScreen with retry button.
 * Uses MSW error handler that returns a 500 response.
 */
export const Error: Story = {
  parameters: {
    msw: { handlers: [quizHandlers.error.sandhiQuestions] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const startButton = await canvas.findByRole("button", { name: /start drill/i });
    await userEvent.click(startButton);
    await expect(
      await canvas.findByText(/failed to load drill/i),
    ).toBeInTheDocument();
  },
};
