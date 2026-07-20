import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorScreen } from "./ErrorScreen";

const meta: Meta<typeof ErrorScreen> = {
  title: "Shared/ErrorScreen",
  component: ErrorScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    error: { control: "text" },
    onRetry: { action: "retried" },
    title: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorScreen>;

export const Default: Story = {
  args: {
    error: "Something went wrong. Please try again.",
  },
};

export const NetworkError: Story = {
  args: {
    error: "Failed to connect to the server. Check your connection.",
  },
};

export const CustomTitle: Story = {
  args: {
    title: "Failed to Load Quiz",
    error: "Unable to fetch quiz data. The server may be down.",
  },
};
