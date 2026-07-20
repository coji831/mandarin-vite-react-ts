/**
 * AppLayout stories
 *
 * Visual stories for the root application layout with left sidebar navigation.
 * Covers logged-in states (Dashboard, Learn active), logged-out state,
 * and mobile viewport.
 *
 * Uses shared SideNav component instead of inline sidebar code.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { SideNav } from "shared/components";

// ──────────────────────────────────────────────
// Sidebar + Content wrapper
// ──────────────────────────────────────────────

type WrapperProps = {
  isAuthenticated?: boolean;
  activeRoute?: string;
  userName?: string;
};

function Wrapper({ isAuthenticated = true, activeRoute = "/", userName = "Alex" }: WrapperProps) {
  const navItems = [
    { path: "/", label: "Dashboard", icon: "🏠", exact: true },
    { path: "/learn", label: "Learn", icon: "📚", exact: false },
    { path: "/practices", label: "Practices", icon: "🎯", exact: false },
    { path: "/library", label: "Library", icon: "📖", exact: false },
    { path: "/progress", label: "Progress", icon: "📊", exact: false },
  ];

  return (
    <MemoryRouter initialEntries={[activeRoute]}>
      <div className="flex">
        <SideNav
          navItems={navItems}
          currentPath={activeRoute}
          isAuthenticated={isAuthenticated}
          userName={isAuthenticated ? userName : undefined}
          onLogout={() => {}}
          onLogin={() => {}}
        />
        <main className="flex flex-col flex-1 bg-surface-dark-alt p-xl text-secondary font-md">
          {activeRoute === "/" && <p>Dashboard content area</p>}
          {activeRoute.startsWith("/learn") && <p>Learn content area</p>}
          {activeRoute.startsWith("/practices") && <p>Practices content area</p>}
          {!isAuthenticated && <p>Welcome! Please log in.</p>}
        </main>
      </div>
    </MemoryRouter>
  );
}

// ──────────────────────────────────────────────
// Meta
// ──────────────────────────────────────────────

const meta: Meta<typeof Wrapper> = {
  title: "Layouts/AppLayout",
  component: Wrapper,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "**Sidebar Studio** — Dark surface sidebar with amber accent active states. Left sidebar layout with 220px width.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Wrapper>;

export const LoggedInDashboard: Story = {
  args: { isAuthenticated: true, activeRoute: "/", userName: "Alex" },
};

export const LoggedInLearnActive: Story = {
  args: { isAuthenticated: true, activeRoute: "/learn", userName: "Alex" },
};

export const LoggedInPracticesActive: Story = {
  args: { isAuthenticated: true, activeRoute: "/practices", userName: "Alex" },
};

export const LoggedOut: Story = {
  args: { isAuthenticated: false, activeRoute: "/" },
};

export const Mobile: Story = {
  args: { isAuthenticated: true, activeRoute: "/", userName: "Alex" },
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
};
