/**
 * @file handlers/radicals-handlers.ts
 * @description MSW handlers for radical characters endpoints
 * Story 21.11: Data Consistency Cleanup
 */

import { http, HttpResponse, delay } from "msw";

const BASE = "/api/v1/radicals";

export const radicalsHandlers = [
  http.get(`${BASE}/:radicalId/characters`, async ({ params }) => {
    const { radicalId } = params;
    return HttpResponse.json({
      radicalId,
      characters: [
        { glyph: "一", pinyin: "yī", meaning: "one", decompositionType: "semantic", hskLevel: 1 },
        { glyph: "七", pinyin: "qī", meaning: "seven", decompositionType: null, hskLevel: 1 },
      ],
    });
  }),
];

export const radicalsLoadingHandler = http.get(`${BASE}/:radicalId/characters`, async () => {
  await delay("infinite");
});

export const radicalsEmptyHandler = http.get(
  `${BASE}/:radicalId/characters`,
  async ({ params }) => {
    const { radicalId } = params;
    return HttpResponse.json({ radicalId, characters: [] });
  },
);

export const radicalsErrorHandler = http.get(`${BASE}/:radicalId/characters`, async () => {
  return HttpResponse.json(
    { error: "Failed to load radical characters", code: "LOAD_ERROR" },
    { status: 500 },
  );
});
