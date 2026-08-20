/**
 * FoundationsPage stories.
 *
 * NOTE (State Parity): FoundationsPage is the de-facto Learn home. It renders
 * tab panels (Pinyin/Tones/Strokes/Animations/Pictographs) via `useFoundationsProgress`
 * + the foundations data hooks, so Loading and Error are reachable API states;
 * the Tones edge story deep-links `?tab=tones` (URL wins over `initialTab`)
 * and exercises the sandhi quiz path. Empty is not a declared state — the
 * foundations data hooks have no dedicated empty handler (an empty backend
 * falls through to the populated shell), matching the hub-launcher contract
 * for this page.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FoundationsPage } from "./FoundationsPage";
import { mswHandlers } from "../../../../.storybook/msw-handlers";
import { quizHandlers } from "../../../mocks/handlers/quiz-handlers";

const meta: Meta<typeof FoundationsPage> = {
  title: "Pages/Learn/Foundations/Full",
  component: FoundationsPage,
  tags: ["pages-hub-launcher"],
  parameters: {
    layout: "fullscreen",
    layoutType: "learn",
    layoutPath: "/learn/foundations",
  },
};

export default meta;
type Story = StoryObj<typeof FoundationsPage>;

export const Loading: Story = {
  parameters: {
    msw: { handlers: [...mswHandlers.foundations.loading(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const Default: Story = {
  name: "Default (Pinyin)",
  parameters: {
    msw: {
      handlers: [...mswHandlers.foundations.default(), mswHandlers.progression.phaseGate(2)],
    },
  },
};

export const Error: Story = {
  parameters: {
    msw: { handlers: [...mswHandlers.foundations.error(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const Edge: Story = {
  name: "Edge (Tones deep-link)",
  parameters: {
    layoutPath: "/learn/foundations?tab=tones",
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
