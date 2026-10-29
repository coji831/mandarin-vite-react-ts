/**
 * FoundationsPage (the Blueprint) — page stories.
 *
 * The Blueprint is a `wizard` / Focus surface: seven steps, one per screen, one
 * primary Continue. The states are the ones the step bodies can actually reach:
 * loading (the pinyin/tones pool is in flight), default (step 1 on real data),
 * error (a failed pool fetch offers a retry), and edge (a later step, reached by
 * pressing Continue — the stepper's own jump only moves backwards).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { FoundationsPage } from "./FoundationsPage";
import { mswHandlers } from "../../../../.storybook/msw-handlers";

const meta: Meta<typeof FoundationsPage> = {
  title: "Pages/Learn/Foundations/Blueprint",
  component: FoundationsPage,
  tags: ["pages-wizard"],
  parameters: {
    layout: "fullscreen",
    layoutType: "learn",
    layoutPath: "/learn/foundations",
  },
};

export default meta;
type Story = StoryObj<typeof FoundationsPage>;

export const Default: Story = {
  name: "Default (step 1 — initials)",
  parameters: {
    msw: {
      handlers: [...mswHandlers.foundations.default(), mswHandlers.progression.phaseGate(2)],
    },
  },
};

export const Loading: Story = {
  parameters: {
    msw: { handlers: [...mswHandlers.foundations.loading(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const Error: Story = {
  parameters: {
    msw: { handlers: [...mswHandlers.foundations.error(), mswHandlers.progression.phaseGate(2)] },
  },
};

/** Step 2 (finals) — reached by pressing Continue once. */
export const Edge: Story = {
  name: "Edge (step 2 — finals)",
  parameters: {
    msw: {
      handlers: [...mswHandlers.foundations.default(), mswHandlers.progression.phaseGate(2)],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Continue" }));
  },
};
