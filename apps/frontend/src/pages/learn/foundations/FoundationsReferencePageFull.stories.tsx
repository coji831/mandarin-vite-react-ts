import type { Meta, StoryObj } from "@storybook/react-vite";
import { FoundationsReferencePage } from "./FoundationsReferencePage";
import { mswHandlers } from "../../../../.storybook/msw-handlers";
import { quizHandlers } from "../../../mocks/handlers/quiz-handlers";

/**
 * FoundationsReferencePage — the dense reference index (`?tab=` driven).
 * One story per tab so every reference surface is reachable, plus the API
 * loading/error states the foundations data hooks can actually produce.
 *
 * NOTE: there is no "locked" story any more (§1) — no tab has a lock, so a
 * `disabled` Pictographs state is not reachable.
 */
const meta: Meta<typeof FoundationsReferencePage> = {
  title: "Pages/Learn/Foundations/Reference",
  component: FoundationsReferencePage,
  parameters: {
    layout: "fullscreen",
    layoutType: "learn",
    layoutPath: "/learn/foundations/reference",
  },
};

export default meta;
type Story = StoryObj<typeof FoundationsReferencePage>;

export const Pinyin: Story = {
  args: { initialTab: "pinyin" },
  parameters: {
    msw: { handlers: [...mswHandlers.foundations.default(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const Tones: Story = {
  args: { initialTab: "tones" },
  parameters: {
    msw: {
      handlers: [
        ...mswHandlers.foundations.default(),
        mswHandlers.progression.phaseGate(2),
        quizHandlers.default.sandhiQuestions,
        quizHandlers.default.createAttempt,
      ],
    },
  },
};

export const Strokes: Story = {
  args: { initialTab: "strokes" },
  parameters: {
    msw: { handlers: [...mswHandlers.foundations.default(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const Animations: Story = {
  args: { initialTab: "animations" },
  parameters: {
    msw: { handlers: [...mswHandlers.foundations.default(), mswHandlers.progression.phaseGate(2)] },
  },
};

/** The tab that used to be locked — it now opens like every other one. */
export const Pictographs: Story = {
  args: { initialTab: "pictographs" as const },
  parameters: {
    msw: { handlers: [...mswHandlers.foundations.default(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const TonesDeepLink: Story = {
  name: "Tones — deep-linked (?tab=tones)",
  parameters: {
    layoutPath: "/learn/foundations/reference?tab=tones",
    msw: {
      handlers: [
        ...mswHandlers.foundations.default(),
        mswHandlers.progression.phaseGate(2),
        quizHandlers.default.sandhiQuestions,
        quizHandlers.default.createAttempt,
      ],
    },
  },
};

export const Loading: Story = {
  args: { initialTab: "pinyin" },
  parameters: {
    msw: {
      handlers: [...mswHandlers.foundations.loading(), mswHandlers.progression.phaseGate(2)],
    },
  },
};

export const Error: Story = {
  args: { initialTab: "pinyin" },
  parameters: {
    msw: {
      handlers: [...mswHandlers.foundations.error(), mswHandlers.progression.phaseGate(2)],
    },
  },
};
