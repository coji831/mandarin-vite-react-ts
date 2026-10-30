/**
 * NotFoundPage stories.
 *
 * NOTE (State Parity): NotFoundPage is static (no fetch, no params), so there
 * is exactly one reachable state — a 404 is always the same surface. The
 * `layoutPath` is an unmapped URL on purpose: that is the address class this
 * page exists to answer.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { NotFoundPage } from "./NotFoundPage";

const meta: Meta<typeof NotFoundPage> = {
  title: "Pages/NotFound",
  component: NotFoundPage,
  tags: ["pages-not-found"],
  parameters: {
    layout: "fullscreen",
    layoutType: "app",
    layoutPath: "/this-route-does-not-exist",
  },
};

export default meta;
type Story = StoryObj<typeof NotFoundPage>;

export const Default: Story = {};
