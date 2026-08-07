/**
 * LearnLayout stories
 *
 * Visual stories for the REAL LearnLayout. Since Story 22.4 the phase-gated
 * pill tab bar (TopNav) was removed — the Learn tabs live in the sidebar's
 * Learn group (AppLayout), so LearnLayout is a nav-less scroll container
 * around the outlet.
 *
 * States: default content + mobile viewport.
 */
import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LearnLayout } from "./LearnLayout";

/** Placeholder content for the LearnLayout <Outlet />. */
function PageContent() {
  return (
    <div className="p-xl text-secondary font-md">
      Learn page content renders inside the LearnLayout scroll container.
    </div>
  );
}

/**
 * Renders the REAL LearnLayout at the given route with the outlet content.
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
          "Learn section layout — nav-less scroll container around the outlet (Learn tabs live in the sidebar's Learn group since Story 22.4).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LearnLayout>;

export const Default: Story = {
  decorators: [withLearnLayoutPath("/learn/foundations")],
  render: () => <PageContent />,
};

export const Mobile: Story = {
  decorators: [withLearnLayoutPath("/learn/radicals")],
  render: () => <PageContent />,
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
};
