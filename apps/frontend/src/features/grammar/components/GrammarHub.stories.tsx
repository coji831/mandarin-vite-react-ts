/**
 * @file components/GrammarHub.stories.tsx
 * @description Storybook stories for GrammarHub — grammar pattern detail panel
 * rendered inside the shared LexicalHub dialog.
 * Story 22.3: Grammar UI
 *
 * Self-fetches via `useGrammarDetail` against the 22.2-owned `grammarHandlers`
 * (MSW). Covers: populated, loading, error.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { GrammarHub } from "./GrammarHub";
import { grammarHandlers } from "../../../mocks/handlers/grammar-handlers";

const meta = {
  title: "Features/Grammar/GrammarHub",
  component: GrammarHub,
  parameters: { layout: "centered" },
} satisfies Meta<typeof GrammarHub>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { entityId: "gr_0018" },
  parameters: { msw: { handlers: [grammarHandlers.default()] } },
};

export const Loading: Story = {
  args: { entityId: "gr_0018" },
  parameters: { msw: { handlers: [grammarHandlers.loading()] } },
};

export const Error: Story = {
  args: { entityId: "gr_0018" },
  parameters: { msw: { handlers: [grammarHandlers.error()] } },
};
