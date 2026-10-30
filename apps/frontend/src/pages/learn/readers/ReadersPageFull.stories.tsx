/**
 * @file ReadersPageFull.stories.tsx
 * @description Page-level stories for Graded Readers.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.5: audio sync variants.
 *
 * Rework (§2): the page takes NO `mode` prop any more — a reading session is a
 * ROUTE (`/learn/readers/:passageId`), so these stories set a ROUTE instead of
 * an arg. `parameters.readerRoute` feeds the decorator below, which mounts the
 * page at that address with the param matched; library stories stay at
 * `/learn/readers`. The reading stories render the PAPER register the way the
 * real route does (PageShell surface="paper" → ReadingView surface="paper").
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { PageShell, PageStack } from "shared/components";
import { ReadersPage, ReadingView, SentenceDisplay } from "../../../features/readers";
import type { PassageDetail } from "../../../features/readers";
import { mswHandlers } from "../../../../.storybook/msw-handlers";
import { withAudioStore, withReadingStore } from "../../../../.storybook/decorators";

const API_BASE = "http://localhost:3001/api/v1";
const API_PASSAGE_DETAIL = `${API_BASE}/readers/passages/:id`;

/** Inline passage-detail handler for the custom passage variants. */
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
  ],
};

const shortPassageDetail: PassageDetail = {
  id: "p-short",
  title: "你好",
  hskLevel: 1,
  sentences: [
    {
      index: 0,
      text: "你好。",
      pinyin: "Nǐ hǎo。",
      words: [
        { glyph: "你好", isKnown: true },
        { glyph: "。", isKnown: true },
      ],
    },
  ],
};

const longPassageDetail: PassageDetail = {
  id: "p-long",
  title: "一个非常长的段落标题用来测试文字截断效果",
  hskLevel: 4,
  sentences: Array.from({ length: 8 }, (_, i) => ({
    index: i,
    text: `这是第${i + 1}个句子，用来测试长段落的滚动与阅读节奏。`,
    pinyin: `Zhè shì dì ${i + 1} gè jùzi。`,
    words: [
      { glyph: "这是", isKnown: true },
      { glyph: `第${i + 1}个`, isKnown: false, hskLevel: 2 },
      { glyph: "句子", isKnown: true },
      { glyph: "。", isKnown: true },
    ],
  })),
};

/** Route-aware decorator: library at `/learn/readers`, a session at `/learn/readers/<id>`. */
const withReaderRoute = (Story: React.FC, context: { parameters: Record<string, unknown> }) => {
  const route = (context.parameters.readerRoute as string) ?? "/learn/readers";
  return (
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/learn/readers" element={<Story />} />
        <Route path="/learn/readers/:passageId" element={<Story />} />
      </Routes>
    </MemoryRouter>
  );
};

const meta = {
  title: "Pages/Learn/ReadersPage",
  component: ReadersPage,
  tags: ["pages-list"],
  parameters: {
    layout: "fullscreen",
    msw: { handlers: [mswHandlers.readers.passages.default()] },
  },
  decorators: [withReaderRoute],
} satisfies Meta<typeof ReadersPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// LIBRARY (list / Browse)
// ============================================================================

export const LibraryPopulated: Story = {
  name: "Library — populated",
  parameters: { msw: { handlers: [mswHandlers.readers.passages.default()] } },
};

export const LibraryLoading: Story = {
  name: "Library — loading",
  parameters: { msw: { handlers: [mswHandlers.readers.passages.loading()] } },
};

export const LibraryEmpty: Story = {
  name: "Library — empty",
  parameters: { msw: { handlers: [mswHandlers.readers.passages.empty()] } },
};

export const LibraryError: Story = {
  name: "Library — error",
  parameters: { msw: { handlers: [mswHandlers.readers.passages.error()] } },
};

/** Edge: a graded list with a very long title, a zero-word list and bookmarks. */
export const LibraryEdgePassages: Story = {
  name: "Library — edge (long titles, bookmarks)",
  parameters: {
    msw: {
      handlers: [
        http.get(`${API_BASE}/readers/passages`, () =>
          HttpResponse.json(
            {
              data: [
                { id: "p-e1", title: "你好", hskLevel: 1, wordCount: 12, isBookmarked: true },
                {
                  id: "p-e2",
                  title: "Advanced Classical Chinese Literature Analysis",
                  hskLevel: 6,
                  wordCount: 240,
                },
                {
                  id: "p-e3",
                  title: "一个非常非常长的中文文章标题用来测试文字截断效果",
                  hskLevel: 5,
                  wordCount: 88,
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
// READING (detail / Focus, PAPER register)
// ============================================================================

export const ReadingDefault: Story = {
  name: "Reading — paper register",
  parameters: {
    readerRoute: "/learn/readers/p-1",
    msw: { handlers: [mswHandlers.readers.passageDetail.default()] },
  },
  decorators: [withReadingStore({ mode: "reading", currentPassageId: "p-1" })],
};

export const ReadingLoading: Story = {
  name: "Reading — loading",
  parameters: {
    readerRoute: "/learn/readers/p-loading",
    msw: { handlers: [mswHandlers.readers.passageDetail.loading()] },
  },
};

export const ReadingError: Story = {
  name: "Reading — error",
  parameters: {
    readerRoute: "/learn/readers/p-error",
    msw: { handlers: [mswHandlers.readers.passageDetail.error()] },
  },
};

export const ReadingShortPassage: Story = {
  name: "Reading — one sentence (Finish CTA)",
  parameters: {
    readerRoute: "/learn/readers/p-short",
    msw: { handlers: [passageDetailHandler(shortPassageDetail)] },
  },
};

export const ReadingLongPassage: Story = {
  name: "Reading — long passage",
  parameters: {
    readerRoute: "/learn/readers/p-long",
    msw: { handlers: [passageDetailHandler(longPassageDetail)] },
  },
};

/** Edge: the paper sheet with a stopped transport and a completed passage. */
export const ReadingCompleted: Story = {
  name: "Reading — paper sheet (completed transport)",
  parameters: {
    readerRoute: "/learn/readers/p-1",
    msw: { handlers: [mswHandlers.readers.passageDetail.default()] },
  },
  decorators: [
    withReadingStore({ mode: "reading", currentPassageId: "p-1" }),
    withAudioStore({ status: "stopped", hasCompleted: true }),
  ],
  render: () => {
    const passage = defaultPassageDetail;
    return (
      <PageShell archetype="detail" surface="paper">
        <PageStack size="default">
          <ReadingView
            passage={passage}
            surface="paper"
            onBack={() => {}}
            isLoading={false}
            hasError={false}
            onRetry={() => {}}
            onNextPassage={() => {}}
            nextPassageTitle="我的朋友"
          >
            {passage.sentences.map((sentence) => (
              <SentenceDisplay key={sentence.index} sentence={sentence} onPopoverOpen={() => {}} />
            ))}
          </ReadingView>
        </PageStack>
      </PageShell>
    );
  },
};
