/**
 * Tokens used: --color-primary, --color-primary-dark, --color-primary-light, --transition-fast
 * See: DESIGN.md
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { TextLink } from "./TextLink";

const meta: Meta<typeof TextLink> = {
  title: "Shared/TextLink",
  component: TextLink,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    onClick: { action: "clicked" },
    disabled: { control: "boolean" },
    children: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof TextLink>;

export const Default: Story = {
  args: {
    children: "Register",
    onClick: () => {},
  },
};

export const Hover: Story = {
  args: {
    children: "Register",
    onClick: () => {},
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("button", { name: /register/i });
    await userEvent.hover(link);
  },
};

export const Disabled: Story = {
  args: {
    children: "Register",
    disabled: true,
    onClick: () => {},
  },
};

export const InText: Story = {
  render: () => (
    <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-sm)" }}>
      Don&apos;t have an account? <TextLink onClick={() => {}}>Register</TextLink>
    </p>
  ),
};
