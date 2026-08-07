/**
 * @file pages/learn/chengyu/ChengyuPageFull.stories.tsx
 * @description Page-level Storybook stories for the Chengyu idiom library.
 * Story 23.3: Chengyu UI
 *
 * Covers: populated, loading, empty, error. Uses the 23.2-owned `chengyuHandlers`
 * (MSW) directly — `msw: { handlers: [chengyuHandlers.default()] }` (pattern:
 * GrammarPageFull.stories.tsx / PhoneticClustersPage.stories.tsx) — plus the
 * shared phase-gate handler at currentPhase 4 so the sidebar Learn group shows
 * the (Phase-4) Chengyu item as active.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChengyuPage } from "./ChengyuPage";
import { chengyuHandlers } from "../../../mocks/handlers/chengyu-handlers";
import { mswHandlers } from "../../../../.storybook/msw-handlers";
import { withAppLayout, withLearnLayout } from "../../../../.storybook/decorators";

const meta = {
  title: "Pages/Learn/ChengyuPage",
  component: ChengyuPage,
  decorators: [withAppLayout("/learn/chengyu"), withLearnLayout()],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ChengyuPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  parameters: {
    msw: { handlers: [chengyuHandlers.default(), mswHandlers.progression.phaseGate(4)] },
  },
};

export const Loading: Story = {
  parameters: {
    msw: { handlers: [chengyuHandlers.loading(), mswHandlers.progression.phaseGate(4)] },
  },
};

export const Empty: Story = {
  parameters: {
    msw: { handlers: [chengyuHandlers.empty(), mswHandlers.progression.phaseGate(4)] },
  },
};

export const Error: Story = {
  parameters: {
    msw: { handlers: [chengyuHandlers.error(), mswHandlers.progression.phaseGate(4)] },
  },
};
