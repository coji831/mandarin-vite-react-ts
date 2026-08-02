/**
 * LoginPage stories.
 *
 * NOTE (State Parity): LoginPage is a static form page — it does not fetch on
 * mount — so Loading/Error/Empty API states would be unreachable. Default-only.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { LoginPage } from "./LoginPage";

const meta: Meta<typeof LoginPage> = {
  title: "Pages/Login",
  component: LoginPage,
  parameters: { layout: "fullscreen", layoutType: "app", layoutPath: "/auth/login" },
};

export default meta;
type Story = StoryObj<typeof LoginPage>;

export const Default: Story = {};
