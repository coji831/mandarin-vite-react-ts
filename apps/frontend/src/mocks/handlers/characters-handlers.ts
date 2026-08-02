/**
 * @file apps/frontend/src/mocks/handlers/characters-handlers.ts
 * @description MSW handlers for Characters API endpoints (Story 21.10, 21.12)
 *
 * Provides factory functions for all 7 endpoints with 4 states each:
 * default (populated), loading (never-resolving), empty (404/empty), error (500).
 *
 * Handlers are used in both Storybook stories (via storybook-msw-addon)
 * and Vitest tests (via msw/node).
 */

import { http, HttpResponse } from "msw";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const API_BASE = "http://localhost:3001";

// ─── Helpers ────────────────────────────────────────────────────────────

function url(pattern: string): string {
  return `${API_BASE}${pattern}`;
}

// ─── Sample Data ────────────────────────────────────────────────────────

const sampleCharacterDetail = {
  glyph: "好",
  pinyin: ["hǎo", "hào"],
  meanings: ["good", "well", "to like"],
  strokeCount: 6,
  radical: { id: "rad_0038", glyph: "女", meaning: "woman" },
  classification: "phono_semantic",
  phoneticComponent: { glyph: "子", pinyin: "zǐ", meaning: "child" },
  hskLevels: [1],
  frequencyRank: 42,
};

const samplePhoneticComponent = {
  glyph: "子",
  pinyin: "zǐ",
  meaning: "child",
};

const sampleHomophones = {
  glyph: "好",
  readings: [
    {
      pinyin: "hǎo",
      tone: 3,
      homophones: [{ glyph: "郝", pinyin: "hǎo", tone: 3, meaning: "surname Hao" }],
    },
    {
      pinyin: "hào",
      tone: 4,
      homophones: [
        { glyph: "號", pinyin: "hào", tone: 4, meaning: "number, mark" },
        { glyph: "昊", pinyin: "hào", tone: 4, meaning: "vast, sky" },
      ],
    },
  ],
};

const sampleDecomposition = {
  glyph: "河",
  components: [
    { glyph: "氵", type: "semantic", meaning: "water" },
    { glyph: "可", type: "phonetic", meaning: "can/allow", pinyin: "kě" },
  ],
};

const sampleSearchResults = {
  data: [
    { glyph: "好", pinyin: "hǎo", tone: 3, hskLevels: [1] },
    { glyph: "号", pinyin: "hào", tone: 4, hskLevels: [2] },
  ],
};

const sampleFrequency = {
  data: [
    { glyph: "的", frequencyRank: 1, hskLevel: 1, pinyin: "de", tone: 5 },
    { glyph: "一", frequencyRank: 2, hskLevel: 1, pinyin: "yī", tone: 1 },
    { glyph: "是", frequencyRank: 3, hskLevel: 1, pinyin: "shì", tone: 4 },
    { glyph: "不", frequencyRank: 4, hskLevel: 1, pinyin: "bù", tone: 4 },
    { glyph: "了", frequencyRank: 5, hskLevel: 1, pinyin: "le", tone: 5 },
  ],
  page: 1,
  pageSize: 50,
  total: 5,
};

const samplePinyinSearch = {
  query: "ma",
  totalResults: 42,
  page: 1,
  pageSize: 50,
  results: [
    { glyph: "妈", pinyin: "mā", tone: 1, meaning: "mother" },
    { glyph: "麻", pinyin: "má", tone: 2, meaning: "hemp" },
    { glyph: "马", pinyin: "mǎ", tone: 3, meaning: "horse" },
    { glyph: "骂", pinyin: "mà", tone: 4, meaning: "to scold" },
  ],
};

// ─── Handler Factories ──────────────────────────────────────────────────

