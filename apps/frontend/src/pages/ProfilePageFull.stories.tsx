/**
 * ProfilePage stories.
 *
 * NOTE (State Parity): ProfilePage is a thin placeholder (no API fetch on
 * mount), so Loading/Error/Empty API states would be unreachable. Default-only
 * is the complete set of reachable states. Full profile implementation is a
 * future follow-up (epic 25/39 shell family); this Full story reserves the
 * utility archetype contract.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProfilePage } from "./ProfilePage";

const meta: Meta<typeof ProfilePage> = {
  title: "Pages/Profile",
  component: ProfilePage,
  tags: ["pages-utility"],
  parameters: {
    layout: "fullscreen",
    layoutType: "app",
    layoutPath: "/profile",
  },
};

export default meta;
type Story = StoryObj<typeof ProfilePage>;

export const Default: Story = {};
