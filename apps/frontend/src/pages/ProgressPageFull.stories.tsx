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
