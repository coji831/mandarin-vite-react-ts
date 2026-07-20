/**
 * Tokens used: --color-primary, --surface-card, --radius-pill, --transition-fast
 * See: DESIGN.md
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilterChip } from "./FilterChip";

const meta: Meta<typeof FilterChip> = {
  title: "Shared/FilterChip",
  component: FilterChip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    label: { control: "text" },
    selected: { control: "boolean" },
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof FilterChip>;

export const Unselected: Story = {
  args: {
    label: "Radical",
    selected: false,
  },
};

export const Selected: Story = {
  args: {
    label: "Radical",
    selected: true,
  },
};

export const MultipleChips: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <FilterChip label="All" selected={true} onClick={() => {}} />
      <FilterChip label="Pinyin" selected={false} onClick={() => {}} />
      <FilterChip label="Tones" selected={false} onClick={() => {}} />
      <FilterChip label="Radicals" selected={false} onClick={() => {}} />
    </div>
  ),
};
