/**
 * @file mocks/handlers/phonetic-clusters-handlers.ts
 * @description MSW handlers for Phonetic Clusters API endpoints
 * Story 21.6: Phonetic Clusters
 *
 * Provides factory functions for all states: default (populated), loading, empty, error.
 * Handles optional ?hskLevel=N query parameter for filtering.
 */

import { http, HttpResponse } from "msw";
import type { PhoneticClusterDetail } from "../../features/phonetic-clusters/types";

const API_BASE = "http://localhost:3001/api/v1";

// ─── Sample Data ──────────────────────────────────────────────────────

const sampleClusters: PhoneticClusterDetail[] = [
  {
    id: "pc_0001",
    phoneticPattern: "青",
    pinyin: "qīng",
    description: "Characters containing 青 as phonetic component",
    pronunciationNote: "All characters share qing- onset but differ in tone",
    memberCount: 4,
    hskLevels: [1, 2],
    members: [
      { glyph: "请", pinyin: "qǐng", meaning: "please", hskLevel: 1 },
      { glyph: "情", pinyin: "qíng", meaning: "feeling", hskLevel: 2 },
      { glyph: "清", pinyin: "qīng", meaning: "clear", hskLevel: 2 },
      { glyph: "晴", pinyin: "qíng", meaning: "clear (weather)", hskLevel: 2 },
    ],
  },
  {
    id: "pc_0002",
    phoneticPattern: "包",
    pinyin: "bāo",
    description: "Characters containing 包 as phonetic component",
    pronunciationNote: "Most read bāo/bǎo/páo — phonetic drift from original bāo",
    memberCount: 5,
    hskLevels: [2, 3],
    members: [
      { glyph: "包", pinyin: "bāo", meaning: "to wrap", hskLevel: 3 },
      { glyph: "跑", pinyin: "pǎo", meaning: "to run", hskLevel: 2 },
      { glyph: "炮", pinyin: "pào", meaning: "cannon", hskLevel: null },
      { glyph: "抱", pinyin: "bào", meaning: "to hug", hskLevel: 2 },
      { glyph: "饱", pinyin: "bǎo", meaning: "full (stomach)", hskLevel: 2 },
    ],
  },
  // Extra mock-only clusters not yet in seed data — provide Storybook variety
  {
    id: "pc_0003",
    phoneticPattern: "白",
    pinyin: "bái",
    description: "Characters containing 白 as phonetic component",
    pronunciationNote: "Also functions as a semantic component for brightness",
    memberCount: 2,
    hskLevels: [1, 3],
    members: [
      { glyph: "百", pinyin: "bǎi", meaning: "hundred", hskLevel: 1 },
      { glyph: "拍", pinyin: "pāi", meaning: "to clap", hskLevel: 3 },
    ],
  },
  // Extra mock-only clusters not yet in seed data — provide Storybook variety
  {
    id: "pc_0004",
    phoneticPattern: "方",
    pinyin: "fāng",
    description: "Characters containing 方 as phonetic component",
    pronunciationNote: null,
    memberCount: 3,
    hskLevels: [2, 3, 4],
    members: [
      { glyph: "放", pinyin: "fàng", meaning: "to put", hskLevel: 2 },
      { glyph: "房", pinyin: "fáng", meaning: "house", hskLevel: 2 },
      { glyph: "防", pinyin: "fáng", meaning: "to prevent", hskLevel: 4 },
    ],
  },
  // Extra mock-only clusters not yet in seed data — provide Storybook variety
  {
    id: "pc_0005",
    phoneticPattern: "工",
    pinyin: "gōng",
    description: "Characters containing 工 as phonetic component",
    pronunciationNote: null,
    memberCount: 3,
    hskLevels: [1, 2, 4],
    members: [
      { glyph: "功", pinyin: "gōng", meaning: "achievement", hskLevel: 4 },
      { glyph: "攻", pinyin: "gōng", meaning: "to attack", hskLevel: 4 },
      { glyph: "空", pinyin: "kōng", meaning: "empty", hskLevel: 2 },
    ],
  },
];

// ─── Handler Factories ────────────────────────────────────────────────

export const phoneticClustersHandlers = {
  /**
   * Populated list handler with optional HSK level filtering
   */
  default: (hskLevel?: number) =>
    http.get(`${API_BASE}/phonetic-clusters`, ({ request }) => {
      // Support both explicit hskLevel and query parameter from URL
      const url = new URL(request.url);
      const level =
        hskLevel ??
        (url.searchParams.get("hskLevel") ? Number(url.searchParams.get("hskLevel")) : undefined);

      let data = sampleClusters;
      if (level !== undefined) {
        data = sampleClusters.filter((c) => c.hskLevels.includes(level));
      }

      return HttpResponse.json({ data }, { status: 200 });
    }),

  /**
   * Loading state — never resolves
   */
  loading: () => http.get(`${API_BASE}/phonetic-clusters`, () => new Promise<never>(() => {})),

  /**
   * Empty state — returns empty array
   */
  empty: () =>
    http.get(`${API_BASE}/phonetic-clusters`, () =>
      HttpResponse.json({ data: [] }, { status: 200 }),
    ),

  /**
   * Error state — returns 500
   */
  error: () =>
    http.get(`${API_BASE}/phonetic-clusters`, () =>
      HttpResponse.json({ error: "Failed to load phonetic clusters" }, { status: 500 }),
    ),
};
