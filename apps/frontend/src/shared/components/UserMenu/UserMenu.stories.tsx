/**
 * UserMenu stories
 *
 * The single account control (login / user-info / logout), hosted in the
 * AppTopBar. Auth is threaded in via props (AppLayout → AppTopBar → UserMenu);
 * `withRouter` provides the navigation context for the Login/Register CTAs and
 * Profile/Settings navigation.
 *
 * States: authed (trigger closed) · authed (menu open, via play) · guest.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { UserMenu } from "./UserMenu";
import { withRouter } from "../../../../.storybook/decorators";

const meta: Meta<typeof UserMenu> = {
  title: "Shared/UserMenu",
  component: UserMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Single account control — avatar trigger + popover (Profile / Settings / Logout); guest state = Login/Register CTAs.",
      },
    },
  },
  decorators: [withRouter(["/"])],
};

export default meta;
type Story = StoryObj<typeof UserMenu>;

const authedArgs = {
  user: { id: "storybook-user", email: "user@example.com", displayName: "Storybook User" },
  isAuthenticated: true,
  logout: async () => {},
};

const guestArgs = {
  user: null,
  isAuthenticated: false,
  logout: async () => {},
};

export const Authed: Story = {
  name: "Authed — trigger",
  args: authedArgs,
};

export const AuthedMenuOpen: Story = {
  name: "Authed — menu open",
  args: authedArgs,
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector<HTMLButtonElement>(".user-menu__trigger");
    trigger?.click();
  },
};

export const Guest: Story = {
  name: "Guest — Login / Register",
  args: guestArgs,
};
