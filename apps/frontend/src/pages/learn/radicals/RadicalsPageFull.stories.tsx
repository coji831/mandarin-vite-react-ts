import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadicalsPage } from "./RadicalsPage";
import { mswHandlers } from "../../../../.storybook/msw-handlers";

const PHASE2 = [mswHandlers.progression.phaseGate(2), mswHandlers.radicals.default()];
const PHASE3 = [
  mswHandlers.progression.phaseGate(3),
  mswHandlers.radicals.default(),
  mswHandlers.progression.radicalProgress.default(),
];

const meta: Meta<typeof RadicalsPage> = {
  title: "Pages/Learn/Radicals",
  component: RadicalsPage,
  parameters: { layout: "fullscreen", layoutType: "learn", layoutPath: "/learn/radicals" },
};

export default meta;
type Story = StoryObj<typeof RadicalsPage>;

export const Loading: Story = {
  name: "Loading",
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(2), mswHandlers.radicals.loading()] },
  },
};

export const Error: Story = {
  name: "Error",
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(2), mswHandlers.radicals.error()] },
  },
};

export const Browse: Story = {
  name: "Browse tab",
  parameters: { msw: { handlers: PHASE2 } },
};

export const BrowseWithRadical: Story = {
  name: "Browse tab — radical selected",
  parameters: {
    layoutPath: "/learn/radicals?radical=rad_0001",
    msw: { handlers: PHASE2 },
  },
};

export const Trees: Story = {
  name: "Trees tab",
  parameters: {
    layoutPath: "/learn/radicals?view=trees",
    msw: { handlers: PHASE3 },
  },
};
