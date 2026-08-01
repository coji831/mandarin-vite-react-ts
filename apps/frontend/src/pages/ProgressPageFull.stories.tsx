/**
 * ProgressPage stories.
 *
 * NOTE (State Parity): ProgressPage is a static placeholder (no API fetch on
 * mount), so Loading/Error/Empty API states would be unreachable. Default-only.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressPage } from "./ProgressPage";

const meta: Meta<typeof ProgressPage> = {
  title: "Pages/Progress",
  component: ProgressPage,
  parameters: { layout: "fullscreen", layoutType: "app", layoutPath: "/progress" },
};

export default meta;
type Story = StoryObj<typeof ProgressPage>;

export const Default: Story = {};
