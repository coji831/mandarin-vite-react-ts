/**
 * SideNav stories
 *
 * Visual stories for the shared SideNav component.
 * Covers logged-in states (Dashboard, Learn, Practices active),
 * logged-out state, and mobile viewport.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { SideNavProps } from "./SideNav";
import { SideNav } from "./SideNav";
import { withRouter } from "../../../../.storybook/decorators";

const defaultNavItems = [
  { path: "/", label: "Dashboard", icon: "🏠", exact: true },
  { path: "/learn", label: "Learn", icon: "📚", exact: false },
  { path: "/practices", label: "Practices", icon: "🎯", exact: false },
  { path: "/library", label: "Library", icon: "📖", exact: false },
  { path: "/progress", label: "Progress", icon: "📊", exact: false },
];

const defaultArgs: SideNavProps = {
  navItems: defaultNavItems,
  currentPath: "/",
  isAuthenticated: true,
  userName: "Alex",
  onLogout: () => {},
  onLogin: () => {},
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
    isAuthenticated: { control: "boolean" },
    userName: { control: "text" },
    onLogout: { action: "logout" },
    onLogin: { action: "login" },
  },
  args: defaultArgs,
};

export default meta;
type Story = StoryObj<typeof SideNav>;

export const LoggedInDashboard: Story = {
  decorators: [withRouter(["/"])],
  args: {
    currentPath: "/",
  },
};

export const LoggedInLearnActive: Story = {
  decorators: [withRouter(["/learn"])],
  args: {
    currentPath: "/learn",
  },
};

export const LoggedInPracticesActive: Story = {
  decorators: [withRouter(["/practices"])],
  args: {
    currentPath: "/practices",
  },
};

export const LoggedOut: Story = {
  decorators: [withRouter(["/"])],
  args: {
    isAuthenticated: false,
    userName: undefined,
  },
};

export const Mobile: Story = {
  decorators: [withRouter(["/"])],
  args: {
    currentPath: "/",
  },
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
};
