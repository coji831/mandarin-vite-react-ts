/**
 * SideNav stories
 *
 * Visual stories for the shared SideNav (nav-only since Story 22.4 — the
 * account surface lives in the AppTopBar UserMenu). Uses withRouter for
 * NavLink active states.
 *
 * Covers: expanded (Dashboard/Learn active), collapsed rail, and phase-gated
 * Learn locks.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { SideNavProps } from "./SideNav";
import { SideNav } from "./SideNav";
import { LEARN_NAV_ITEMS, LEARN_REQUIRED_PHASE } from "shared/constants";
import { withRouter } from "../../../../.storybook/decorators";

const navItems = [
  { path: "/", label: "Dashboard", icon: "🏠", exact: true },
  { path: "/learn", label: "Learn", icon: "📚", exact: false, children: LEARN_NAV_ITEMS },
  { path: "/practices", label: "Practices", icon: "🎯", exact: false },
  { path: "/library", label: "Library", icon: "📖", exact: false },
  { path: "/progress", label: "Progress", icon: "📊", exact: false },
];

const defaultArgs: SideNavProps = {
  navItems,
  currentPath: "/",
  phaseGate: 4,
  requiredPhase: (id) => LEARN_REQUIRED_PHASE[id] ?? 1,
  onToggleCollapse: () => {},
};

const meta: Meta<typeof SideNav> = {
  title: "Shared/SideNav",
  component: SideNav,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    navItems: { control: "object" },
    currentPath: { control: "text" },
    phaseGate: { control: "number" },
    collapsed: { control: "boolean" },
    onToggleCollapse: { action: "toggle-collapse" },
  },
  args: defaultArgs,
};

export default meta;
type Story = StoryObj<typeof SideNav>;

export const ExpandedDashboard: Story = {
  name: "Expanded — Dashboard active",
  decorators: [withRouter(["/"])],
  args: {
    currentPath: "/",
  },
};

export const ExpandedLearnActive: Story = {
  name: "Expanded — Learn active",
  decorators: [withRouter(["/learn/grammar"])],
  args: {
    currentPath: "/learn/grammar",
  },
};

export const CollapsedRail: Story = {
  name: "Collapsed rail (desktop)",
  decorators: [withRouter(["/"])],
  args: {
    currentPath: "/",
    collapsed: true,
  },
};

export const PhaseLocked: Story = {
  name: "Phase 1 — Learn children locked",
  decorators: [withRouter(["/learn/foundations"])],
  args: {
    currentPath: "/learn/foundations",
    phaseGate: 1,
  },
};
