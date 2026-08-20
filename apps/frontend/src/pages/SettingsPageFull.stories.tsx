/**
 * SettingsPage stories.
 *
 * NOTE (State Parity): SettingsPage is a thin placeholder (no API fetch on
 * mount), so Loading/Error/Empty API states would be unreachable. Default-only
 * is the complete set of reachable states. Full settings implementation is a
 * future follow-up (epic 25/39 shell family); this Full story reserves the
 * utility archetype contract.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsPage } from "./SettingsPage";

const meta: Meta<typeof SettingsPage> = {
  title: "Pages/Settings",
  component: SettingsPage,
  tags: ["pages-utility"],
  parameters: {
    layout: "fullscreen",
    layoutType: "app",
    layoutPath: "/settings",
  },
};

export default meta;
type Story = StoryObj<typeof SettingsPage>;

export const Default: Story = {};
