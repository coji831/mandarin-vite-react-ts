/**
 * Icon stories.
 *
 * Covers the states registered in component-registry.json:
 * default / decorative / with-title / sizes.
 * The Decorative story carries a play assertion (aria-hidden) — the storybook
 * vitest project runs it as a story test.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within } from "storybook/test";
import { Icon } from "./Icon";

const meta: Meta<typeof Icon> = {
  title: "Shared/Icon",
  component: Icon,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    name: {
      control: "select",
      options: [
        "dashboard",
        "learn",
        "practice",
        "progress",
        "settings",
        "lock",
        "unlock",
        "check",
        "cross",
        "edit",
        "book",
        "flame",
        "home",
        "audio",
        "volume-mute",
        "play",
        "pause",
        "star",
        "stop",
        "tree",
        "chevron-down",
        "chevron-left",
        "chevron-right",
        "arrow-right",
        "search",
        "search-x",
        "sparkles",
        "letters",
        "radicals",
        "grammar",
        "chengyu",
        "quiz",
        "review",
        "save",
        "refresh",
        "image",
        "puzzle",
        "zap",
        "activity",
      ],
    },
    size: { control: "select", options: [16, 20, 24] },
    strokeWidth: { control: "number" },
    label: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

/** Default — decorative, 20px, aria-hidden (meaningless). */
export const Default: Story = {
  args: { name: "dashboard" },
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg")!;
    if (svg.getAttribute("aria-hidden") !== "true") {
      throw new Error("decorative Icon must be aria-hidden");
    }
  },
};

/** Decorative — aria-hidden true, no accessible title. */
export const Decorative: Story = {
  args: { name: "lock", size: 20 },
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg")!;
    if (svg.getAttribute("aria-hidden") !== "true") {
      throw new Error("decorative Icon must be aria-hidden");
    }
  },
};

/** With title — role="img" + accessible <title> (meaningful). */
export const WithTitle: Story = {
  name: "With Title",
  args: { name: "search", label: "Search" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const svg = canvas.getByRole("img").closest("svg")!;
    if (!svg.querySelector("title")) {
      throw new Error("meaningful Icon must render an accessible <title>");
    }
  },
};

/** Sizes — the sanctioned 16 / 20 / 24 range (ADR-010). */
export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon name="flame" size={16} label="16px" />
      <Icon name="flame" size={20} label="20px" />
      <Icon name="flame" size={24} label="24px" />
    </div>
  ),
};
