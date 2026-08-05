/**
 * @file apps/frontend/src/mocks/handlers/grammar-handlers.ts
 * @description MSW handlers for Grammar API endpoints (Story 22.2 / 22.3)
 *
 * Provides a `grammarHandlers` factory object (matching the
 * `phoneticClustersHandlers` pattern) with all states: default (populated),
 * loading, empty, error. `default()` returns an array of HttpHandler[] (one
 * per endpoint) so `mocks/server.ts` can flatten it with `...grammarHandlers.default()`.
 *
 * Payloads mirror the story-22.2 response examples: the list returns
 * `{ items, total, page, pageSize }` with summary items, and the detail
 * returns pattern + `examples[]` (with `segments[]`) + `relatedPatterns[]`.
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

interface GrammarSegment {
  text: string;
  pinyin: string;
  gloss: string;
  entityType: "character" | "word" | null;
  entityId: string | null;
}

interface GrammarExample {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  segments: GrammarSegment[];
}

interface GrammarRelatedPattern {
  id: string;
  name: string;
  relationType: string;
}

interface GrammarPatternSummary {
  id: string;
  name: string;
  structure: string;
  phase: number;
  hskLevel: number | null;
  sortOrder: number;
  exampleCount: number;
  previewExample: string | null;
}

interface GrammarPatternDetail {
  id: string;
  name: string;
  structure: string;
  explanation: string;
  phase: number;
  hskLevel: number | null;
  sortOrder: number;
  examples: GrammarExample[];
  relatedPatterns: GrammarRelatedPattern[];
}

/** List page mirroring the story-22.2 list response example. */
const sampleItems: GrammarPatternSummary[] = [
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
  {
    id: "gr_0018",
    name: "把 (bǎ) disposal construction",
    structure: "Subject + 把 + Object + Verb + Complement",
    phase: 4,
    hskLevel: 4,
    sortOrder: 18,
    exampleCount: 3,
    previewExample: "我把书放在桌子上。",
  },
  {
    id: "gr_0019",
    name: "被 (bèi) passive construction",
    structure: "Subject + 被 + (Agent) + Verb",
    phase: 4,
    hskLevel: 4,
    sortOrder: 19,
    exampleCount: 3,
    previewExample: "他被打了。",
  },
];

/** Detail mirroring the story-22.2 detail response example (gr_0018). */
const sampleDetail: GrammarPatternDetail = {
  id: "gr_0018",
  name: "把 (bǎ) disposal construction",
  structure: "Subject + 把 + Object + Verb + Complement",
  explanation:
    "The 把 (bǎ) construction moves the object before the verb and marks it as the thing being disposed of or affected, emphasizing the result of the action on the object: 我把书放在桌子上 — 'I put the book on the table.' Use it when the verb is followed by a complement describing what happens to the object.",
  phase: 4,
  hskLevel: 4,
  sortOrder: 18,
  examples: [
    {
      id: "gr_0018_ex1",
      chinese: "我把书放在桌子上。",
      pinyin: "wǒ bǎ shū fàng zài zhuōzi shàng",
      english: "I put the book on the table.",
      segments: [
        { text: "我", pinyin: "wǒ", gloss: "I", entityType: "character", entityId: "ch_25105" },
        {
          text: "把",
          pinyin: "bǎ",
          gloss: "disposal marker",
          entityType: "character",
          entityId: "ch_25226",
        },
        { text: "书", pinyin: "shū", gloss: "book", entityType: "character", entityId: "ch_20070" },
        { text: "放", pinyin: "fàng", gloss: "put", entityType: "character", entityId: "ch_25918" },
        { text: "在", pinyin: "zài", gloss: "at", entityType: "character", entityId: "ch_22312" },
        {
          text: "桌子",
          pinyin: "zhuōzi",
          gloss: "table",
          entityType: "word",
          entityId: "w_00487",
        },
        { text: "上", pinyin: "shàng", gloss: "on", entityType: "character", entityId: "ch_19978" },
      ],
    },
    {
      id: "gr_0018_ex2",
      chinese: "他把衣服洗了。",
      pinyin: "tā bǎ yīfu xǐ le",
      english: "He washed the clothes.",
      segments: [
        { text: "他", pinyin: "tā", gloss: "he", entityType: "character", entityId: "ch_20182" },
        {
          text: "把",
          pinyin: "bǎ",
          gloss: "disposal marker",
          entityType: "character",
          entityId: "ch_25226",
        },
        {
          text: "衣服",
          pinyin: "yīfu",
          gloss: "clothes",
          entityType: "word",
          entityId: "w_00428",
        },
        { text: "洗", pinyin: "xǐ", gloss: "wash", entityType: "character", entityId: "ch_27927" },
        {
          text: "了",
          pinyin: "le",
          gloss: "perfective particle",
          entityType: "character",
          entityId: "ch_20102",
        },
      ],
    },
  ],
  relatedPatterns: [
    { id: "gr_0019", name: "被 (bèi) passive construction", relationType: "CONTRASTS_WITH" },
  ],
};

// ─── Handler Factories ────────────────────────────────────────────────

export const grammarHandlers = {
  /**
   * Populated handlers for both grammar endpoints (list + detail).
   * List supports optional ?phase= / ?hskLevel= query filtering.
   */
  default: () => [
    http.get(url(ROUTE_PATTERNS.grammarPatterns), ({ request }) => {
      const queryUrl = new URL(request.url);
      const phase = queryUrl.searchParams.get("phase");
      const hskLevel = queryUrl.searchParams.get("hskLevel");

      let items = sampleItems;
      if (phase) {
        items = items.filter((i) => i.phase === Number(phase));
      }
      if (hskLevel) {
        items = items.filter((i) => i.hskLevel === Number(hskLevel));
      }

      return HttpResponse.json(
        { items, total: items.length, page: 1, pageSize: 20 },
        { status: 200 },
      );
    }),
    http.get(url(ROUTE_PATTERNS.grammarPatternById(":id")), ({ params }) => {
      if (params.id === "gr_0018") {
        return HttpResponse.json(sampleDetail, { status: 200 });
      }
      return HttpResponse.json(
        { error: "Failed to load grammar pattern", code: "NOT_FOUND" },
        { status: 404 },
      );
    }),
  ],

  /**
   * Loading state — never resolves (both endpoints).
   */
  loading: () => [
    http.get(url(ROUTE_PATTERNS.grammarPatterns), () => new Promise<never>(() => {})),
    http.get(url(ROUTE_PATTERNS.grammarPatternById(":id")), () => new Promise<never>(() => {})),
  ],

  /**
   * Empty state — list returns an empty page; detail 404s.
   */
  empty: () => [
    http.get(url(ROUTE_PATTERNS.grammarPatterns), () =>
      HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }, { status: 200 }),
    ),
    http.get(url(ROUTE_PATTERNS.grammarPatternById(":id")), () =>
      HttpResponse.json(
        { error: "Failed to load grammar pattern", code: "NOT_FOUND" },
        { status: 404 },
      ),
    ),
  ],

  /**
   * Error state — both endpoints return 500.
   */
  error: () => [
    http.get(url(ROUTE_PATTERNS.grammarPatterns), () =>
      HttpResponse.json(
        { error: "Failed to load grammar patterns", code: "INTERNAL_ERROR" },
        { status: 500 },
      ),
    ),
    http.get(url(ROUTE_PATTERNS.grammarPatternById(":id")), () =>
      HttpResponse.json(
        { error: "Failed to load grammar pattern", code: "INTERNAL_ERROR" },
        { status: 500 },
      ),
    ),
  ],
};
