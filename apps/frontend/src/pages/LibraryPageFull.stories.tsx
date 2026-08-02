/**
 * LibraryPage stories.
 *
 * NOTE (State Parity): LibraryPage does NOT fetch on mount — it renders
 * ContentBrowser with a synchronous mock content source (createMockContentSource),
 * so there is no Loading/Error/Empty API state to simulate. Default-only is the
 * complete set of reachable states.
 */
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
