/**
 * EmptyState stories.
 *
 * Covers the states registered in component-registry.json:
 * default / with-icon / with-action.
 * The WithIcon story carries a play assertion — the storybook vitest project
 * runs it as a story test.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within } from "storybook/test";
import { EmptyState } from "./EmptyState";
import { Button } from "../Button/Button";

const meta: Meta<typeof EmptyState> = {
  title: "Shared/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    icon: { control: "select" },
    title: { control: "text" },
    description: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  name: "Default",
  args: {
    title: "No recent activity yet",
    description: "Start learning to see your progress here.",
  },
};

export const WithIcon: Story = {
  name: "With Icon",
  args: {
    icon: "search-x",
    title: "No content found",
    description: "Try adjusting your search or filters to discover more content.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByText("No content found");
    if (!canvasElement.querySelector("svg")) {
      throw new Error("empty state must render its icon");
    }
  },
};

export const WithAction: Story = {
  name: "With Action",
  args: {
    icon: "book",
    title: "Nothing here yet",
    description: "Pick up where you left off.",
  },
  render: (args) => (
    <EmptyState {...args}>
      <Button variant="secondary" size="sm">
        Clear all filters
      </Button>
    </EmptyState>
  ),
};
