/**
 * @file ReadersPageFull.stories.tsx
 * @description Consolidated page-level Storybook stories for Graded Readers page.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.5: Added reading variants with audio sync.
 *
 * Covers 19+ variants: library (populated, loading, empty, error, filtered, edge)
 * and reading (default, loading, error, short, all-known, all-unknown, long,
 * popover desktop, popover mobile, with audio, audio complete, audio paused).
 *
 * Library variants use MSW handlers (API-driven). Reading variants use MSW
 * handlers for passage detail + withReadingStore decorator for store state.
 * Audio state variants (complete, paused) use custom render with ReadingView
 * for controlled visual state, since useSentenceAudio has internal useState.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { Box } from "shared/components";
import { ReadersPage, ReadingView, SentenceDisplay } from "../../../features/readers";
import type { PassageDetail } from "../../../features/readers";
import { mswHandlers } from "../../../../.storybook/msw-handlers";
import { withGuestAuth, withReadingStore, withAudioStore } from "../../../../.storybook/decorators";

const API_BASE = "http://localhost:3001/api/v1";

// ============================================================================
// Helper — inline MSW handler for passage detail with custom data
// ============================================================================

const API_PASSAGE_DETAIL = `${API_BASE}/readers/passages/:id`;

function passageDetailHandler(data: PassageDetail) {
  return http.get(API_PASSAGE_DETAIL, () =>
    HttpResponse.json({
      data: {
        id: data.id,
        title: data.title,
        hskLevel: data.hskLevel,
        sentences: data.sentences.map((s) => ({
          index: s.index,
          text: s.text,
          pinyin: s.pinyin,
          words: s.words.map((w) => ({
            glyph: w.glyph,
            wordId: `w_${w.glyph}`,
            hskLevel: w.hskLevel ?? null,
            pinyin: w.pinyin ?? null,
            isKnown: w.isKnown,
          })),
        })),
      },
    }),
  );
}

// ============================================================================
// Test data shapes for reading stories
// ============================================================================

const defaultPassageDetail: PassageDetail = {
  id: "p-1",
  title: "我的学校",
  hskLevel: 1,
  sentences: [
    {
      index: 0,
      text: "我今天去学校。",
      pinyin: "Wǒ jīntiān qù xuéxiào。",
      words: [
        { glyph: "我", isKnown: true },
        { glyph: "今天", isKnown: true },
        { glyph: "去", isKnown: true },
        { glyph: "学校", isKnown: false, hskLevel: 1 },
        { glyph: "。", isKnown: true },
      ],
    },
    {
      index: 1,
      text: "我有一个好朋友。",
      pinyin: "Wǒ yǒu yī gè hǎo péngyǒu。",
      words: [
        { glyph: "我", isKnown: true },
        { glyph: "有", isKnown: true },
        { glyph: "一个", isKnown: true },
        { glyph: "好", isKnown: true },
        { glyph: "朋友", isKnown: false, hskLevel: 1 },
        { glyph: "。", isKnown: true },
      ],
    },
    {
      index: 2,
      text: "我们一起学习中文。",
      pinyin: "Wǒmen yīqǐ xuéxí zhōngwén。",
      words: [
        { glyph: "我们", isKnown: true },
        { glyph: "一起", isKnown: true },
        { glyph: "学习", isKnown: false, hskLevel: 1 },
        { glyph: "中文", isKnown: false, hskLevel: 1 },
        { glyph: "。", isKnown: true },
      ],
    },
    {
      index: 3,
      text: "老师很耐心。",
      pinyin: "Lǎoshī hěn nàixīn。",
      words: [
        { glyph: "老师", isKnown: false, hskLevel: 1 },
        { glyph: "很", isKnown: true },
        { glyph: "耐心", isKnown: false, hskLevel: 2 },
        { glyph: "。", isKnown: true },
      ],
    },
    {
      index: 4,
      text: "我喜欢学中文。",
      pinyin: "Wǒ xǐhuān xué zhōngwén。",
      words: [
        { glyph: "我", isKnown: true },
        { glyph: "喜欢", isKnown: false, hskLevel: 1 },
        { glyph: "学", isKnown: true },
        { glyph: "中文", isKnown: false, hskLevel: 1 },
        { glyph: "。", isKnown: true },
      ],
    },
  ],
};

const shortPassageDetail: PassageDetail = {
  id: "p-short",
  title: "你好",
  hskLevel: 1,
  sentences: [
    {
      index: 0,
      text: "你好！",
      pinyin: "Nǐ hǎo!",
      words: [
        { glyph: "你好", isKnown: true },
        { glyph: "！", isKnown: true },
      ],
    },
  ],
};

const allKnownPassageDetail: PassageDetail = {
  id: "p-all-known",
  title: "简单句子",
  hskLevel: 1,
  sentences: [
    {
      index: 0,
      text: "我是学生。",
      pinyin: "Wǒ shì xuéshēng。",
      words: [
        { glyph: "我", isKnown: true },
        { glyph: "是", isKnown: true },
        { glyph: "学生", isKnown: true },
        { glyph: "。", isKnown: true },
      ],
    },
  ],
};

const allUnknownPassageDetail: PassageDetail = {
  id: "p-all-unknown",
  title: "经济学原理",
  hskLevel: 4,
  sentences: [
    {
      index: 0,
      text: "经济学原理",
      pinyin: "Jīngjìxué yuánlǐ",
      words: [
        { glyph: "经济", isKnown: false, hskLevel: 4 },
        { glyph: "学", isKnown: false, hskLevel: 3 },
        { glyph: "原理", isKnown: false, hskLevel: 5 },
      ],
    },
  ],
};

const longPassageDetail: PassageDetail = {
  id: "p-long",
  title: "长篇阅读练习",
  hskLevel: 2,
  sentences: Array.from({ length: 15 }, (_, i) => ({
    ...defaultPassageDetail.sentences[i % defaultPassageDetail.sentences.length],
    index: i,
  })),
};

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: "Pages/Learn/ReadersPage",
  component: ReadersPage,
  parameters: {
    layout: "fullscreen",
    msw: { handlers: [mswHandlers.readers.passages.default()] },
  },
  decorators: [
    (Story: React.FC) => (
      <MemoryRouter initialEntries={["/learn/readers"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    mode: "library",
  },
} satisfies Meta<typeof ReadersPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// LIBRARY MODE VARIANTS
// ============================================================================

export const LibraryPopulated: Story = {
  args: { mode: "library" },
  parameters: { msw: { handlers: [mswHandlers.readers.passages.default()] } },
};

export const LibraryLoading: Story = {
  args: { mode: "library" },
  parameters: { msw: { handlers: [mswHandlers.readers.passages.loading()] } },
};

export const LibraryEmpty: Story = {
  args: { mode: "library" },
  parameters: { msw: { handlers: [mswHandlers.readers.passages.empty()] } },
};

export const LibraryError: Story = {
  args: { mode: "library" },
  parameters: { msw: { handlers: [mswHandlers.readers.passages.error()] } },
};

export const LibraryFilteredByLevel: Story = {
  args: { mode: "library" },
  parameters: { msw: { handlers: [mswHandlers.readers.passages.default()] } },
};

export const LibraryEmptyFilter: Story = {
  args: { mode: "library" },
  parameters: {
    msw: {
      handlers: [
        http.get(`${API_BASE}/readers/passages`, () =>
          HttpResponse.json({ data: [] }, { status: 200 }),
        ),
      ],
    },
  },
};

export const LibraryWithEdgePassages: Story = {
  args: { mode: "library" },
  parameters: {
    msw: {
      handlers: [
        http.get(`${API_BASE}/readers/passages`, () =>
          HttpResponse.json(
            {
              data: [
                { id: "p-e1", title: "你好", hskLevel: 1, knownWordRatio: 95, isBookmarked: true },
                {
                  id: "p-e2",
                  title: "Advanced Classical Chinese Literature Analysis",
                  hskLevel: 6,
                  knownWordRatio: 0,
                },
                {
                  id: "p-e3",
                  title: "一个非常非常长的中文文章标题用来测试文字截断效果",
                  hskLevel: 5,
                  knownWordRatio: 30,
                },
                {
                  id: "p-e4",
                  title: "古典文学",
                  hskLevel: 6,
                  knownWordRatio: 10,
                  isBookmarked: true,
                },
              ],
            },
            { status: 200 },
          ),
        ),
      ],
    },
  },
};

// ============================================================================
// READING MODE VARIANTS
// ============================================================================

export const ReadingDefault: Story = {
  args: { mode: "reading" },
  decorators: [withReadingStore({ mode: "reading", currentPassageId: "p-1" })],
  parameters: {
    msw: {
      handlers: [mswHandlers.readers.passageDetail.default()],
    },
  },
};

export const ReadingLoading: Story = {
  args: { mode: "reading" },
  decorators: [withReadingStore({ mode: "reading", currentPassageId: "p-loading" })],
  parameters: {
    msw: {
      handlers: [mswHandlers.readers.passageDetail.loading()],
    },
  },
};

export const ReadingError: Story = {
  args: { mode: "reading" },
  decorators: [withReadingStore({ mode: "reading", currentPassageId: "p-error" })],
  parameters: {
    msw: {
      handlers: [mswHandlers.readers.passageDetail.error()],
    },
  },
};

export const ReadingShortPassage: Story = {
  args: { mode: "reading" },
  decorators: [withReadingStore({ mode: "reading", currentPassageId: "p-short" })],
  parameters: {
    msw: {
      handlers: [passageDetailHandler(shortPassageDetail)],
    },
  },
};

export const ReadingAllKnownPassage: Story = {
  args: { mode: "reading" },
  decorators: [withReadingStore({ mode: "reading", currentPassageId: "p-all-known" })],
  parameters: {
    msw: {
      handlers: [passageDetailHandler(allKnownPassageDetail)],
    },
  },
};

export const ReadingAllUnknownPassage: Story = {
  args: { mode: "reading" },
  decorators: [withReadingStore({ mode: "reading", currentPassageId: "p-all-unknown" })],
  parameters: {
    msw: {
      handlers: [passageDetailHandler(allUnknownPassageDetail)],
    },
  },
};

export const ReadingLongPassage: Story = {
  args: { mode: "reading" },
  decorators: [withReadingStore({ mode: "reading", currentPassageId: "p-long" })],
  parameters: {
    msw: {
      handlers: [passageDetailHandler(longPassageDetail)],
    },
  },
};

export const ReadingHSK1: Story = {
  args: { mode: "reading" },
  decorators: [withReadingStore({ mode: "reading", currentPassageId: "p-hsk1" })],
  parameters: {
    msw: {
      handlers: [mswHandlers.readers.passageDetail.hsk1()],
    },
  },
};

export const ReadingHSK4: Story = {
  args: { mode: "reading" },
  decorators: [withReadingStore({ mode: "reading", currentPassageId: "p-hsk4" })],
  parameters: {
    msw: {
      handlers: [mswHandlers.readers.passageDetail.hsk4()],
    },
  },
};

export const ReadingHSK6: Story = {
  args: { mode: "reading" },
  decorators: [withReadingStore({ mode: "reading", currentPassageId: "p-hsk6" })],
  parameters: {
    msw: {
      handlers: [mswHandlers.readers.passageDetail.hsk6()],
    },
  },
};

export const ReadingWithWordPopover: Story = {
  args: { mode: "reading" },
  decorators: [
    withReadingStore({
      mode: "reading",
      currentPassageId: "p-1",
      popover: { glyph: "喜欢", position: { x: 300, y: 200 } },
    }),
  ],
  parameters: {
    msw: {
      handlers: [mswHandlers.readers.passageDetail.default()],
    },
  },
};

export const ReadingWithPopoverMobile: Story = {
  args: { mode: "reading" },
  decorators: [
    withReadingStore({
      mode: "reading",
      currentPassageId: "p-1",
      popover: { glyph: "喜欢", position: { x: 100, y: 200 } },
    }),
  ],
  parameters: {
    msw: { handlers: [mswHandlers.readers.passageDetail.default()] },
    viewport: { defaultViewport: "mobile1" },
  },
};

// ============================================================================
// READING MODE VARIANTS — Audio Sync (Story 21.5)
// ============================================================================

export const ReadingWithAudio: Story = {
  name: "Reading — With Audio Sync",
  args: { mode: "reading" },
  decorators: [withReadingStore({ mode: "reading", currentPassageId: "p-1" })],
  parameters: {
    msw: {
      handlers: [
        mswHandlers.readers.passageDetail.default(),
        mswHandlers.readers.passageAudio.default(),
      ],
    },
  },
};

export const ReadingWithAudioLoading: Story = {
  name: "Reading — Audio Loading",
  args: { mode: "reading" },
  decorators: [withReadingStore({ mode: "reading", currentPassageId: "p-1" })],
  parameters: {
    msw: {
      handlers: [
        mswHandlers.readers.passageDetail.default(),
        mswHandlers.readers.passageAudio.loading(),
      ],
    },
  },
};

/**
 * Reading — Audio Guest (optionalAuth): `withGuestAuth` forces the AuthContext
 * to logged-out. Guests and users share ONE fetch path —
 * `buildPassageAudioBehavior` POSTs `POST /v1/readers/passages/:id/audio`
 * (optionalAuth) and renders REAL signed-URL items for every sentence. The
 * audio bar renders URL items off the shared `passageAudio.default()` handler
 * — no TTS short-circuit, no network exemption for guests.
 */
