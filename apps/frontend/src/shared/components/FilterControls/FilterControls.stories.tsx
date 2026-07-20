import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilterControls } from "./FilterControls";

const sampleFilters = [
  {
    id: "category",
    label: "Category",
    value: null,
    options: [
      { value: null, label: "All categories" },
      { value: "design", label: "Design" },
      { value: "dev", label: "Development" },
      { value: "writing", label: "Writing" },
    ],
    onChange: () => {},
  },
  {
    id: "status",
    label: "Status",
    value: null,
    options: [
      { value: null, label: "All statuses" },
      { value: "published", label: "Published" },
      { value: "draft", label: "Draft" },
      { value: "archived", label: "Archived" },
    ],
    onChange: () => {},
  },
];

const meta: Meta<typeof FilterControls> = {
  title: "Shared/FilterControls",
  component: FilterControls,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof FilterControls>;

export const Default: Story = {
  name: "FilterControls — Default",
  args: {
    filters: sampleFilters,
  },
};

export const WithSelections: Story = {
  name: "FilterControls — With Selections",
  args: {
    filters: [
      { ...sampleFilters[0], value: "dev" },
      { ...sampleFilters[1], value: "published" },
    ],
  },
};

export const SingleFilter: Story = {
  name: "FilterControls — Single",
  args: {
    filters: [sampleFilters[0]],
  },
};

export const ManyFilters: Story = {
  name: "FilterControls — Many Filters",
  args: {
    filters: [
      ...sampleFilters,
      {
        id: "sort",
        label: "Sort by",
        value: null,
        options: [
          { value: null, label: "Default order" },
          { value: "name", label: "Name (A–Z)" },
          { value: "date", label: "Date (newest)" },
        ],
        onChange: () => {},
      },
    ],
  },
};
