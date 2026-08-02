/**
 * LearnLayout stories
 *
 * Visual stories for the REAL LearnLayout (TopNav pill tabs + phase gating),
 * rendered inside MemoryRouter + Routes so the active pill reflects the URL.
 *
 * The phase-gate is fetched via MSW (`/progression/phase-gate`); the
 * authenticated global MockAuthProvider means guests render all tabs unlocked
 * via the withGuestAuth decorator (effectivePhase = 4).
 *
 * States: Phase 1 (foundations only) · Phase 2 (radicals unlocked) ·
 *         Phase 3 · Phase 4 (all unlocked) · Guest (all unlocked) · Mobile.
 */
import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LearnLayout } from "./LearnLayout";
import { withGuestAuth } from "../../../.storybook/decorators";
import { mswHandlers } from "../../../.storybook/msw-handlers";

/** Placeholder content for the LearnLayout <Outlet />. */
function PageContent() {
  return (
    <div className="p-xl text-secondary font-md">
      Learn page content renders below the pill tab bar.
    </div>
  );
}

/**
 * Renders the REAL LearnLayout at the given route with the outlet content.
 * The route also determines which pill is active (NavLink match).
 */
function LearnLayoutShell({ path, children }: { path: string; children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<LearnLayout />}>
          <Route index element={children} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

const withLearnLayoutPath =
  (path: string): Decorator =>
  (Story) => (
    <LearnLayoutShell path={path}>
      <Story />
    </LearnLayoutShell>
  );

const meta: Meta<typeof LearnLayout> = {
  title: "Layouts/LearnLayout",
  component: LearnLayout,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Learn section layout with phase-gated pill tabs (TopNav) and an outlet below. Phase comes from the phase-gate API (MSW in stories).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LearnLayout>;

export const Phase1: Story = {
  decorators: [withLearnLayoutPath("/learn/foundations")],
  render: () => <PageContent />,
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(1)] },
  },
};

export const Phase2Radicals: Story = {
  decorators: [withLearnLayoutPath("/learn/radicals")],
  render: () => <PageContent />,
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(2)] },
  },
};

export const Phase3: Story = {
  decorators: [withLearnLayoutPath("/learn/readers")],
  render: () => <PageContent />,
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(3)] },
  },
};

export const Phase4: Story = {
  decorators: [withLearnLayoutPath("/learn/chengyu")],
  render: () => <PageContent />,
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(4)] },
  },
};

/**
 * GuestMode — all tabs unlocked. Guest users see effectivePhase = 4
 * (withGuestAuth overrides the authenticated MockAuthProvider).
 */
export const GuestMode: Story = {
  decorators: [withGuestAuth, withLearnLayoutPath("/learn/foundations")],
  render: () => <PageContent />,
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(1)] },
  },
  name: "Guest mode — all tabs unlocked",
};

export const Mobile: Story = {
  decorators: [withLearnLayoutPath("/learn/radicals")],
  render: () => <PageContent />,
  parameters: {
    viewport: { defaultViewport: "mobile2" },
    msw: { handlers: [mswHandlers.progression.phaseGate(2)] },
  },
};
