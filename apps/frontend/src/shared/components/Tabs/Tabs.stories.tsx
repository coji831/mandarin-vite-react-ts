import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import React from "react";
import { Tabs } from "./Tabs";

const sampleTabs = [
  { id: "all", label: "All", icon: "📋" },
  { id: "articles", label: "Articles", icon: "📄" },
  { id: "images", label: "Images", icon: "🖼️" },
  { id: "videos", label: "Videos", icon: "🎬" },
  { id: "files", label: "Files", icon: "📁" },
];

const meta: Meta<typeof Tabs> = {
  title: "Shared/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    activeTab: { control: "text" },
    onTabChange: { action: "tabChanged" },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

function PanelPlaceholder({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "var(--space-md)",
        background: "var(--surface-dark-alt)",
        borderRadius: "var(--radius-md)",
        color: "var(--text-secondary)",
        minHeight: "120px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {label} content
    </div>
  );
}

export const Default: Story = {
  name: "Default — First Tab Active With Panel",
  args: {
    tabs: sampleTabs,
    activeTab: "all",
    onTabChange: () => {},
  },
  render: (args) => (
    <Tabs {...args}>
      <PanelPlaceholder label="All" />
    </Tabs>
  ),
};

export const ActiveTab: Story = {
  name: "Active Tab — Images Active With Panel",
  args: {
    tabs: sampleTabs,
    activeTab: "images",
    onTabChange: () => {},
  },
  render: (args) => (
    <Tabs {...args}>
      <PanelPlaceholder label="Images" />
    </Tabs>
  ),
};

export const WithLockedTabs: Story = {
  name: "With Locked — Videos & Files Locked",
  args: {
    tabs: sampleTabs,
    activeTab: "all",
    onTabChange: () => {},
    lockedTabs: ["videos", "files"],
    getLockPhase: (id: string) => (id === "videos" ? 3 : id === "files" ? 4 : null),
  },
  render: (args) => (
    <Tabs {...args}>
      <PanelPlaceholder label="All" />
    </Tabs>
  ),
};

export const ManyTabs: Story = {
  name: "Scrollable — 15 Tabs",
  args: {
    tabs: Array.from({ length: 15 }, (_, i) => ({
      id: `tab-${i}`,
      label: `Tab ${i + 1}`,
      icon: i % 2 === 0 ? "🔹" : undefined,
    })),
    activeTab: "tab-0",
    onTabChange: () => {},
  },
  render: (args) => (
    <Tabs {...args}>
      <PanelPlaceholder label="Tab 1" />
    </Tabs>
  ),
};

export const NoPanel: Story = {
  name: "No Panel — Tab Bar Only",
  args: {
    tabs: sampleTabs,
    activeTab: "all",
    onTabChange: () => {},
  },
};

export const AlignCenter: Story = {
  name: "Align Center — Centered Tabs",
  args: {
    tabs: sampleTabs,
    activeTab: "all",
    onTabChange: () => {},
    align: "center",
  },
  render: (args) => (
    <Tabs {...args}>
      <PanelPlaceholder label="All" />
    </Tabs>
  ),
};

export const WithInteraction: Story = {
  name: "Tab Switch Interaction",
  args: {
    tabs: sampleTabs,
    activeTab: "all",
    onTabChange: () => {},
  },
  render: (args) => (
    <Tabs {...args}>
      <PanelPlaceholder label={args.activeTab === "all" ? "All" : "Articles"} />
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const articlesTab = canvas.getByRole("tab", { name: /articles/i });
    await userEvent.click(articlesTab);
  },
};
