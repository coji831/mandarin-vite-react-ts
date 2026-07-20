import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { SearchInput } from "./SearchInput";

const meta: Meta<typeof SearchInput> = {
  title: "Shared/SearchInput",
  component: SearchInput,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    value: { control: "text" },
    onChange: { action: "changed" },
    placeholder: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

export const Empty: Story = {
  name: "SearchInput — Empty",
  args: {
    value: "",
    placeholder: "Search...",
    onChange: () => {},
  },
};

export const WithQuery: Story = {
  name: "SearchInput — With Query",
  args: {
    value: "search term",
    placeholder: "Search...",
    onChange: () => {},
  },
};

export const CustomPlaceholder: Story = {
  name: "SearchInput — Custom Placeholder",
  args: {
    value: "",
    placeholder: "Type to filter...",
    onChange: () => {},
  },
};

export const WithInteraction: Story = {
  name: "SearchInput — Typing Interaction",
  args: {
    value: "",
    placeholder: "Search...",
    onChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "search term");
  },
};
