/**
 * Tokens used: --color-primary, --gradient-primary, --shadow-sm, --transition-fast
 * See: DESIGN.md
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Shared/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    size: "md",
    children: "Primary Button",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    size: "md",
    children: "Secondary Button",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    size: "md",
    children: "Ghost Button",
  },
};

export const Icon: Story = {
  args: {
    variant: "icon",
    children: "✕",
  },
};

export const Control: Story = {
  args: {
    variant: "control",
    size: "sm",
    children: "⏵ Play",
  },
};

export const ControlActive: Story = {
  args: {
    variant: "control-active",
    size: "sm",
    children: "⏸ Pause",
  },
};

export const Circle: Story = {
  args: {
    variant: "circle",
    children: "🔊",
  },
};

export const Tag: Story = {
  args: {
    variant: "tag",
    size: "sm",
    children: "Filter Tag",
  },
};

export const TagActive: Story = {
  args: {
    variant: "tag-active",
    size: "sm",
    children: "Active Tag",
  },
};

export const Tab: Story = {
  args: {
    variant: "tab",
    children: "Tab Header",
  },
};

export const TabActive: Story = {
  args: {
    variant: "tab-active",
    children: "Active Tab",
  },
};

export const PrimaryActive: Story = {
  args: {
    variant: "primary-active",
    children: "Active Toggle",
  },
};

/**
 * Interactive tone selection button (border-2). For static legend chips use Box tone variants.
 */
export const Tone1: Story = {
  args: {
    variant: "tone-1",
    children: "Tone 1",
  },
};

/**
 * Interactive tone selection button (border-2). For static legend chips use Box tone variants.
 */
export const Tone2: Story = {
  args: {
    variant: "tone-2",
    children: "Tone 2",
  },
};

/**
 * Interactive tone selection button (border-2). For static legend chips use Box tone variants.
 */
export const Tone3: Story = {
  args: {
    variant: "tone-3",
    children: "Tone 3",
  },
};

/**
 * Interactive tone selection button (border-2). For static legend chips use Box tone variants.
 */
export const Tone4: Story = {
  args: {
    variant: "tone-4",
    children: "Tone 4",
  },
};

/**
 * Interactive tone selection button (border-2). For static legend chips use Box tone variants.
 */
export const Tone5: Story = {
  args: {
    variant: "tone-5",
    children: "Tone 5",
  },
};

/**
 * Inline-text — flows inline with surrounding text.
 * Zero padding/background/border — only dotted underline affordance.
 * Used for tappable unknown words in reading UI.
 */
export const InlineText: Story = {
  args: {
    variant: "inline-text",
    children: "未知",
  },
};

/**
 * Inline-text rendered inline with regular text to demonstrate
 * how it flows naturally within a text paragraph.
 */
export const InlineTextInContext: Story = {
  render: () => (
    <p style={{ fontSize: "18px", lineHeight: 1.8 }}>
      这是一段包含 <Button variant="inline-text">未知</Button> 文字的例子。
    </p>
  ),
};

/** All 17 variants rendered together for side-by-side comparison */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
      <Button variant="primary">primary</Button>
      <Button variant="secondary">secondary</Button>
      <Button variant="ghost">ghost</Button>
      <Button variant="icon">✕</Button>
      <Button variant="control" size="sm">
        ⏵ control
      </Button>
      <Button variant="control-active" size="sm">
        ⏸ control-active
      </Button>
      <Button variant="circle">🔊</Button>
      <Button variant="tag" size="sm">
        tag
      </Button>
      <Button variant="tag-active" size="sm">
        tag-active
      </Button>
      <Button variant="tab">tab</Button>
      <Button variant="tab-active">tab-active</Button>
      <Button variant="primary-active">primary-active</Button>
      <Button variant="tone-1">tone-1</Button>
      <Button variant="tone-2">tone-2</Button>
      <Button variant="tone-3">tone-3</Button>
      <Button variant="tone-4">tone-4</Button>
      <Button variant="tone-5">tone-5</Button>
      <Button variant="inline-text">inline-text</Button>
    </div>
  ),
};

export const Small: Story = {
  args: {
    variant: "primary",
    size: "sm",
    children: "Small",
  },
};

export const Large: Story = {
  args: {
    variant: "primary",
    size: "lg",
    children: "Large Button",
  },
};

export const Loading: Story = {
  args: {
    variant: "primary",
    loading: true,
    children: "Loading...",
  },
};

export const Disabled: Story = {
  args: {
    variant: "primary",
    disabled: true,
    children: "Disabled",
  },
};

export const WithInteraction: Story = {
  name: "Button — Click Interaction",
  args: {
    variant: "primary",
    children: "Click me",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /click me/i }));
  },
};
