/**
 * Tokens used: --color-primary, --surface-input, --transition-fast
 * See: DESIGN.md
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { ToggleSwitch } from "./ToggleSwitch";

const meta: Meta<typeof ToggleSwitch> = {
  title: "Shared/ToggleSwitch",
  component: ToggleSwitch,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    checked: { control: "boolean" },
    onChange: { action: "toggled" },
    label: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleSwitch>;

export const Off: Story = {
  args: {
    checked: false,
    label: "Show top 20 only",
  },
};

export const On: Story = {
  args: {
    checked: true,
    label: "Show top 20 only",
  },
};

export const WithoutLabel: Story = {
  args: {
    checked: false,
  },
};

export const WithInteraction: Story = {
  name: "ToggleSwitch — Toggle Interaction",
  args: {
    checked: false,
    label: "Toggle me",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");
    await userEvent.click(checkbox);
  },
};
