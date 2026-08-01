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
    value: { control: { type: "number", min: 0, max: 100 } },
    threshold: { control: { type: "number", min: 0, max: 100 } },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const QuarterWay: Story = {
  args: {
    value: 25,
  },
};

export const HalfWay: Story = {
  args: {
    value: 50,
  },
};

export const AlmostDone: Story = {
  args: {
    value: 83,
  },
};

export const Complete: Story = {
  args: {
    value: 100,
  },
};

export const Empty: Story = {
  args: {
    value: 0,
  },
};
