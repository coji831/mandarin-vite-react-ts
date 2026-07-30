/**
 * @file components/ClassificationBadge.stories.tsx
 * @description Storybook stories for ClassificationBadge — shared pill badge for character classification types
 * Story 21.15: Pictograph Classification Badges
 *
 * Covers:
 * - All 4 classification type variants (pictograph, phono_semantic, compound_ideograph, ideograph)
 * - Pictograph with etymology tooltip
 * - Null classification (renders nothing)
 * - Size variants (sm, md, lg)
 * - showLabel={false} variant
 *
 * Tokens used: --color-xp, --color-blue, --color-green, --color-purple, --radius-pill, --space-xs
 * See: DESIGN.md
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { ClassificationBadge } from "./ClassificationBadge";

const meta: Meta<typeof ClassificationBadge> = {
  title: "Shared/ClassificationBadge",
  component: ClassificationBadge,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    classification: {
      control: "select",
      options: ["pictograph", "phono_semantic", "compound_ideograph", "ideograph", null],
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
    showLabel: { control: "boolean" },
    etymology: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof ClassificationBadge>;

export const Pictograph: Story = {
  args: {
    classification: "pictograph",
  },
};

export const PhonoSemantic: Story = {
  args: {
    classification: "phono_semantic",
  },
};

export const CompoundIdeograph: Story = {
  args: {
    classification: "compound_ideograph",
  },
};

export const Ideograph: Story = {
  args: {
    classification: "ideograph",
  },
};

export const PictographWithEtymology: Story = {
  args: {
    classification: "pictograph",
    etymology: "A pictograph of the sun — a circle with a horizontal line through it",
  },
};

export const NullClassification: Story = {
  args: {
    classification: null,
  },
};

export const SizeSmall: Story = {
  args: {
    classification: "pictograph",
    size: "sm",
  },
};

export const SizeMedium: Story = {
  args: {
    classification: "pictograph",
    size: "md",
  },
};

export const SizeLarge: Story = {
  args: {
    classification: "pictograph",
    size: "lg",
  },
};

export const NoLabel: Story = {
  args: {
    classification: "pictograph",
    showLabel: false,
  },
};
