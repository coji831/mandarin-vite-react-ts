/**
 * @file apps/frontend/src/mocks/handlers/chengyu-handlers.ts
 * @description MSW handlers for Chengyu API endpoints (Story 23.2 / 23.3)
 *
 * Provides a `chengyuHandlers` factory object (matching the
 * `grammarHandlers` pattern) with all states: default (populated), loading,
 * empty, error. `default()` returns an array of HttpHandler[] (one per
 * endpoint) so `mocks/server.ts` can flatten it with `...chengyuHandlers.default()`.
 *
 * Payloads mirror the story-23.2 response examples: the list returns
 * `{ items, total, page, pageSize }` with summary items, and the detail
 * returns idiom + `examples[]` (with `segments[]`) + `relatedIdioms[]`.
 * URLs are absolute with the `/api/v1` prefix so they match `apiClient`
 * (baseURL `http://localhost:3001/api`).
 */

import { http, HttpResponse } from "msw";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const API_BASE = "http://localhost:3001/api";

function url(pattern: string): string {
  return `${API_BASE}${pattern}`;
}

// ─── Sample Data ──────────────────────────────────────────────────────

interface ChengyuSegment {
  text: string;
  pinyin: string;
  gloss: string;
  entityType: "character" | "word" | null;
  entityId: string | null;
}

interface ChengyuExample {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  segments: ChengyuSegment[];
}

interface ChengyuRelatedIdiom {
  id: string;
  chengyu: string;
  relationType: string;
}

interface ChengyuSummary {
  id: string;
  chengyu: string;
  pinyin: string;
  literalMeaning: string;
  figurativeMeaning: string;
  era: string;
  theme: string;
  sortOrder: number;
  exampleCount: number;
  previewExample: string | null;
}

interface ChengyuDetail {
  id: string;
  chengyu: string;
  pinyin: string;
  literalMeaning: string;
  figurativeMeaning: string;
  story: string;
  storySource: string;
  era: string;
  theme: string;
  sortOrder: number;
  examples: ChengyuExample[];
  relatedIdioms: ChengyuRelatedIdiom[];
}

/** List page mirroring the story-23.2 list response example. */
const sampleItems: ChengyuSummary[] = [
  {
    id: "cy_0001",
    chengyu: "破釜沉舟",
    pinyin: "pò fǔ chén zhōu",
    literalMeaning: "Break the pots and sink the boats",
    figurativeMeaning:
      "To burn one's bridges; to commit totally to a course of action with no way back",
    era: "Qin–Han transition",
    theme: "determination",
    sortOrder: 1,
    exampleCount: 1,
    previewExample: "他已经决定要破釜沉舟，全力投入新的工作。",
  },
  {
    id: "cy_0005",
    chengyu: "叶公好龙",
    pinyin: "yè gōng hào lóng",
    literalMeaning: "Lord Ye loves dragons",
    figurativeMeaning:
      "To profess love for something one actually fears; to be insincere about one's stated interests",
    era: "Spring & Autumn",
    theme: "hypocrisy",
    sortOrder: 5,
    exampleCount: 1,
    previewExample: "他嘴上说喜欢爬山，其实叶公好龙，一次也没去过。",
  },
  {
    id: "cy_0016",
    chengyu: "背水一战",
    pinyin: "bèi shuǐ yī zhàn",
    literalMeaning: "Fight with one's back to the river",
    figurativeMeaning: "To fight to the last ditch; to be in a do-or-die situation",
    era: "Han",
    theme: "determination",
    sortOrder: 16,
    exampleCount: 1,
    previewExample: "我们已经背水一战，没有退路了。",
  },
];

