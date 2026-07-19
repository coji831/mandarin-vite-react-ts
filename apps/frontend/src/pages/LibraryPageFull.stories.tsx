import type { Meta, StoryObj } from "@storybook/react-vite";
import LibraryPage from "./LibraryPage";

const meta: Meta<typeof LibraryPage> = {
  title: "Pages/Library",
  component: LibraryPage,
  parameters: { layout: "fullscreen", layoutType: "app", layoutPath: "/library" },
};

export default meta;
type Story = StoryObj<typeof LibraryPage>;

export const Default: Story = {};
