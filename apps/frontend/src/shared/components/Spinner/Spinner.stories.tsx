/**
 * Spinner Component Stories
 * Reusable loading spinner with size (xs–lg) and color (primary/white) variants.
 * Tokens used: --color-primary, --text-on-accent / color tokens
 * See: DESIGN.md
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "./Spinner";

const meta: Meta<typeof Spinner> = {
  title: "Shared/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg"] },
    color: { control: "select", options: ["primary", "white"] },
    hidden: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

/**
 * Sizes — all size variants (xs → lg) rendered together.
 */
export const Sizes: Story = {
  name: "Spinner — Sizes",
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <Spinner size="xs" />
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
};

/**
 * Colors — primary (default) and white (for accent/dark surfaces).
 */
export const Colors: Story = {
  name: "Spinner — Colors",
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <Spinner size="md" color="primary" />
      <Spinner size="md" color="white" />
    </div>
  ),
};

/**
 * Loading — a spinner as it appears during an in-flight request.
 */
export const Loading: Story = {
  name: "Spinner — Loading",
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Spinner size="sm" />
      <span className="font-sm text-muted">Loading…</span>
    </div>
  ),
};
