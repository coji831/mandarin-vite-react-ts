/**
 * AppLayout stories
 *
 * Visual stories for the REAL AppLayout (AppTopBar + auth-free SideNav with
 * the phase-gated Learn group + Outlet + HubModal), rendered inside
 * MemoryRouter + Routes so nav active states work. The global preview
 * decorator provides the authenticated MockAuthProvider + a default phase-4
 * MSW handler; guest/phase variants override via decorators/parameters.
 *
 * States: authenticated (Dashboard / Learn active) · collapsed rail ·
 * phase-locked Learn group · guest · mobile.
 * The HubModal stays closed (hubStore default) so no hub content is rendered.
 */
import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { withGuestAuth } from "../../../.storybook/decorators";
import { mswHandlers } from "../../../.storybook/msw-handlers";

/** Args accepted by AppLayout (optional `initialCollapsed` prop). */
type AppLayoutArgs = { initialCollapsed?: boolean };

/** Placeholder content for the AppLayout <Outlet />. */
function PageContent() {
  return (
    <div className="p-xl text-secondary font-md">
      Page content renders in the <code>main</code> area beside the sidebar.
    </div>
  );
}

/**
 * Renders the REAL AppLayout at the given route with the outlet content.
 * Used via the withAppLayoutPath decorator so each story controls the active
 * nav item (and the desktop collapsed-rail initial state).
 */
function AppLayoutShell({
  path,
  initialCollapsed,
  children,
}: {
  path: string;
  initialCollapsed?: boolean;
  children: ReactNode;
}) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout initialCollapsed={initialCollapsed} />}>
          <Route index element={children} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

const withAppLayoutPath =
  (path: string, initialCollapsed?: boolean): Decorator<AppLayoutArgs> =>
  (Story) => (
    <AppLayoutShell path={path} initialCollapsed={initialCollapsed}>
      <Story />
    </AppLayoutShell>
  );

const meta: Meta<AppLayoutArgs> = {
  title: "Layouts/AppLayout",
  component: AppLayout,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Root application layout — AppTopBar (UserMenu) + SideNav (phase-gated Learn group, collapsible rail) + Outlet + HubModal.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<AppLayoutArgs>;

export const LoggedInDashboard: Story = {
  decorators: [withAppLayoutPath("/")],
  render: () => <PageContent />,
};

export const LoggedInLearnActive: Story = {
  decorators: [withAppLayoutPath("/learn/grammar")],
  render: () => <PageContent />,
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(2)] },
  },
};

/**
 * CollapsedRail — desktop mini-rail (the 22.4 bug scenario). Auth chrome is
 * gone from the rail entirely (it lives in the AppTopBar UserMenu), so there
 * is no oversized button / stray border / overlap.
 */
export const CollapsedRail: Story = {
  decorators: [withAppLayoutPath("/", true)],
  render: () => <PageContent />,
};

/**
 * PhaseLocked — authed user at phase 1: Grammar/Phonetic/Readers/Chengyu
 * show locked states in the sidebar Learn group.
 */
export const PhaseLocked: Story = {
  decorators: [withAppLayoutPath("/learn/foundations")],
  render: () => <PageContent />,
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(1)] },
  },
};

/**
 * LoggedOut — guest user: the sidebar renders no auth chrome; the AppTopBar
 * UserMenu shows Login/Register CTAs. withGuestAuth overrides the global
 * authenticated MockAuthProvider. Phase 1 (not the default phase 4) so the
 * guest shell stays truthful: the calibrated guest unlocks exactly Phase 1.
 */
export const LoggedOut: Story = {
  decorators: [withGuestAuth, withAppLayoutPath("/")],
  render: () => <PageContent />,
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(1)] },
  },
};

/**
 * GuestShell — Epic 25 S1/guest state parity: the passive Guest identity badge
 * shows in the AppTopBar (near the Login/Register CTAs) and the sidebar Learn
 * group renders the Phase-1 shape (Foundations unlocked, Radicals/Grammar/
 * Phonetic/Readers/Chengyu locked). No CTA/upsell (epic-26).
 */
export const GuestShell: Story = {
  decorators: [withGuestAuth, withAppLayoutPath("/learn/foundations")],
  render: () => <PageContent />,
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(1)] },
  },
};

export const Mobile: Story = {
  decorators: [withAppLayoutPath("/")],
  render: () => <PageContent />,
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
};
