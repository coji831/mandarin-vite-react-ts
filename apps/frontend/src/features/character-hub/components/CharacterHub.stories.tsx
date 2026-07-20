import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { CharacterHub, type CharacterData } from "./CharacterHub";
import { mswHandlers } from "../../../../.storybook/msw-handlers";

const API_BASE = "http://localhost:3001/api/v1";

const MOCK_CHARACTER_DATA: Record<string, CharacterData> = {
  好: {
    traditional: "好",
    strokeCount: 6,
    hskLevel: 1,
    frequencyRank: 22,
    etymology: "Compound ideograph: 女 (woman) + 子 (child) — a woman with a child is 'good'",
    readings: [
      { pinyin: "hǎo", tone: 3, type: "primary", coreMeaning: "good, well" },
      { pinyin: "hào", tone: 4, type: "secondary", coreMeaning: "to like, to love" },
    ],
    commonWords: ["很好", "爱好", "好吃"],
  },
  水: {
    traditional: "水",
    strokeCount: 4,
    hskLevel: 1,
    frequencyRank: 8,
    etymology: "Pictograph of flowing water. Originally depicted a meandering stream with ripples.",
    readings: [{ pinyin: "shuǐ", tone: 3, type: "primary", coreMeaning: "water" }],
    commonWords: ["水果", "水平", "喝水"],
  },
  火: {
    traditional: "火",
    strokeCount: 4,
    hskLevel: 1,
    frequencyRank: 45,
    etymology: "Pictograph of a flame with sparks rising upward.",
    readings: [{ pinyin: "huǒ", tone: 3, type: "primary", coreMeaning: "fire" }],
    commonWords: ["火车", "火锅"],
  },
  没: {
    traditional: "沒",
    strokeCount: 7,
    hskLevel: 1,
    frequencyRank: 15,
    etymology: "Phonetic-semantic compound: 氵 (water) + 叟 (old man)",
    readings: [
      { pinyin: "méi", tone: 2, type: "primary", coreMeaning: "not, have not" },
      { pinyin: "mò", tone: 4, type: "literary", coreMeaning: "sink, disappear" },
    ],
    commonWords: ["没有", "没用", "没关系"],
  },
  爱: {
    traditional: "愛",
    strokeCount: 10,
    hskLevel: 1,
    frequencyRank: 35,
    etymology: "Complex compound: 爫 (hand) + 冖 (cover) + 心 (heart) + 夊 (foot)",
    readings: [{ pinyin: "ài", tone: 4, type: "primary", coreMeaning: "love, affection" }],
    commonWords: ["爱情", "爱好", "可爱"],
  },
};

// ─── Shared MSW Handler Constants ──────────────────────────────────────

/** Radicals list that includes radicals matching "好" via hsk_characters */
const radicalsWithHao = () =>
  http.get(`${API_BASE}/radicals`, () =>
    HttpResponse.json([
      {
        id: "rad_0025",
        glyph: "白",
        meaning: "white",
        stroke_count: 5,
        name_pinyin: "bái",
        kangxi_index: 25,
        is_recommended: true,
        metadata: {
          etymology: "Pictograph of a white rice grain",
          frequency_rank: 45,
          notes: "White radical — 好 contains 白 as a component.",
          is_also_character: true,
          hsk_characters: [
            { glyph: "好", pinyin: "hǎo", meaning: "good" },
            { glyph: "白", pinyin: "bái", meaning: "white" },
          ],
        },
      },
    ]),
  );

/** Catch-all handler for radicals/character/* — regex to handle URL-encoded glyphs */
const radicalsByCharacterFallback = http.get(new RegExp(`^${API_BASE}/radicals/character/.+`), () =>
  HttpResponse.json([]),
);

export const DefaultHandlers = [
  ...mswHandlers.auth,
  mswHandlers.progression.phaseGate(3),
  ...mswHandlers.foundations.default(),
  radicalsWithHao(),
  radicalsByCharacterFallback,
];

const meta: Meta<typeof CharacterHub> = {
  title: "Features/CharacterHub",
  component: CharacterHub,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/learn/foundations"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    msw: {
      handlers: DefaultHandlers,
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CharacterHub>;

export const Loaded: Story = {
  name: "好 — Fully loaded (all features)",
  parameters: {
    msw: {
      handlers: DefaultHandlers,
    },
  },
  render: () => (
    <CharacterHub character="好" onClose={() => {}} characterData={MOCK_CHARACTER_DATA["好"]} />
  ),
};

export const Loading: Story = {
  name: "Loading — All skeletons",
  parameters: {
    msw: {
      handlers: [
        ...mswHandlers.auth,
        mswHandlers.progression.phaseGate(3),
        ...mswHandlers.foundations.default(),
        mswHandlers.radicals.default(),
      ],
    },
  },
  render: () => <CharacterHub character="" onClose={() => {}} />,
};

/** Story: character with no radicals (empty state) */
export const Empty: Story = {
  name: "Empty — No radicals found",
  render: () => <CharacterHub character="爱" onClose={() => {}} />,
};

/** Story: simulating API failure for radicals */
export const Error: Story = {
  name: "Error — Radicals load failure",
  render: () => <CharacterHub character="好" onClose={() => {}} />,
  parameters: {
    msw: {
      handlers: [
        ...mswHandlers.auth,
        mswHandlers.progression.phaseGate(3),
        ...mswHandlers.foundations.default(),
        http.get(`${API_BASE}/radicals`, () => HttpResponse.error()),
        http.get(new RegExp(`^${API_BASE}/radicals/character/.+`), () => HttpResponse.error()),
      ],
    },
  },
};
