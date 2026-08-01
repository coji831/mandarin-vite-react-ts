/**
 * DashboardPage stories.
 *
 * NOTE (State Parity): DashboardPage fetches the phase gate on mount. On fetch
 * failure usePhaseGate resolves phaseGate=null (no error surface) and the page
 * falls through to the Phase 1 welcome — so there is NO error code path to
 * story. Reachable states: Loading + each phase + Guest (below).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DashboardPage } from "./DashboardPage";
import { mswHandlers } from "../../../.storybook/msw-handlers";
import { withGuestAuth } from "../../../.storybook/decorators";

const meta: Meta<typeof DashboardPage> = {
  title: "Pages/Dashboard",
  component: DashboardPage,
  decorators: [],
  parameters: { layout: "fullscreen", layoutType: "app", layoutPath: "/" },
};

export default meta;
type Story = StoryObj<typeof DashboardPage>;

export const Loading: Story = {
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate()] },
  },
};

export const Phase1Welcome: Story = {
  name: "Phase 1 - Welcome",
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(1)] },
  },
};

export const Phase2Active: Story = {
  name: "Phase 2 - Active",
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(2)] },
  },
};

export const Phase3Active: Story = {
  name: "Phase 3 - Active",
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(3)] },
  },
};

export const Phase4Complete: Story = {
  name: "Phase 4 - Complete",
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(4)] },
  },
};

/**
 * Guest — unauthenticated user sees DashboardGuest (welcome + phase previews + signup CTA).
 * Uses withGuestAuth decorator to override global MockAuthProvider with isAuthenticated: false.
 */
export const Guest: Story = {
  decorators: [withGuestAuth],
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(1)] },
  },
};
