import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { RadioGroup } from "./RadioGroup";

const sampleOptions = [
  { value: "option-1", label: "Option 1" },
  { value: "option-2", label: "Option 2" },
  { value: "option-3", label: "Option 3" },
];

const meta: Meta<typeof RadioGroup> = {
  title: "Shared/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    name: { control: "text" },
    value: { control: "text" },
    onChange: { action: "changed" },
    layout: { control: "select", options: ["horizontal", "vertical"] },
    label: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Vertical: Story = {
  name: "RadioGroup — Vertical",
  args: {
    name: "demo-v",
    options: sampleOptions,
    value: null,
    onChange: () => {},
    layout: "vertical",
    label: "Select an option",
  },
};

export const Horizontal: Story = {
  name: "RadioGroup — Horizontal",
  args: {
    name: "demo-h",
    options: sampleOptions,
    value: null,
    onChange: () => {},
    layout: "horizontal",
    label: "Select an option",
  },
};

export const WithSelection: Story = {
  name: "RadioGroup — With Selection",
  args: {
    name: "demo-s",
    options: sampleOptions,
    value: "option-2",
    onChange: () => {},
    layout: "vertical",
    label: "Selected: Option 2",
  },
};

export const WithDisabled: Story = {
  name: "RadioGroup — With Disabled",
  args: {
    name: "demo-d",
    options: [...sampleOptions, { value: "option-4", label: "Disabled Option", disabled: true }],
    value: null,
    onChange: () => {},
    layout: "vertical",
    label: "Choose (one is unavailable)",
  },
};

export const WithInteraction: Story = {
  name: "RadioGroup — Selection Interaction",
  args: {
    name: "interactive",
    options: sampleOptions,
    value: null,
    onChange: () => {},
    layout: "vertical",
    label: "Select an option",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("Option 2"));
  },
};

export const ToneSelector: Story = {
  name: "RadioGroup — Tone Selector Pattern",
  render: () => {
    const tones = [
      { value: "1", label: "1st — mā" },
      { value: "2", label: "2nd — má" },
      { value: "3", label: "3rd — mǎ" },
      { value: "4", label: "4th — mà" },
      { value: "5", label: "Neutral — ma" },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <RadioGroup
          name="tone"
          options={tones}
          value={null}
          onChange={() => {}}
          layout="vertical"
          label="Select the correct tone"
        />
        <RadioGroup
          name="tone-h"
          options={tones.slice(0, 4)}
          value={null}
          onChange={() => {}}
          layout="horizontal"
          label="Tones (horizontal)"
        />
      </div>
    );
  },
};
