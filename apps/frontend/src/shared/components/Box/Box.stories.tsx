/**
 * Box Component — Storybook stories
 *
 * Covers all 20 variants, padding examples, `as` prop polymorphism,
 * and `className` merge behavior.
 *
 * Tone variants (tone-1..5) are static legend chips — use Button tone
 * variants for interactive selection.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { Box } from "./Box";

function BoxStory(props: React.ComponentProps<typeof Box>) {
  return <Box {...props} />;
}

const meta: Meta<typeof BoxStory> = {
  title: "Shared/Box",
  component: BoxStory,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BoxStory>;

export const Dark: Story = {
  args: {
    variant: "dark",
    padding: "md",
    children: <p style={{ margin: 0 }}>dark variant — primary card surface with shadow</p>,
  },
};

export const DarkAlt: Story = {
  args: {
    variant: "dark-alt",
    padding: "md",
    children: <p style={{ margin: 0 }}>dark-alt variant — alternate card surface</p>,
  },
};

export const DarkAccent: Story = {
  args: {
    variant: "dark-accent",
    padding: "md",
    children: (
      <p style={{ margin: 0 }}>dark-accent variant — dark card with primary-border accent border</p>
    ),
  },
};

export const DarkAccentPrimary: Story = {
  args: {
    variant: "dark-accent-primary",
    padding: "md",
    children: (
      <p style={{ margin: 0 }}>
        dark-accent-primary variant — dark card with strong primary accent
      </p>
    ),
  },
};

export const Surface: Story = {
  args: {
    variant: "surface",
    padding: "md",
    children: <p style={{ margin: 0 }}>surface variant — lighter nested surface</p>,
  },
};

export const Elevated: Story = {
  args: {
    variant: "elevated",
    padding: "md",
    children: <p style={{ margin: 0 }}>elevated variant — thicker 2px border for forms/inputs</p>,
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    children: <p style={{ margin: 0 }}>error variant — red border with small padding and radius</p>,
  },
};

export const Card: Story = {
  args: {
    variant: "card",
    padding: "lg",
    children: <p style={{ margin: 0 }}>card variant — larger radius-lg for card containers</p>,
  },
};

export const Divider: Story = {
  args: {
    variant: "divider",
    children: (
      <p style={{ margin: 0 }}>divider variant — section divider, no background or radius</p>
    ),
  },
};

export const Header: Story = {
  args: {
    variant: "header",
    children: <p style={{ margin: 0 }}>header variant — section header bar</p>,
  },
};

export const Dashed: Story = {
  args: {
    variant: "dashed",
    padding: "md",
    children: <p style={{ margin: 0 }}>dashed variant — empty state container</p>,
  },
};

export const Chip: Story = {
  args: {
    variant: "chip",
    children: <p style={{ margin: 0 }}>chip variant — label/badge</p>,
  },
};

export const Item: Story = {
  args: {
    variant: "item",
    padding: "sm",
    children: <p style={{ margin: 0 }}>item variant — compact list item</p>,
  },
};

export const Pass: Story = {
  args: {
    variant: "pass",
    padding: "md",
    children: <p style={{ margin: 0 }}>pass variant — quiz passed state</p>,
  },
};

export const Fail: Story = {
  args: {
    variant: "fail",
    padding: "md",
    children: <p style={{ margin: 0 }}>fail variant — quiz failed state</p>,
  },
};

export const Tone1: Story = {
  args: {
    variant: "tone-1",
    padding: "md",
    children: <p style={{ margin: 0 }}>tone-1 — static legend chip</p>,
  },
};

export const Tone2: Story = {
  args: {
    variant: "tone-2",
    padding: "md",
    children: <p style={{ margin: 0 }}>tone-2 — static legend chip</p>,
  },
};

export const Tone3: Story = {
  args: {
    variant: "tone-3",
    padding: "md",
    children: <p style={{ margin: 0 }}>tone-3 — static legend chip</p>,
  },
};

export const Tone4: Story = {
  args: {
    variant: "tone-4",
    padding: "md",
    children: <p style={{ margin: 0 }}>tone-4 — static legend chip</p>,
  },
};

export const Tone5: Story = {
  args: {
    variant: "tone-5",
    padding: "md",
    children: <p style={{ margin: 0 }}>tone-5 — static legend chip</p>,
  },
};

/**
 * Tone variants are static chips; use Button tone variants for interactive selection.
 *
 * All variants rendered together for side-by-side comparison
 *
 * Note: tone-1..5 appear at the bottom — they're thin-border static legend chips,
 * not interactive buttons. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Box variant="dark" padding="md">
        <p style={{ margin: 0 }}>dark</p>
      </Box>
      <Box variant="dark-alt" padding="md">
        <p style={{ margin: 0 }}>dark-alt</p>
      </Box>
      <Box variant="dark-accent" padding="md">
        <p style={{ margin: 0 }}>dark-accent</p>
      </Box>
      <Box variant="dark-accent-primary" padding="md">
        <p style={{ margin: 0 }}>dark-accent-primary</p>
      </Box>
      <Box variant="surface" padding="md">
        <p style={{ margin: 0 }}>surface</p>
      </Box>
      <Box variant="elevated" padding="md">
        <p style={{ margin: 0 }}>elevated</p>
      </Box>
      <Box variant="error">
        <p style={{ margin: 0 }}>error</p>
      </Box>
      <Box variant="card" padding="lg">
        <p style={{ margin: 0 }}>card</p>
      </Box>
      <Box variant="divider">
        <p style={{ margin: 0 }}>divider</p>
      </Box>
      <Box variant="header">
        <p style={{ margin: 0 }}>header</p>
      </Box>
      <Box variant="dashed" padding="md">
        <p style={{ margin: 0 }}>dashed</p>
      </Box>
      <Box variant="chip">
        <p style={{ margin: 0 }}>chip</p>
      </Box>
      <Box variant="item" padding="sm">
        <p style={{ margin: 0 }}>item</p>
      </Box>
      <Box variant="pass" padding="md">
        <p style={{ margin: 0 }}>pass</p>
      </Box>
      <Box variant="fail" padding="md">
        <p style={{ margin: 0 }}>fail</p>
      </Box>
      {/* tone-1..5 — static legend chips, not interactive buttons */}
      <Box variant="tone-1" padding="md">
        <p style={{ margin: 0 }}>tone-1</p>
      </Box>
      <Box variant="tone-2" padding="md">
        <p style={{ margin: 0 }}>tone-2</p>
      </Box>
      <Box variant="tone-3" padding="md">
        <p style={{ margin: 0 }}>tone-3</p>
      </Box>
      <Box variant="tone-4" padding="md">
        <p style={{ margin: 0 }}>tone-4</p>
      </Box>
      <Box variant="tone-5" padding="md">
        <p style={{ margin: 0 }}>tone-5</p>
      </Box>
    </div>
  ),
};

