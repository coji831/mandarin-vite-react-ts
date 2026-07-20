import type { Meta, StoryObj } from "@storybook/react-vite";
import { LoadingScreen } from "./LoadingScreen";

const meta: Meta<typeof LoadingScreen> = {
  title: "Shared/LoadingScreen",
  component: LoadingScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    message: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingScreen>;

export const Default: Story = {
  args: {},
};

export const CustomMessage: Story = {
  args: {
    message: "Loading radicals...",
  },
};
