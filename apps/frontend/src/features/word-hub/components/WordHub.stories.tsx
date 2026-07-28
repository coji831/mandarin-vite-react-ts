/**
 * @file WordHub.stories.tsx
 * @description Storybook stories for the WordHub component with MSW handlers.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.x: Migrated to word-hub feature
 *
 * Covers: word states (default, single def, no HSK, chengyu, many defs,
 * single char), loading, error, no data.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { WordHub } from "./WordHub";

const API_BASE = "http://localhost:3001/api/v1";

const wordGlyphHandler = (glyph: string) =>
  http.get(`${API_BASE}/words/:word`, ({ params }) => {
    const requestedGlyph = params.word as string;

    if (requestedGlyph === "喜欢") {
      return HttpResponse.json({
        data: {
          glyph: "喜欢",
          pinyin: "xǐhuān",
          definitions: ["to like; to be fond of", "to love; to be keen on"],
          hskLevel: 2,
          constituentCharacters: [
            { glyph: "喜", pinyin: "xǐ", meaning: "happy; like" },
            { glyph: "欢", pinyin: "huān", meaning: "joy; happy" },
          ],
        },
      });
    }

    if (requestedGlyph === "学校") {
      return HttpResponse.json({
        data: {
          glyph: "学校",
          pinyin: "xuéxiào",
          definitions: ["school"],
          hskLevel: 1,
          constituentCharacters: [
            { glyph: "学", pinyin: "xué", meaning: "to learn; to study" },
            { glyph: "校", pinyin: "xiào", meaning: "school" },
          ],
        },
      });
    }

    if (requestedGlyph === "成语") {
      return HttpResponse.json({
        data: {
          glyph: "成语",
          pinyin: "chéngyǔ",
          definitions: ["Chinese idiom; set phrase"],
          constituentCharacters: [
            { glyph: "成", pinyin: "chéng", meaning: "to become; to finish" },
            { glyph: "语", pinyin: "yǔ", meaning: "language; speech" },
          ],
        },
      });
    }

    if (requestedGlyph === "一石二鸟") {
      return HttpResponse.json({
        data: {
          glyph: "一石二鸟",
          pinyin: "yī shí èr niǎo",
          definitions: ["to kill two birds with one stone"],
          hskLevel: 6,
          constituentCharacters: [
            { glyph: "一", pinyin: "yī", meaning: "one" },
            { glyph: "石", pinyin: "shí", meaning: "stone" },
            { glyph: "二", pinyin: "èr", meaning: "two" },
            { glyph: "鸟", pinyin: "niǎo", meaning: "bird" },
          ],
        },
      });
    }

    if (requestedGlyph === "意思") {
      return HttpResponse.json({
        data: {
          glyph: "意思",
          pinyin: "yìsi",
          definitions: [
            "meaning; sense",
            "opinion; wish",
            "suggestion; hint; trace",
            "interest; fun",
            "token of appreciation",
          ],
          hskLevel: 2,
          constituentCharacters: [
            { glyph: "意", pinyin: "yì", meaning: "meaning; intention" },
            { glyph: "思", pinyin: "sī", meaning: "to think; to consider" },
          ],
        },
      });
    }

    if (requestedGlyph === "好") {
      return HttpResponse.json({
        data: {
          glyph: "好",
          pinyin: "hǎo",
          definitions: ["good; well; fine", "to be easy to"],
          hskLevel: 1,
          constituentCharacters: [{ glyph: "好", pinyin: "hǎo", meaning: "good; well" }],
        },
      });
    }

    // Default fallback
    return HttpResponse.json({
      data: {
        glyph: requestedGlyph,
        pinyin: "",
        definitions: [],
        constituentCharacters: [],
      },
    });
  });

const wordDetailLoading = http.get(`${API_BASE}/words/:word`, () => new Promise(() => {}));

const wordDetailError = http.get(`${API_BASE}/words/:word`, () =>
  HttpResponse.json({ error: "Failed to load word" }, { status: 500 }),
);

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: "Features/WordHub/WordHub",
  component: WordHub,
  parameters: { layout: "centered" },
  argTypes: {
    entityId: { control: "text" },
  },
  decorators: [
    (Story: React.FC) => (
      <MemoryRouter initialEntries={["/learn/readers"]}>
        <div style={{ width: "400px", maxHeight: "600px", overflowY: "auto" }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof WordHub>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// WORD VARIANTS
// ============================================================================

export const Default: Story = {
  args: { entityId: "喜欢" },
  parameters: { msw: { handlers: [wordGlyphHandler("喜欢")] } },
};

export const SingleDefinition: Story = {
  args: { entityId: "学校" },
  parameters: { msw: { handlers: [wordGlyphHandler("学校")] } },
};

export const NoHSK: Story = {
  args: { entityId: "成语" },
  parameters: { msw: { handlers: [wordGlyphHandler("成语")] } },
};

export const Chengyu: Story = {
  args: { entityId: "一石二鸟" },
  parameters: { msw: { handlers: [wordGlyphHandler("一石二鸟")] } },
};

export const ManyDefinitions: Story = {
  args: { entityId: "意思" },
  parameters: { msw: { handlers: [wordGlyphHandler("意思")] } },
};

export const SingleChar: Story = {
  args: { entityId: "好" },
  parameters: { msw: { handlers: [wordGlyphHandler("好")] } },
};

export const Loading: Story = {
  args: { entityId: "喜欢" },
  parameters: { msw: { handlers: [wordDetailLoading] } },
};

export const Error: Story = {
  args: { entityId: "喜欢" },
  parameters: { msw: { handlers: [wordDetailError] } },
};

export const NoData: Story = {
  args: { entityId: "未知" },
  parameters: { msw: { handlers: [wordGlyphHandler("未知")] } },
};
