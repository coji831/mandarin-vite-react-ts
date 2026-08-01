/**
 * Chip Component Stories
 * Tokens used: --surface-*, --surface-border, --color-primary-*, --tone-1..5,
 * --radius-pill, --space-*, --font-*, --text-*
 * See: DESIGN.md
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Chip } from "./Chip";

const meta: Meta<typeof Chip> = {
  title: "Shared/Chip",
  component: Chip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "outline",
        "surface",
        "solid",
        "primary",
        "tone-1",
        "tone-2",
        "tone-3",
        "tone-4",
        "tone-5",
      ],
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
    interactive: { control: "boolean" },
    active: { control: "boolean" },
    label: { control: "text" },
    pinyin: { control: "text" },
    count: { control: "text" },
    glyph: { control: "text" },
    icon: { control: "text" },
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Interactive: Story = {
  args: {
    label: "Radical",
    onClick: () => {},
  },
};

export const NonInteractive: Story = {
  args: {
    label: "HSK 3",
  },
};

export const Active: Story = {
  args: {
    label: "Mastered",
    interactive: true,
    active: true,
    onClick: () => {},
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <Chip size="sm" label="Small" />
      <Chip size="md" label="Medium" />
      <Chip size="lg" label="Large" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Chip variant="outline" label="Outline" />
      <Chip variant="surface" label="Surface" />
      <Chip variant="solid" label="Solid" />
      <Chip variant="primary" label="Primary" />
      <Chip variant="tone-1" label="Tone 1" />
      <Chip variant="tone-2" label="Tone 2" />
      <Chip variant="tone-3" label="Tone 3" />
      <Chip variant="tone-4" label="Tone 4" />
      <Chip variant="tone-5" label="Tone 5" />
    </div>
  ),
};

export const ContentSlots: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Chip glyph="口" pinyin="kǒu" label="mouth" count="5" onClick={() => {}} />
      <Chip icon="✅" label="Known" onClick={() => {}} />
      <Chip label="HSK 4" count="12" variant="primary" />
    </div>
  ),
};
