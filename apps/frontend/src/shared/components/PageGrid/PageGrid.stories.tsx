/**
 * PageGrid stories.
 *
 * Demonstrates column + gutter variants (variant-catalog). Child tiles stand
 * in for cards — PageGrid is the card home, children set no grid placement.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageGrid } from "./PageGrid";

const meta: Meta<typeof PageGrid> = {
  title: "Shared/PageGrid",
  component: PageGrid,
  tags: ["autodocs"],
  argTypes: {
    columns: { control: { type: "select", options: [1, 2, 3, 4] } },
    gutter: { control: { type: "select", options: ["sm", "default", "lg"] } },
  },
};

export default meta;
type Story = StoryObj<typeof PageGrid>;

const Tile = ({ label }: { label: string }) => (
  <div
    style={{
      height: "64px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      background: "rgba(28,25,23,0.6)",
      color: "rgba(255,255,255,0.85)",
      fontSize: 12,
    }}
  >
    {label}
  </div>
);

const Tiles = ({ n }: { n: number }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <div key={i} role="listitem">
        <Tile label={`card ${i + 1}`} />
      </div>
    ))}
  </>
);

export const Default: Story = {
  name: "Cards (3-col)",
  args: { columns: 3, gutter: "default" },
  render: (args) => (
    <PageGrid {...args}>
      <Tiles n={6} />
    </PageGrid>
  ),
};

export const Tiles4Col: Story = {
  name: "Tiles (4-col)",
  args: { columns: 4, gutter: "default" },
  render: (args) => (
    <PageGrid {...args}>
      <Tiles n={4} />
    </PageGrid>
  ),
};

export const Wide2Col: Story = {
  name: "Wide (2-col)",
  args: { columns: 2, gutter: "lg" },
  render: (args) => (
    <PageGrid {...args}>
      <Tiles n={4} />
    </PageGrid>
  ),
};

export const VariantCatalog: Story = {
  name: "Gutter tiers",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {(["sm", "default", "lg"] as const).map((g) => (
        <div key={g}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
            gutter={g}
          </div>
          <PageGrid columns={4} gutter={g}>
            <Tiles n={4} />
          </PageGrid>
        </div>
      ))}
    </div>
  ),
};
