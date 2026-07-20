import type { Meta, StoryObj } from "@storybook/react-vite";
import { Grid } from "./Grid";
import { Card } from "../Card/Card";

const meta: Meta<typeof Grid> = {
  title: "Shared/Grid",
  component: Grid,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof Grid>;

function makeItems(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => ({
    id: offset + i,
    title: `Item ${offset + i + 1}`,
    desc: `Description for item ${offset + i + 1}`,
  }));
}

export const WithItems: Story = {
  name: "Grid — With Items",
  args: {
    items: makeItems(8),
    total: 45,
    page: 1,
    pageSize: 20,
    renderItem: (item: { id: number; title: string; desc: string }) => (
      <div key={item.id} style={{ width: "100%" }}>
        <Card title={item.title} subtitle={item.desc} />
      </div>
    ),
    onPageChange: () => {},
  },
};

export const Loading: Story = {
  name: "Grid — Loading",
  args: {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    isLoading: true,
    renderItem: () => null,
    onPageChange: () => {},
  },
};

export const Empty: Story = {
  name: "Grid — Empty",
  args: {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    isLoading: false,
    renderItem: () => null,
    onPageChange: () => {},
  },
};

export const SinglePage: Story = {
  name: "Grid — Single Page",
  args: {
    items: makeItems(3),
    total: 3,
    page: 1,
    pageSize: 20,
    renderItem: (item: { id: number; title: string; desc: string }) => (
      <div key={item.id} style={{ width: "100%" }}>
        <Card title={item.title} subtitle={item.desc} />
      </div>
    ),
    onPageChange: () => {},
  },
};

export const LastPage: Story = {
  name: "Grid — Last Page",
  args: {
    items: makeItems(5, 40),
    total: 45,
    page: 3,
    pageSize: 20,
    renderItem: (item: { id: number; title: string; desc: string }) => (
      <div key={item.id} style={{ width: "100%" }}>
        <Card title={item.title} subtitle={item.desc} />
      </div>
    ),
    onPageChange: () => {},
  },
};

export const PaginationVariants: Story = {
  name: "Pagination — States",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {[
        { label: "First page:", page: 1 },
        { label: "Middle page:", page: 2 },
        { label: "Last page:", page: 3 },
      ].map(({ label, page }) => (
        <div key={page}>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
            {label}
          </p>
          <Grid
            items={page < 3 ? makeItems(8) : makeItems(5, 40)}
            total={45}
            page={page}
            pageSize={20}
            renderItem={(item) => (
              <div key={item.id} style={{ width: "100%" }}>
                <Card title={item.title} subtitle={item.desc} />
              </div>
            )}
            onPageChange={() => {}}
          />
        </div>
      ))}
    </div>
  ),
};
