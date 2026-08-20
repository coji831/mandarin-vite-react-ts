/**
 * PracticesPage stories.
 *
 * NOTE (State Parity): PracticesPage fetches the phase gate via useQuizCard. On
 * fetch failure usePhaseGate resolves phaseGate=null (no error surface) and the
 * page renders Phase 1 cards — so there is NO error code path to story.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import PracticesPage from "./PracticesPage";
import { mswHandlers } from "../../../.storybook/msw-handlers";
import { withGuestAuth } from "../../../.storybook/decorators";

const meta: Meta<typeof PracticesPage> = {
  title: "Pages/Practices",
  component: PracticesPage,
  tags: ["pages-hub-launcher"],
  parameters: {
    layout: "fullscreen",
    layoutType: "app",
    layoutPath: "/practices",
  },
};

export default meta;
type Story = StoryObj<typeof PracticesPage>;

export const Loading: Story = {
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate()] },
  },
};

export const Phase1: Story = {
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(1)] },
  },
};

export const Phase2: Story = {
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(2)] },
  },
};

/**
 * Guest practices page — shows ReviewPromptCard instead of ReviewLaunchCard.
 */
export const GuestMode: Story = {
  decorators: [withGuestAuth],
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(1)] },
  },
};
