import type { Meta, StoryObj } from "@storybook/react-vite";
import { FoundationsPage } from "./FoundationsPage";
import { mswHandlers } from "../../../../.storybook/msw-handlers";

const meta: Meta<typeof FoundationsPage> = {
  title: "Pages/Learn/Foundations",
  component: FoundationsPage,
  parameters: { layout: "fullscreen", layoutType: "learn", layoutPath: "/learn" },
};

export default meta;
type Story = StoryObj<typeof FoundationsPage>;

export const PinyinTab: Story = {
  name: "Pinyin",
  args: { initialTab: "pinyin" },
  parameters: {
    msw: { handlers: [...mswHandlers.foundations.default(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const TonesTab: Story = {
  name: "Tones",
  args: { initialTab: "tones" },
  parameters: {
    msw: { handlers: [...mswHandlers.foundations.default(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const Strokes: Story = {
  name: "Strokes",
  args: { initialTab: "strokes" },
  parameters: {
    msw: { handlers: [...mswHandlers.foundations.default(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const Animations: Story = {
  name: "Animations",
  args: { initialTab: "animations" },
  parameters: {
    msw: { handlers: [...mswHandlers.foundations.default(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const PinyinLoading: Story = {
  args: { initialTab: "pinyin" },
  parameters: {
    msw: {
      handlers: [...mswHandlers.foundations.loading(), mswHandlers.progression.phaseGate(2)],
    },
  },
};

export const PinyinError: Story = {
  args: { initialTab: "pinyin" },
  parameters: {
    msw: {
      handlers: [...mswHandlers.foundations.error(), mswHandlers.progression.phaseGate(2)],
    },
  },
};

export const TonesLoading: Story = {
  args: { initialTab: "tones" },
  parameters: {
    msw: {
      handlers: [...mswHandlers.foundations.loading(), mswHandlers.progression.phaseGate(2)],
    },
  },
};

export const TonesError: Story = {
  args: { initialTab: "tones" },
  parameters: {
    msw: {
      handlers: [...mswHandlers.foundations.error(), mswHandlers.progression.phaseGate(2)],
    },
  },
};
