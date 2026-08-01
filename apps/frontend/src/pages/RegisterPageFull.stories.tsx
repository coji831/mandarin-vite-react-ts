/**
 * RegisterPage stories.
 *
 * NOTE (State Parity): RegisterPage is a static form page — it does not fetch
 * on mount — so Loading/Error/Empty API states would be unreachable. Default-only.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RegisterPage } from "./RegisterPage";

const meta: Meta<typeof RegisterPage> = {
  title: "Pages/Register",
  component: RegisterPage,
  parameters: { layout: "fullscreen", layoutType: "app", layoutPath: "/auth/register" },
};

export default meta;
type Story = StoryObj<typeof RegisterPage>;

export const Default: Story = {};
