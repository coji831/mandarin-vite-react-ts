/**
 * Tokens used: --surface-input, --surface-border, --radius-md, --color-primary
 * See: DESIGN.md
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "Shared/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    value: { control: "text" },
    onChange: { action: "changed" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    type: { control: "select", options: ["text", "email", "password"] },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Type something...",
  },
};

export const WithValue: Story = {
  args: {
    value: "Hello World",
  },
};

export const Disabled: Story = {
  args: {
    value: "Disabled input",
    disabled: true,
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password...",
  },
};

export const WithInteraction: Story = {
  name: "Input — Typing Interaction",
  args: {
    placeholder: "Type here...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Type here...");
    await userEvent.type(input, "Hello Storybook");
  },
};
