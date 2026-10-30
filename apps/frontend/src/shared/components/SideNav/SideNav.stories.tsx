/**
 * SideNav stories
 *
 * Visual stories for the shared SideNav (nav-only since Story 22.4 — the
 * account surface lives in the AppTopBar UserMenu). Uses withRouter for
 * NavLink active states.
 *
 * Covers: expanded (Dashboard/Learn active), collapsed rail with the bottom
 * collapse toggle, child hierarchy (indent-only, no left rail; active child +
 * active parent pill), collapsed rail active pill + tooltip, the phase-ahead
 * Learn group at phase 1 (A25 — nothing blocked), and the Story 22.5 split
 * Learn header (label default-landing link + chevron accordion toggle) with
 * URL-aware sub-state preservation.
 *
 * A25 / Story 25-3: SideNav holds no user-phase state — there is no locked
 * story because there is no lock (BM-1 §3, L6).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import type { NavItem, SideNavProps } from "./SideNav";
import { SideNav } from "./SideNav";
import { LEARN_NAV_ITEMS } from "shared/constants";
import { withRouter } from "../../../../.storybook/decorators";

const navItems: NavItem[] = [
  { path: "/", label: "Dashboard", icon: "dashboard", exact: true },
  { path: "/learn", label: "Learn", icon: "learn", exact: false, children: LEARN_NAV_ITEMS },
  { path: "/practices", label: "Practices", icon: "practice", exact: false },
  { path: "/library", label: "Library", icon: "book", exact: false },
  { path: "/progress", label: "Progress", icon: "progress", exact: false },
];

const defaultArgs: SideNavProps = {
  navItems,
  currentPath: "/",
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
  name: "Expanded — Learn active (hierarchy fixes)",
  decorators: [withRouter(["/learn/grammar"])],
  args: {
    currentPath: "/learn/grammar",
  },
};

export const CollapsedRail: Story = {
  name: "Collapsed rail (desktop) — bottom icon-only toggle",
  decorators: [withRouter(["/"])],
  args: {
    currentPath: "/",
    collapsed: true,
  },
};

export const CollapsedRailActive: Story = {
  name: "Collapsed rail — active Learn group (pill + tooltip)",
  decorators: [withRouter(["/learn/grammar"])],
  args: {
    currentPath: "/learn/grammar",
    collapsed: true,
  },
};

export const ChildHierarchy: Story = {
  name: "Learn — active child (indent-only, no rail)",
  decorators: [withRouter(["/learn/grammar"])],
  args: {
    currentPath: "/learn/grammar",
  },
};

/**
 * A25: at phase 1 every Learn item is an ordinary link — no lock icon, no
 * aria-disabled, no dimming. If this story ever renders a lock, a phase wall
 * came back. BM-1 §3 / L6.
 */
export const LearnPhaseAheadNothingBlocked: Story = {
  name: "Learn — phase ahead, nothing blocked (phase 1)",
  decorators: [withRouter(["/learn/foundations"])],
  args: {
    currentPath: "/learn/foundations",
  },
};

/**
 * Story 22.5 — split Learn header: the LABEL is the default-landing link
 * (navigates to /learn/foundations) and the CHEVRON is the accordion toggle.
 * Rendered URL-aware (full `location` prop) with sub-state in the URL so the
 * same-path guard is in play: clicking "Foundations" while already on
 * `/learn/foundations?tab=tones` is a no-op that preserves the tab.
 */
export const LearnHeaderSplit: Story = {
  name: "Learn — split header (label link + chevron toggle)",
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/learn/foundations?tab=tones"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    currentPath: "/learn/foundations",
    location: { pathname: "/learn/foundations", search: "?tab=tones" },
  },
};
