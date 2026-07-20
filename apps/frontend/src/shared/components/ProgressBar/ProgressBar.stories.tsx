/**
 * Tokens used: --gradient-success, --color-warning, --radius-sm
 * See: DESIGN.md
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressBar } from "./ProgressBar";

const meta: Meta<typeof ProgressBar> = {
  title: "Shared/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    current: { control: { type: "number", min: 0 } },
    total: { control: { type: "number", min: 1 } },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const QuarterWay: Story = {
  args: {
    current: 3,
    total: 12,
  },
};

export const HalfWay: Story = {
  args: {
    current: 6,
    total: 12,
  },
};

export const AlmostDone: Story = {
  args: {
    current: 10,
    total: 12,
  },
};

export const Complete: Story = {
  args: {
    current: 12,
    total: 12,
  },
};

export const Empty: Story = {
  args: {
    current: 0,
    total: 10,
  },
};