export const ReadingWithAudioGuest: Story = {
  name: "Reading — Audio Guest (optionalAuth, real URLs)",
  args: { mode: "reading" },
  decorators: [withReadingStore({ mode: "reading", currentPassageId: "p-1" }), withGuestAuth],
  parameters: {
    msw: {
      handlers: [
        mswHandlers.readers.passageDetail.default(),
        mswHandlers.readers.passageAudio.default(),
      ],
    },
  },
};

export const ReadingWithAudioComplete: Story = {
  name: "Reading — Audio Complete",
  parameters: {
    msw: {
      handlers: [
        mswHandlers.readers.passageDetail.default(),
        mswHandlers.readers.passageAudio.default(),
      ],
    },
  },
  decorators: [
    withReadingStore({ mode: "reading", currentPassageId: "p-1" }),
    withAudioStore({ status: "stopped", hasCompleted: true }),
  ],
  render: () => {
    const passage = defaultPassageDetail;
    return (
      <Box variant="dark" padding="md" className="readers-page flex-col gap-md">
        <h2 className="font-2xl fw-700 text-primary m-0">Graded Readers</h2>
        <ReadingView
          passage={passage}
          onBack={() => {}}
          isLoading={false}
          hasError={false}
          onRetry={() => {}}
        >
          {passage.sentences.map((sentence) => (
            <SentenceDisplay key={sentence.index} sentence={sentence} onPopoverOpen={() => {}} />
          ))}
        </ReadingView>
      </Box>
    );
  },
};

export const ReadingWithAudioPaused: Story = {
  name: "Reading — Audio Paused",
  parameters: {
    msw: {
      handlers: [
        mswHandlers.readers.passageDetail.default(),
        mswHandlers.readers.passageAudio.default(),
      ],
    },
  },
  decorators: [
    withReadingStore({ mode: "reading", currentPassageId: "p-1" }),
    withAudioStore({ currentIndex: 2, status: "paused" }),
  ],
  render: () => {
    const passage = defaultPassageDetail;
    return (
      <Box variant="dark" padding="md" className="readers-page flex-col gap-md">
        <h2 className="font-2xl fw-700 text-primary m-0">Graded Readers</h2>
        <ReadingView
          passage={passage}
          onBack={() => {}}
          isLoading={false}
          hasError={false}
          onRetry={() => {}}
        >
          {passage.sentences.map((sentence) => (
            <SentenceDisplay key={sentence.index} sentence={sentence} onPopoverOpen={() => {}} />
          ))}
        </ReadingView>
      </Box>
    );
  },
};
