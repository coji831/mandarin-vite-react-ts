/**
 * @file pages/learn/grammar/GrammarPageFull.stories.tsx
 * @description Page-level Storybook stories for the Grammar pattern library.
 * Story 22.3: Grammar UI
 *
 * Covers: populated, loading, empty, error. Uses the 22.2-owned `grammarHandlers`
 * (MSW) directly — `msw: { handlers: [grammarHandlers.default()] }` (pattern:
 * PhoneticClustersPage.stories.tsx) — plus the shared phase-gate handler at
 * currentPhase 2 so Phase-3/4 cards render as locked/preview.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { GrammarPage } from "./GrammarPage";
import { grammarHandlers } from "../../../mocks/handlers/grammar-handlers";
import { mswHandlers } from "../../../../.storybook/msw-handlers";
import { withAppLayout, withLearnLayout } from "../../../../.storybook/decorators";

const meta = {
  title: "Pages/Learn/GrammarPage",
  component: GrammarPage,
  tags: ["pages-browse-index"],
  decorators: [withAppLayout("/learn/grammar"), withLearnLayout()],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GrammarPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  parameters: {
    msw: { handlers: [grammarHandlers.default(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const Loading: Story = {
  parameters: {
    msw: { handlers: [grammarHandlers.loading(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const Empty: Story = {
  parameters: {
    msw: { handlers: [grammarHandlers.empty(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const Error: Story = {
  parameters: {
    msw: { handlers: [grammarHandlers.error(), mswHandlers.progression.phaseGate(2)] },
  },
};
