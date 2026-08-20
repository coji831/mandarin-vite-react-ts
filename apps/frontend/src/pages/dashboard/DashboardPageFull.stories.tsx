/**
 * DashboardPage stories.
 *
 * NOTE (State Parity): DashboardPage fetches the phase gate on mount. On fetch
 * failure usePhaseGate resolves phaseGate=null (no error surface) and the page
 * falls through to the Phase 1 welcome — so the `Error` story below documents
 * that graceful degradation (no crash). A dedicated inline error+retry
 * surface is a Phase-B decision (needs container logic — out of this pass).
 * Reachable states: Loading + each phase + Error + Guest.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DashboardPage } from "./DashboardPage";
import { mswHandlers } from "../../../.storybook/msw-handlers";
import { withGuestAuth } from "../../../.storybook/decorators";

const meta: Meta<typeof DashboardPage> = {
  title: "Pages/Dashboard",
  component: DashboardPage,
  tags: ["pages-hub-launcher"],
  decorators: [],
  parameters: {
    layout: "fullscreen",
    layoutType: "app",
    layoutPath: "/",
  },
};

export default meta;
type Story = StoryObj<typeof DashboardPage>;

export const Loading: Story = {
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate()] },
  },
};

export const Empty: Story = {
  name: "Empty (Phase 1)",
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(1)] },
  },
};

export const Default: Story = {
  name: "Default (Phase 2)",
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

export const Edge: Story = {
  name: "Edge (Phase 4)",
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(4)] },
  },
};

/**
 * Error — phase-gate fetch fails (500). Documents current behavior: usePhaseGate
 * resolves phaseGate=null → the page degrades to the phase-1 welcome (no crash).
 */
export const Error: Story = {
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGateError()] },
  },
};

/**
 * Guest — unauthenticated user sees DashboardGuest (header CTA + hero + phase previews).
 * Uses withGuestAuth decorator to override global MockAuthProvider with isAuthenticated: false.
 */
export const Guest: Story = {
  decorators: [withGuestAuth],
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(1)] },
  },
};
