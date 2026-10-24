/**
 * PageShell stories.
 *
 * Demonstrates the per-archetype measure tokens (variant-catalog) + the
 * default state. Rendered without app chrome — PageShell is measure+pad only.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageShell } from "./PageShell";

const meta: Meta<typeof PageShell> = {
  title: "Shared/PageShell",
  component: PageShell,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  argTypes: {
    archetype: {
      control: "select",
      options: [
        "overview",
        "list",
        "detail",
        "create-edit",
        "settings",
        "auth",
        "search",
        "profile",
        "notifications",
        "reports",
        "empty",
        "not-found",
        "wizard",
      ],
    },
    as: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof PageShell>;

const Fill = () => (
  <div
    style={{
      height: "40px",
      border: "1px solid rgba(180,83,9,0.4)",
      borderRadius: 8,
      background: "rgba(180,83,9,0.12)",
    }}
  />
);

export const Default: Story = {
  name: "Default (overview)",
  args: { archetype: "overview" },
  render: (args) => (
    <PageShell {...args}>
      <Fill />
    </PageShell>
  ),
};

export const VariantCatalog: Story = {
  name: "Per-archetype measure",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {(
        [
          "overview",
          "list",
          "detail",
          "create-edit",
          "settings",
          "auth",
          "search",
          "profile",
          "notifications",
          "reports",
          "empty",
          "not-found",
          "wizard",
        ] as const
      ).map((a) => (
        <div key={a}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{a}</div>
          <PageShell archetype={a}>
            <Fill />
          </PageShell>
        </div>
      ))}
    </div>
  ),
};