export const charactersHandlers = {
  default: {
    getCharacter: http.get(url(ROUTE_PATTERNS.charactersByGlyph(":glyph")), ({ params }) => {
      const { glyph } = params;
      if (glyph === "好") {
        return HttpResponse.json(sampleCharacterDetail, { status: 200 });
      }
      return HttpResponse.json(
        { error: "Character not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }),

    getPhonetic: http.get(url(ROUTE_PATTERNS.charactersPhonetic(":glyph")), ({ params }) => {
      const { glyph } = params;
      if (glyph === "好") {
        return HttpResponse.json(samplePhoneticComponent, { status: 200 });
      }
      return HttpResponse.json(
        { error: "Character not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }),

    getHomophones: http.get(url(ROUTE_PATTERNS.charactersHomophones(":glyph")), ({ params }) => {
      const { glyph } = params;
      if (glyph === "好") {
        return HttpResponse.json(sampleHomophones, { status: 200 });
      }
      return HttpResponse.json(
        { error: "Character not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }),

    getDecomposition: http.get(
      url(ROUTE_PATTERNS.charactersDecomposition(":glyph")),
      ({ params }) => {
        const { glyph } = params;
        if (glyph === "河") {
          return HttpResponse.json(sampleDecomposition, { status: 200 });
        }
        return HttpResponse.json(
          { error: "Character not found", code: "NOT_FOUND" },
          { status: 404 },
        );
      },
    ),

    search: http.get(url(ROUTE_PATTERNS.charactersSearch), ({ request }) => {
      const url_obj = new URL(request.url);
      const q = url_obj.searchParams.get("q");
      const tone = url_obj.searchParams.get("tone");
      const hskLevel = url_obj.searchParams.get("hskLevel");

      if (!q && !tone && !hskLevel) {
        return HttpResponse.json(
          {
            error: "At least one search parameter (q, tone, hskLevel) is required",
            code: "VALIDATION_ERROR",
          },
          { status: 400 },
        );
      }

      return HttpResponse.json(sampleSearchResults, { status: 200 });
    }),

    frequency: http.get(url(ROUTE_PATTERNS.charactersFrequency), ({ request }) => {
      const url_obj = new URL(request.url);
      const tier = url_obj.searchParams.get("tier");

      if (tier) {
        const filtered = {
          ...sampleFrequency,
          data: sampleFrequency.data.filter((item) => item.hskLevel === parseInt(tier, 10)),
        };
        return HttpResponse.json(filtered, { status: 200 });
      }

      return HttpResponse.json(sampleFrequency, { status: 200 });
    }),

    getPinyinSearch: http.get(url(ROUTE_PATTERNS.pinyinSearch), ({ request }) => {
      const url_obj = new URL(request.url);
      const q = url_obj.searchParams.get("q") || "";
      const tone = url_obj.searchParams.get("tone");

      let results = samplePinyinSearch.results;
      if (tone) {
        results = results.filter((r) => r.tone === parseInt(tone, 10));
      }

      return HttpResponse.json(
        {
          query: q,
          totalResults: results.length,
          page: 1,
          pageSize: 50,
          results,
        },
        { status: 200 },
      );
    }),
  },

  loading: {
    getCharacter: http.get(
      url(ROUTE_PATTERNS.charactersByGlyph(":glyph")),
      () => new Promise<never>(() => {}),
    ),
    getPhonetic: http.get(
      url(ROUTE_PATTERNS.charactersPhonetic(":glyph")),
      () => new Promise<never>(() => {}),
    ),
    getHomophones: http.get(
      url(ROUTE_PATTERNS.charactersHomophones(":glyph")),
      () => new Promise<never>(() => {}),
    ),
    getDecomposition: http.get(
      url(ROUTE_PATTERNS.charactersDecomposition(":glyph")),
      () => new Promise<never>(() => {}),
    ),
    search: http.get(url(ROUTE_PATTERNS.charactersSearch), () => new Promise<never>(() => {})),
    frequency: http.get(
      url(ROUTE_PATTERNS.charactersFrequency),
      () => new Promise<never>(() => {}),
    ),
    getPinyinSearch: http.get(url(ROUTE_PATTERNS.pinyinSearch), () => new Promise<never>(() => {})),
  },

  empty: {
    getCharacter: http.get(url(ROUTE_PATTERNS.charactersByGlyph(":glyph")), () =>
      HttpResponse.json({ error: "Character not found", code: "NOT_FOUND" }, { status: 404 }),
    ),
    getPhonetic: http.get(url(ROUTE_PATTERNS.charactersPhonetic(":glyph")), () =>
      HttpResponse.json(
        { error: "No phonetic component found for this character", code: "NOT_FOUND" },
        { status: 404 },
      ),
    ),
    getHomophones: http.get(url(ROUTE_PATTERNS.charactersHomophones(":glyph")), ({ params }) => {
      if (params.glyph === "好") {
        return HttpResponse.json({ glyph: "好", readings: [] }, { status: 200 });
      }
      return HttpResponse.json(
        { error: "Character not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }),
    getDecomposition: http.get(
      url(ROUTE_PATTERNS.charactersDecomposition(":glyph")),
      ({ params }) => {
        if (params.glyph === "一") {
          return HttpResponse.json({ glyph: "一", components: [] }, { status: 200 });
        }
        return HttpResponse.json(
          { error: "Character not found", code: "NOT_FOUND" },
          { status: 404 },
        );
      },
    ),
    search: http.get(url(ROUTE_PATTERNS.charactersSearch), () =>
      HttpResponse.json({ data: [] }, { status: 200 }),
    ),
    frequency: http.get(url(ROUTE_PATTERNS.charactersFrequency), () =>
      HttpResponse.json({ data: [], page: 1, pageSize: 50, total: 0 }, { status: 200 }),
    ),
    getPinyinSearch: http.get(url(ROUTE_PATTERNS.pinyinSearch), () =>
      HttpResponse.json(
        { query: "", totalResults: 0, page: 1, pageSize: 50, results: [] },
        { status: 200 },
      ),
    ),
  },

  error: {
    getCharacter: http.get(url(ROUTE_PATTERNS.charactersByGlyph(":glyph")), () =>
      HttpResponse.json(
        { error: "Failed to get character detail", code: "INTERNAL_ERROR" },
        { status: 500 },
      ),
    ),
    getPhonetic: http.get(url(ROUTE_PATTERNS.charactersPhonetic(":glyph")), () =>
      HttpResponse.json(
        { error: "Failed to get phonetic component", code: "INTERNAL_ERROR" },
        { status: 500 },
      ),
    ),
    getHomophones: http.get(url(ROUTE_PATTERNS.charactersHomophones(":glyph")), () =>
      HttpResponse.json(
        { error: "Failed to get homophones", code: "INTERNAL_ERROR" },
        { status: 500 },
      ),
    ),
    getDecomposition: http.get(url(ROUTE_PATTERNS.charactersDecomposition(":glyph")), () =>
      HttpResponse.json(
        { error: "Failed to get decomposition", code: "INTERNAL_ERROR" },
        { status: 500 },
      ),
    ),
    search: http.get(url(ROUTE_PATTERNS.charactersSearch), () =>
      HttpResponse.json(
        { error: "Failed to search characters", code: "INTERNAL_ERROR" },
        { status: 500 },
      ),
    ),
    frequency: http.get(url(ROUTE_PATTERNS.charactersFrequency), () =>
      HttpResponse.json(
        { error: "Failed to get frequency list", code: "INTERNAL_ERROR" },
        { status: 500 },
      ),
    ),
    getPinyinSearch: http.get(url(ROUTE_PATTERNS.pinyinSearch), () =>
      HttpResponse.json(
        { error: "Failed to search by pinyin", code: "INTERNAL_ERROR" },
        { status: 500 },
      ),
    ),
  },
};
