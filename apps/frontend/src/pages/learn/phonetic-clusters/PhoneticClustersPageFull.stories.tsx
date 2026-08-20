/**
 * PhoneticClustersPage stories.
 *
 * NOTE (State Parity): PhoneticClustersPage fetches `/phonetic-clusters` on
 * mount via `usePhoneticClusters`, so Loading/Empty/Error are reachable API
 * states covered below. Uses the canonical `.storybook` MSW handlers (the
 * page container is the story target — CDD pattern).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PhoneticClustersPage } from "./PhoneticClustersPage";
import { mswHandlers } from "../../../../.storybook/msw-handlers";

const meta: Meta<typeof PhoneticClustersPage> = {
  title: "Pages/Learn/PhoneticClusters/Full",
  component: PhoneticClustersPage,
  tags: ["pages-browse-index"],
  parameters: {
    layout: "fullscreen",
    layoutType: "learn",
    layoutPath: "/learn/phonetic-clusters",
  },
};

export default meta;
type Story = StoryObj<typeof PhoneticClustersPage>;

export const Loading: Story = {
  parameters: {
    msw: { handlers: [mswHandlers.phoneticClusters.loading()] },
  },
};

export const Default: Story = {
  parameters: {
    msw: { handlers: [mswHandlers.phoneticClusters.default()] },
  },
};

export const Empty: Story = {
  parameters: {
    msw: { handlers: [mswHandlers.phoneticClusters.empty()] },
  },
};

export const Error: Story = {
  parameters: {
    msw: { handlers: [mswHandlers.phoneticClusters.error()] },
  },
};
