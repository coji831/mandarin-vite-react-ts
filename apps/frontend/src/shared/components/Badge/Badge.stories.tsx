/**
 * Badge Component Stories
 * Shared token pill for inline metadata labels (HSK level, tags, counts).
 * Variants: primary (bg-primary-bg/text-primary), surface (bg-surface-hover/text-primary),
 * accent (bg-primary-bg-medium/text-accent).
 * Tokens used: --color-primary-*, --surface-*, --text-*
 * See: DESIGN.md
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Shared/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "surface", "accent"],
    },
    children: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Primary: Story = {
  args: { variant: "primary", children: "HSK 1" },
};

export const Surface: Story = {
  args: { variant: "surface", children: "HSK 2" },
};

export const Accent: Story = {
  args: { variant: "accent", children: "HSK 3" },
};

/**
 * VariantCatalog — all three token pill styles side by side, as used across
 * readers (primary), word-hub (surface), and phonetic-clusters (accent).
 */
export const VariantCatalog: Story = {
  name: "Badge — Variant Catalog",
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="surface">Surface</Badge>
      <Badge variant="accent">Accent</Badge>
    </div>
  ),
};
