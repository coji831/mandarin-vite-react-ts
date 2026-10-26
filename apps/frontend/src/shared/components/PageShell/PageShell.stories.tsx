/**
 * PageShell stories.
 *
 * Demonstrates the per-archetype measure tokens (variant-catalog) + the
 * default state + the paper reading register (ADR-011/ADR-012). Rendered without
 * app chrome — PageShell is measure+pad (+ the declared register) only.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
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
    surface: { control: "select", options: ["instrument", "paper"] },
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

export const ReadingSurface: Story = {
  name: "Reading surface (paper register)",
  parameters: { layout: "fullscreen" },
  args: { archetype: "detail", surface: "paper" },
  play: async ({ canvasElement }) => {
    // The register is a token wiring, so assert the painted result: the paper
    // plane + the paper body ink resolve on the page region (ADR-012).
    const canvas = within(canvasElement);
    const heading = canvas.getByText("黑色的桌子上放着一盏灯。");
    const shell = heading.closest(".page-shell") as HTMLElement;
    expect(shell).toHaveClass("page-surface--paper");
    expect(getComputedStyle(shell).backgroundColor).toBe("rgb(236, 226, 205)");
    expect(getComputedStyle(shell).color).toBe("rgb(42, 35, 27)");
  },
  render: (args) => (
    <div style={{ background: "var(--canvas)", paddingBlock: "var(--space-md)" }}>
      <PageShell {...args}>
        <p
          lang="zh-Hans"
          style={{
            margin: 0,
            fontFamily: "var(--font-hanzi)",
            fontSize: "var(--font-2xl)",
            lineHeight: "var(--lh-relaxed)",
            color: "var(--text-paper-primary)",
          }}
        >
          黑色的桌子上放着一盏灯。
        </p>
        <p
          style={{
            margin: "var(--space-sm) 0 0",
            color: "var(--text-paper-secondary)",
          }}
        >
          Second tier — the translation line under the hanzi.
        </p>
        <p
          style={{
            margin: "var(--space-sm) 0 0",
            fontSize: "var(--font-sm)",
            color: "var(--text-paper-tertiary)",
          }}
        >
          Third tier — the metadata line (4.57:1 on the plane, 5.12:1 on the sheet).
        </p>
        <div
          aria-hidden="true"
          style={{
            marginTop: "var(--space-lg)",
            height: "var(--space-xs)",
            background: "var(--surface-paper-track)",
            border: "1px solid var(--surface-paper-border)",
          }}
        >
          <div
            style={{
              width: "40%",
              height: "100%",
              background: "var(--text-paper-primary)",
            }}
          />
        </div>
      </PageShell>
    </div>
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
