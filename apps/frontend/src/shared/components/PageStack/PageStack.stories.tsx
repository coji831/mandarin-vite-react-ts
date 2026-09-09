/**
 * PageStack stories.
 *
 * Demonstrates the three section-rhythm tiers (variant-catalog). Each child
 * block stands in for a page section (focal card, section, grid, etc.).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageStack } from "./PageStack";

const meta: Meta<typeof PageStack> = {
  title: "Shared/PageStack",
  component: PageStack,
  tags: ["autodocs"],
  argTypes: {
    size: { control: "select", options: ["sm", "default", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof PageStack>;

const Section = ({ label }: { label: string }) => (
  <div
    style={{
      height: "48px",
      display: "flex",
      alignItems: "center",
      paddingInline: 16,
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      background: "rgba(28,25,23,0.6)",
      color: "rgba(255,255,255,0.85)",
      fontSize: 13,
    }}
  >
    {label}
  </div>
);

export const Default: Story = {
  args: { size: "default" },
  render: (args) => (
    <PageStack {...args}>
      <Section label="PageHeader region" />
      <Section label="Focal card / section" />
      <Section label="PageGrid of cards" />
    </PageStack>
  ),
};

export const VariantCatalog: Story = {
  name: "Rhythm tiers",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {(["sm", "default", "lg"] as const).map((s) => (
        <div key={s}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
            size={s}
          </div>
          <PageStack size={s}>
            <Section label={`section A (${s})`} />
            <Section label={`section B (${s})`} />
          </PageStack>
        </div>
      ))}
    </div>
  ),
};
