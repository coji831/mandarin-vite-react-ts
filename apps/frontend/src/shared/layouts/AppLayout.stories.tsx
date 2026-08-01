/**
 * AppLayout stories
 *
 * Visual stories for the REAL AppLayout (left sidebar + HubModal), rendered
 * inside MemoryRouter + Routes so nav active states work. The global preview
 * decorator provides the authenticated MockAuthProvider; guest variants use
 * the withGuestAuth decorator.
 *
 * States: authenticated (Dashboard / Learn / Practices active) · guest · mobile.
 * The HubModal stays closed (hubStore default) so no hub content is rendered.
 */
import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { withGuestAuth } from "../../../.storybook/decorators";

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
 * Used via the withAppLayoutPath decorator so each story controls the active nav item.
 */
function AppLayoutShell({ path, children }: { path: string; children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={children} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

const withAppLayoutPath =
  (path: string): Decorator =>
  (Story) => (
    <AppLayoutShell path={path}>
      <Story />
    </AppLayoutShell>
  );

const meta: Meta<typeof AppLayout> = {
  title: "Layouts/AppLayout",
  component: AppLayout,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Root application layout with left sidebar navigation. Renders the production AppLayout (SideNav + Outlet + HubModal).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppLayout>;

export const LoggedInDashboard: Story = {
  decorators: [withAppLayoutPath("/")],
  render: () => <PageContent />,
};

export const LoggedInLearnActive: Story = {
  decorators: [withAppLayoutPath("/learn")],
  render: () => <PageContent />,
};

export const LoggedInPracticesActive: Story = {
  decorators: [withAppLayoutPath("/practices")],
  render: () => <PageContent />,
};

/**
 * LoggedOut — guest user: sidebar hides the user chip and shows a Login CTA.
 * withGuestAuth overrides the global authenticated MockAuthProvider.
 */
export const LoggedOut: Story = {
  decorators: [withGuestAuth, withAppLayoutPath("/")],
  render: () => <PageContent />,
};

export const Mobile: Story = {
  decorators: [withAppLayoutPath("/")],
  render: () => <PageContent />,
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
};
