/**
 * @file pages/learn/phonetic-clusters/PhoneticClustersPage.stories.tsx
 * @description Page-level Storybook stories for Phonetic Clusters
 * Story 21.6: Phonetic Clusters
 *
 * Covers: loading, error, empty, populated states.
 * Uses MSW handlers to simulate API responses.
 * Stories target the container page only — feature components are tested
 * through the page integration (CDD pattern).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PhoneticClustersPage } from "./PhoneticClustersPage";
import { phoneticClustersHandlers } from "../../../mocks/handlers/phonetic-clusters-handlers";
import { withAppLayout, withLearnLayout } from "../../../../.storybook/decorators";

const meta: Meta<typeof PhoneticClustersPage> = {
  title: "Pages/Learn/PhoneticClusters",
  component: PhoneticClustersPage,
  decorators: [withAppLayout("/learn/phonetic-clusters"), withLearnLayout()],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof PhoneticClustersPage>;

export const Loading: Story = {
  parameters: {
    msw: { handlers: [phoneticClustersHandlers.loading()] },
  },
};

export const Error: Story = {
  parameters: {
    msw: { handlers: [phoneticClustersHandlers.error()] },
  },
};

export const Empty: Story = {
  parameters: {
    msw: { handlers: [phoneticClustersHandlers.empty()] },
  },
};

export const Populated: Story = {
  parameters: {
    msw: { handlers: [phoneticClustersHandlers.default()] },
  },
};
