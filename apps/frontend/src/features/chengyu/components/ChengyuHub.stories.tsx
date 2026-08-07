/**
 * @file components/ChengyuHub.stories.tsx
 * @description Storybook stories for ChengyuHub — idiom detail panel rendered
 * inside the shared LexicalHub dialog.
 * Story 23.3: Chengyu UI
 *
 * Self-fetches via `useChengyuDetail` against the 23.2-owned `chengyuHandlers`
 * (MSW). Covers: populated, loading, error. The MSW detail handler only
 * resolves `cy_0001` (others → 404), so the story args pin that id.
 *
 * NOTE: placed under `Features/Chengyu` per the story IMP (mirrors the
 * grandfathered `GrammarHub.stories.tsx`); tracked as TD-005 in
 * `docs/guides/testing/known-failures.md`.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChengyuHub } from "./ChengyuHub";
import { chengyuHandlers } from "../../../mocks/handlers/chengyu-handlers";

const meta = {
  title: "Features/Chengyu/ChengyuHub",
  component: ChengyuHub,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ChengyuHub>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { entityId: "cy_0001" },
  parameters: { msw: { handlers: [chengyuHandlers.default()] } },
};

export const Loading: Story = {
  args: { entityId: "cy_0001" },
  parameters: { msw: { handlers: [chengyuHandlers.loading()] } },
};

export const Error: Story = {
  args: { entityId: "cy_0001" },
  parameters: { msw: { handlers: [chengyuHandlers.error()] } },
};
