/**
 * AppTopBar stories
 *
 * The slim global top bar hosting the UserMenu (single account surface).
 * Auth is threaded in via props (AppLayout → AppTopBar → UserMenu);
 * `withRouter` provides the navigation context.
 *
 * Epic 25 S1: the guest state also renders the compact passive "Guest"
 * identity badge (no CTA — upsell is epic-26).
 *
 * States: authed (UserMenu) · guest (Guest badge + Login/Register).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppTopBar } from "./AppTopBar";
import { withRouter } from "../../../../.storybook/decorators";

const meta: Meta<typeof AppTopBar> = {
  title: "Shared/AppTopBar",
  component: AppTopBar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Slim global top bar (56px) hosting the account UserMenu on the right; passive Guest identity badge when isGuest.",
      },
    },
  },
  decorators: [withRouter(["/"])],
};

export default meta;
type Story = StoryObj<typeof AppTopBar>;

const authedArgs = {
  user: { id: "storybook-user", email: "user@example.com", displayName: "Storybook User" },
  isAuthenticated: true,
  isGuest: false,
  logout: async () => {},
};

export const Authed: Story = {
  name: "Authed — UserMenu",
  args: authedArgs,
};

export const Guest: Story = {
  name: "Guest — badge + Login / Register",
  args: {
    user: null,
    isAuthenticated: false,
    isGuest: true,
    logout: async () => {},
  },
};