/** Padding scale: none, xs, sm, md, lg, xl */
export const PaddingExamples: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Box variant="dark-alt" padding="none">
        <p style={{ margin: 0 }}>padding="none"</p>
      </Box>
      <Box variant="dark-alt" padding="xs">
        <p style={{ margin: 0 }}>padding="xs"</p>
      </Box>
      <Box variant="dark-alt" padding="sm">
        <p style={{ margin: 0 }}>padding="sm"</p>
      </Box>
      <Box variant="dark-alt" padding="md">
        <p style={{ margin: 0 }}>padding="md"</p>
      </Box>
      <Box variant="dark-alt" padding="lg">
        <p style={{ margin: 0 }}>padding="lg"</p>
      </Box>
      <Box variant="dark-alt" padding="xl">
        <p style={{ margin: 0 }}>padding="xl"</p>
      </Box>
    </div>
  ),
};

/** Polymorphic `as` prop example — rendering as a <section> */
export const AsSection: Story = {
  args: {
    variant: "dark-alt",
    padding: "md",
    as: "section",
    children: <p style={{ margin: 0 }}>Rendered as &lt;section&gt; element</p>,
  },
};

/** Custom className merge — adds a bottom margin utility */
export const WithCustomClassName: Story = {
  args: {
    variant: "dark-alt",
    padding: "md",
    className: "mb-lg",
    children: <p style={{ margin: 0 }}>Has className="mb-lg" merged after variant classes</p>,
  },
};