/** Detail mirroring the story-23.2 detail response example (cy_0001). */
const sampleDetail: ChengyuDetail = {
  id: "cy_0001",
  chengyu: "破釜沉舟",
  pinyin: "pò fǔ chén zhōu",
  literalMeaning: "Break the pots and sink the boats",
  figurativeMeaning:
    "To burn one's bridges; to commit totally to a course of action with no way back",
  story:
    "In 207 BCE, the rebel general Xiang Yu led his army across the Yellow River to attack the mighty Qin forces at Julu. To show his men there would be no retreat, he ordered the boats sunk, the cooking cauldrons smashed, and the camp burned, keeping only three days of rations. With every escape route destroyed, his soldiers fought with desperate courage and crushed the Qin army, changing the course of the war that ended the Qin dynasty.",
  storySource: "《史记·卷七·项羽本纪》(zh.wikisource.org/wiki/史記/卷007)",
  era: "Qin–Han transition",
  theme: "determination",
  sortOrder: 1,
  examples: [
    {
      id: "cy_0001_ex1",
      chinese: "他已经决定要破釜沉舟，全力投入新的工作。",
      pinyin: "tā yǐ jīng jué dìng yào pò fǔ chén zhōu quán lì tóu rù xīn de gōng zuò",
      english: "He has decided to burn his bridges and throw all his energy into the new job.",
      segments: [
        { text: "破", pinyin: "pò", gloss: "break", entityType: "character", entityId: "ch_30772" },
        {
          text: "釜",
          pinyin: "fǔ",
          gloss: "cauldron",
          entityType: "character",
          entityId: "ch_46225",
        },
        {
          text: "沉",
          pinyin: "chén",
          gloss: "sink",
          entityType: "character",
          entityId: "ch_27785",
        },
        {
          text: "舟",
          pinyin: "zhōu",
          gloss: "boat",
          entityType: "character",
          entityId: "ch_33311",
        },
        {
          text: "全力",
          pinyin: "quán lì",
          gloss: "with all one's strength",
          entityType: null,
          entityId: null,
        },
        { text: "投入", pinyin: "tóu rù", gloss: "invest", entityType: null, entityId: null },
        { text: "工作", pinyin: "gōng zuò", gloss: "work", entityType: null, entityId: null },
      ],
    },
  ],
  relatedIdioms: [
    { id: "cy_0042", chengyu: "孤注一掷", relationType: "RELATED" },
    { id: "cy_0016", chengyu: "背水一战", relationType: "RELATED" },
  ],
};

// ─── Handler Factories ────────────────────────────────────────────────

export const chengyuHandlers = {
  /**
   * Populated handlers for both chengyu endpoints (list + detail).
   * List supports optional ?theme= / ?era= / ?search= query filtering.
   */
  default: () => [
    http.get(url(ROUTE_PATTERNS.chengyuIdioms), ({ request }) => {
      const queryUrl = new URL(request.url);
      const theme = queryUrl.searchParams.get("theme");
      const era = queryUrl.searchParams.get("era");
      const search = queryUrl.searchParams.get("search");

      let items = sampleItems;
      if (theme) {
        items = items.filter((i) => i.theme === theme);
      }
      if (era) {
        items = items.filter((i) => i.era === era);
      }
      if (search) {
        const needle = search.toLowerCase();
        items = items.filter(
          (i) =>
            i.chengyu.toLowerCase().includes(needle) ||
            i.pinyin.toLowerCase().includes(needle) ||
            i.literalMeaning.toLowerCase().includes(needle) ||
            i.figurativeMeaning.toLowerCase().includes(needle),
        );
      }

      return HttpResponse.json(
        { items, total: items.length, page: 1, pageSize: 20 },
        { status: 200 },
      );
    }),
    http.get(url(ROUTE_PATTERNS.chengyuIdiomById(":id")), ({ params }) => {
      if (params.id === "cy_0001") {
        return HttpResponse.json(sampleDetail, { status: 200 });
      }
      return HttpResponse.json(
        { error: "Failed to load chengyu idiom", code: "NOT_FOUND" },
        { status: 404 },
      );
    }),
  ],

  /**
   * Loading state — never resolves (both endpoints).
   */
  loading: () => [
    http.get(url(ROUTE_PATTERNS.chengyuIdioms), () => new Promise<never>(() => {})),
    http.get(url(ROUTE_PATTERNS.chengyuIdiomById(":id")), () => new Promise<never>(() => {})),
  ],

  /**
   * Empty state — list returns an empty page; detail 404s.
   */
  empty: () => [
    http.get(url(ROUTE_PATTERNS.chengyuIdioms), () =>
      HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }, { status: 200 }),
    ),
    http.get(url(ROUTE_PATTERNS.chengyuIdiomById(":id")), () =>
      HttpResponse.json(
        { error: "Failed to load chengyu idiom", code: "NOT_FOUND" },
        { status: 404 },
      ),
    ),
  ],

  /**
   * Error state — both endpoints return 500.
   */
  error: () => [
    http.get(url(ROUTE_PATTERNS.chengyuIdioms), () =>
      HttpResponse.json(
        { error: "Failed to load chengyu idioms", code: "INTERNAL_ERROR" },
        { status: 500 },
      ),
    ),
    http.get(url(ROUTE_PATTERNS.chengyuIdiomById(":id")), () =>
      HttpResponse.json(
        { error: "Failed to load chengyu idiom", code: "INTERNAL_ERROR" },
        { status: 500 },
      ),
    ),
  ],
};
