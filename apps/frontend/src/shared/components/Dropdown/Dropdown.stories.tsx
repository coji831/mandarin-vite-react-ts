import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { Dropdown } from "./Dropdown";

const meta: Meta<typeof Dropdown> = {
  title: "Shared/Dropdown",
  component: Dropdown,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    value: { control: "text" },
    onChange: { action: "changed" },
    label: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

const sampleOptions = [
  { value: 1, label: "Option 1" },
  { value: 2, label: "Option 2" },
  { value: 3, label: "Option 3" },
];

export const Default: Story = {
  args: {
    value: 1,
    onChange: () => {},
    options: sampleOptions,
    label: "Select option",
  },
};

export const WithNullOption: Story = {
  args: {
    value: null,
    onChange: () => {},
    options: [{ value: null, label: "All items" }, ...sampleOptions],
    label: "Filter by",
  },
};

export const WithInteraction: Story = {
  name: "Dropdown — Open and Select",
  args: {
    value: null,
    onChange: () => {},
    options: sampleOptions,
    label: "Select option",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByText("Select...");
    await userEvent.click(trigger);
    const option = await canvas.findByText("Option 2");
    await userEvent.click(option);
  },
};
