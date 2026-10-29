/**
 * LibraryPage stories.
 *
 * The page reads the REAL content APIs since the §5 rework (radicals + grammar +
 * chengyu list endpoints composed into one `ContentSource`), so its states are
 * API states: populated (default), loading, empty and error. The mock content
 * source is gone — a library you cannot open anything from is the bug this
 * replaced.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import LibraryPage from "./LibraryPage";
import { clearLibraryContentCache } from "features/library";

const API = "http://localhost:3001/api/v1";

const RADICALS = [
  {
    id: "rad_0001",
    glyph: "一",
    alternateGlyphs: [],
    namePinyin: "yī",
    nameChinese: "一",
    meaning: "one",
    strokeCount: 1,
    isRecommended: true,
    kangxiIndex: 1,
    metadata: {},
  },
  {
    id: "rad_0009",
    glyph: "人",
    alternateGlyphs: [],
    namePinyin: "rén",
    nameChinese: "人",
    meaning: "person",
    strokeCount: 2,
    isRecommended: true,
    kangxiIndex: 9,
    metadata: {},
  },
];

const GRAMMAR = {
  items: [
    {
      id: "gr_0005",
      name: "吗 yes/no questions",
      structure: "Statement + 吗？",
      phase: 2,
      hskLevel: 1,
      sortOrder: 5,
      exampleCount: 3,
      previewExample: "你好吗？",
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

const CHENGYU = {
  items: [
    {
      id: "cy_0001",
      chengyu: "一举两得",
      pinyin: "yī jǔ liǎng dé",
      literalMeaning: "one move, two gains",
      figurativeMeaning: "kill two birds with one stone",
      era: "Warring States",
      theme: "strategy",
      sortOrder: 1,
      exampleCount: 1,
      previewExample: "这样做一举两得。",
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

const populatedHandlers = () => [
  http.get(`${API}/radicals`, () => HttpResponse.json(RADICALS, { status: 200 })),
  http.get(`${API}/grammar/patterns`, () => HttpResponse.json(GRAMMAR, { status: 200 })),
  http.get(`${API}/chengyu/idioms`, () => HttpResponse.json(CHENGYU, { status: 200 })),
];

const meta: Meta<typeof LibraryPage> = {
  title: "Pages/Library",
  component: LibraryPage,
  tags: ["pages-list"],
  parameters: {
    layout: "fullscreen",
    layoutType: "app",
    layoutPath: "/library",
  },
  beforeEach: () => {
    // The source memoizes the union of three endpoints — reset it per story.
    clearLibraryContentCache();
  },
};

export default meta;
type Story = StoryObj<typeof LibraryPage>;

/** Populated: one radical, one grammar pattern, one idiom — all openable. */
export const Default: Story = {
  parameters: { msw: { handlers: populatedHandlers() } },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${API}/radicals`, () => new Promise(() => {})),
        http.get(`${API}/grammar/patterns`, () => new Promise(() => {})),
        http.get(`${API}/chengyu/idioms`, () => new Promise(() => {})),
      ],
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${API}/radicals`, () => HttpResponse.json([], { status: 200 })),
        http.get(`${API}/grammar/patterns`, () =>
          HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }, { status: 200 }),
        ),
        http.get(`${API}/chengyu/idioms`, () =>
          HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }, { status: 200 }),
        ),
      ],
    },
  },
};

/** Error: every source fails — the browser surfaces the retry screen. */
export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${API}/radicals`, () => HttpResponse.json({ error: "down" }, { status: 500 })),
        http.get(`${API}/grammar/patterns`, () =>
          HttpResponse.json({ error: "down" }, { status: 500 }),
        ),
        http.get(`${API}/chengyu/idioms`, () =>
          HttpResponse.json({ error: "down" }, { status: 500 }),
        ),
      ],
    },
  },
};
