import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Shared/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: { control: "select", options: ["line", "card", "circle", "custom"] },
    width: { control: "text" },
    height: { control: "text" },
    count: { control: { type: "number", min: 1, max: 20 } },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Line: Story = {
  name: "Skeleton — Line",
  args: {
    variant: "line",
    count: 3,
  },
};

export const Card: Story = {
  name: "Skeleton — Card",
  args: {
    variant: "card",
    count: 4,
  },
};

export const Circle: Story = {
  name: "Skeleton — Circle",
  args: {
    variant: "circle",
    count: 3,
    width: "40px",
    height: "40px",
  },
};

export const Mixed: Story = {
  name: "Skeleton — Mixed Layout",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Skeleton variant="circle" width="40px" height="40px" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton variant="line" width="60%" />
          <Skeleton variant="line" width="40%" height="12px" />
        </div>
      </div>
      <Skeleton variant="card" height="100px" />
      <Skeleton variant="line" count={2} />
    </div>
  ),
};

export const GridLayout: Story = {
  name: "Skeleton — Grid Layout",
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16,
      }}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton variant="card" height="100px" />
          <Skeleton variant="line" width="70%" height="14px" />
          <Skeleton variant="line" width="50%" height="12px" />
        </div>
      ))}
    </div>
  ),
};
