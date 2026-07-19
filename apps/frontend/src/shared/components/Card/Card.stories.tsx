/**
 * Tokens used: --surface-card, --surface-border, --radius-md, --shadow-sm
 * See: DESIGN.md
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "Shared/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    title: { control: "text" },
    subtitle: { control: "text" },
    supportingText: { control: "text" },
    icon: { control: "text" },
    badge: { control: "text" },
    isLocked: { control: "boolean" },
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    title: "Card Title",
    subtitle: "Subtitle text",
    supportingText: "Optional supporting details go here.",
  },
};

export const WithIcon: Story = {
  args: {
    icon: "📘",
    title: "Icon Card",
    subtitle: "A card with a leading icon",
  },
};

export const WithBadge: Story = {
  args: {
    title: "Badge Card",
    subtitle: "Card with a status badge",
    badge: "New",
  },
};

export const Locked: Story = {
  args: {
    title: "Locked Card",
    subtitle: "This content is not yet available",
    isLocked: true,
  },
};

export const LongContent: Story = {
  args: {
    title:
      "A very long title that demonstrates how the card handles overflowing text content gracefully",
    subtitle: "This is a longer subtitle that provides additional context about the card contents",
    supportingText:
      "Even more details can go here. This text describes the card in greater depth, showing how multiple lines of text are handled within the card layout.",
  },
};

export const Minimal: Story = {
  args: {
    title: "Minimal Card",
  },
};

export const AllVariants: Story = {
  name: "Card — All Variants",
  render: () => (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <div style={{ width: 220 }}>
        <Card title="Default" subtitle="Basic card" />
      </div>
      <div style={{ width: 220 }}>
        <Card title="With Icon" subtitle="Has leading icon" icon="⭐" />
      </div>
      <div style={{ width: 220 }}>
        <Card title="Badge" subtitle="Has a badge" badge="Hot" />
      </div>
      <div style={{ width: 220 }}>
        <Card title="Locked" subtitle="Unavailable" isLocked />
      </div>
      <div style={{ width: 220 }}>
        <Card
          title="Long"
          subtitle="Multi-line"
          supportingText="Additional content that provides more detail about this card item."
        />
      </div>
    </div>
  ),
};
