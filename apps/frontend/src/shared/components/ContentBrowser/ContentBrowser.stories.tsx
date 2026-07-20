import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { ContentBrowser } from "./ContentBrowser";
import type { ContentItem, ContentSource } from "./types";

/**
 * Mock content source for Storybook stories.
 * Returns sample content items with an optional delay to simulate loading.
 */
function createMockSource(items: ContentItem[], delayMs = 0): ContentSource {
  return {
    getItems: async (params) => {
      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
      const filtered = params.contentType
        ? items.filter((item) => item.contentType === params.contentType)
        : items;
      return {
        items: filtered.slice(0, params.pageSize),
        total: filtered.length,
      };
    },
  };
}

const sampleItems: ContentItem[] = [
  {
    id: "1",
    contentType: "foundations",
    title: "你好",
    subtitle: "nǐ hǎo",
    translation: "Hello",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "2",
    contentType: "foundations",
    title: "谢谢",
    subtitle: "xiè xiè",
    translation: "Thank you",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "3",
    contentType: "radical",
    title: "人",
    subtitle: "rén",
    translation: "Person / Human",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "4",
    contentType: "radical",
    title: "水",
    subtitle: "shuǐ",
    translation: "Water",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "5",
    contentType: "phonetic",
    title: "吗",
    subtitle: "ma",
    translation: "Question particle",
    hskLevel: 1,
    phase: 3,
  },
  {
    id: "6",
    contentType: "reader",
    title: "小明的故事",
    subtitle: "Xiǎo Míng de gùshì",
    translation: "Xiao Ming's Story",
    hskLevel: 2,
    phase: 3,
  },
];

const defaultSource = createMockSource(sampleItems, 100);

const meta: Meta<typeof ContentBrowser> = {
  title: "Shared/ContentBrowser",
  component: ContentBrowser,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/browse"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ContentBrowser>;

export const Default: Story = {
  name: "ContentBrowser — Default",
  args: {
    contentSource: defaultSource,
    defaultTab: "all",
    userPhase: 4,
  },
};

export const Empty: Story = {
  name: "ContentBrowser — Empty",
  args: {
    contentSource: createMockSource([]),
    defaultTab: "all",
    userPhase: 4,
  },
};

export const Phase1Only: Story = {
  name: "ContentBrowser — Phase 1",
  args: {
    contentSource: defaultSource,
    defaultTab: "all",
    userPhase: 1,
  },
};
