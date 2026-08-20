/**
 * @file GuestUpsell.stories.tsx
 * @description Storybook stories for GuestUpsell — the sign-in upsell card
 * shown to guests in place of registered-only / write actions.
 * Bug 2: shared primitive used by HubMnemonicSection, ReviewView, etc.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { GuestUpsell } from "./GuestUpsell";
import { withRouter } from "../../../../.storybook/decorators";

const meta: Meta<typeof GuestUpsell> = {
  title: "Shared/GuestUpsell",
  component: GuestUpsell,
  decorators: [withRouter(["/"])],
  parameters: {
    backgrounds: { default: "dark" },
  },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    icon: { control: "select" },
    ctaLabel: { control: "text" },
    to: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof GuestUpsell>;

export const Default: Story = {
  args: {
    icon: "lock",
    title: "Mnemonic stories",
    description: "Register to generate and save your own mnemonic stories for characters.",
  },
};

export const NoIcon: Story = {
  args: {
    title: "Save to Review",
    description: "Register to save characters to your spaced-repetition review queue.",
  },
};

export const CustomCta: Story = {
  args: {
    icon: "lock",
    title: "Your session expired",
    description: "Your session expired — sign in again to continue reviewing.",
    ctaLabel: "Sign in again ▸",
    to: "/auth/login",
  },
};
