/**
 * PageHeader stories.
 *
 * Covers the 4 states registered in component-registry.json:
 * default / with-description / with-cta / with-eyebrow.
 * The Default story carries a play assertion (h1 renders) — the storybook
 * vitest project runs it as a story test.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within } from "storybook/test";
import { PageHeader } from "./PageHeader";
import { Button } from "../Button/Button";

const meta: Meta<typeof PageHeader> = {
  title: "Shared/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    title: { control: "text" },
    eyebrow: { control: "text" },
    description: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: { title: "Dashboard" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("heading", { level: 1, name: "Dashboard" });
  },
};

export const WithEyebrow: Story = {
  name: "With Eyebrow",
  args: {
    eyebrow: "Phase 2 · The Core 300",
    title: "Welcome back",
  },
};

export const WithDescription: Story = {
  name: "With Description",
  args: {
    title: "Welcome to PinyinPal!",
    description: "Start learning Mandarin — no account needed",
  },
};

export const WithCta: Story = {
  name: "With CTA",
  args: {
    title: "Welcome back",
    description: "Pick up where you left off.",
  },
  render: (args) => (
    <PageHeader {...args}>
      <Button variant="primary">Continue Learning ▸</Button>
    </PageHeader>
  ),
};
