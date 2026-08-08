/**
 * @file services/__tests__/chengyuService.test.ts
 * @description Integration tests (Testing Trophy, INTEGRATION tier) for
 * `chengyuService` — list with filters, detail, error, and module-level cache
 * behavior. Story 23.3: Chengyu UI
 *
 * Runs through the REAL `apiClient`, intercepted by the MSW node server
 * (`src/mocks/server` + 23.2-owned `chengyu-handlers`).
 */
import { describe, expect, it, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { server, chengyuHandlers } from "src/mocks/server";
import { chengyuService } from "../chengyuService";

const LIST_URL = `http://localhost:3001/api${ROUTE_PATTERNS.chengyuIdioms}`;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  chengyuService.clearCache();
});
afterAll(() => server.close());

describe("chengyuService (integration + MSW)", () => {
  it("loads the full idiom list and maps summaries to the display model", async () => {
    server.use(...chengyuHandlers.default());

    const result = await chengyuService.loadIdioms();
    const idioms = result.items;

    expect(idioms.map((i) => i.id)).toEqual(["cy_0001", "cy_0005", "cy_0016"]);
    expect(idioms[0].chengyu).toBe("破釜沉舟");
    expect(idioms[0].previewExample).toContain("破釜沉舟");
    expect(idioms[0].exampleCount).toBe(1);
    // Pagination metadata surfaces from the envelope so the UI can render controls.
    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("composes the theme filter param and returns matching idioms", async () => {
    server.use(...chengyuHandlers.default());

    const idioms = (await chengyuService.loadIdioms({ theme: "hypocrisy" })).items;

    expect(idioms.map((i) => i.id)).toEqual(["cy_0005"]);
    expect(idioms[0].chengyu).toBe("叶公好龙");
  });

  it("composes the era filter param and returns matching idioms", async () => {
    server.use(...chengyuHandlers.default());

    const idioms = (await chengyuService.loadIdioms({ era: "Han" })).items;

    expect(idioms.map((i) => i.id)).toEqual(["cy_0016"]);
  });

  it("loads a single idiom detail (story, examples with segments, related idioms)", async () => {
    server.use(...chengyuHandlers.default());

    const detail = await chengyuService.loadIdiomById("cy_0001");

    expect(detail.id).toBe("cy_0001");
    expect(detail.story).toContain("Xiang Yu");
    expect(detail.literalMeaning).toContain("Break the pots");
    expect(detail.figurativeMeaning).toContain("burn one's bridges");
    // Segments carry the seed content_id (character/word) — the hub translates to glyphs.
    expect(detail.examples[0].segments[0]).toMatchObject({
      text: "破",
      entityType: "character",
      entityId: "ch_30772",
    });
    expect(detail.relatedIdioms.map((r) => r.id)).toEqual(["cy_0042", "cy_0016"]);
  });

  it("rejects when the list endpoint returns a server error", async () => {
    server.use(...chengyuHandlers.error());

    await expect(chengyuService.loadIdioms()).rejects.toThrow();
  });

  it("rejects when the detail endpoint returns a server error", async () => {
    server.use(...chengyuHandlers.error());

    await expect(chengyuService.loadIdiomById("cy_0001")).rejects.toThrow();
  });

  it("serves list results from the module cache and refetches after clearCache()", async () => {
    let calls = 0;
    server.use(
      http.get(LIST_URL, () => {
        calls += 1;
        return HttpResponse.json(
          {
            items: [
              {
                id: "cy_0001",
                chengyu: "破釜沉舟",
                pinyin: "pò fǔ chén zhōu",
                literalMeaning: "Break the pots and sink the boats",
                figurativeMeaning: "To burn one's bridges",
                era: "Qin–Han transition",
                theme: "determination",
                sortOrder: 1,
                exampleCount: 1,
                previewExample: "他已经决定要破釜沉舟，全力投入新的工作。",
              },
            ],
            total: 1,
            page: 1,
            pageSize: 20,
          },
          { status: 200 },
        );
      }),
    );

    const first = await chengyuService.loadIdioms({ theme: "determination" });
    const second = await chengyuService.loadIdioms({ theme: "determination" });
    expect(calls).toBe(1); // second call served from cache
    expect(second).toEqual(first);

    chengyuService.clearCache();
    await chengyuService.loadIdioms({ theme: "determination" });
    expect(calls).toBe(2); // refetched after invalidation
  });

  it("forwards page/pageSize params and scopes the list cache by page", async () => {
    // 3-item dataset, pageSize 2 → page 1 = [1,2], page 2 = [3]. The handler
    // records the received params so we can assert the service forwarded them.
    const makeIdiom = (n: number) => ({
      id: `cy_${String(n).padStart(4, "0")}`,
      chengyu: `成语${n}`,
      pinyin: `pīn yīn ${n}`,
      literalMeaning: `Literal ${n}`,
      figurativeMeaning: `Figurative ${n}`,
      era: "Han",
      theme: "determination",
      sortOrder: n,
      exampleCount: 1,
      previewExample: `例句${n}`,
    });
    const all = [1, 2, 3].map(makeIdiom);
    const requested: Array<{ page: number; pageSize: number }> = [];

    server.use(
      http.get(LIST_URL, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? 1);
        const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
        requested.push({ page, pageSize });
        const start = (page - 1) * pageSize;
        return HttpResponse.json(
          { items: all.slice(start, start + pageSize), total: all.length, page, pageSize },
          { status: 200 },
        );
      }),
    );

    const pageOne = await chengyuService.loadIdioms({ page: 1, pageSize: 2 });
    const pageTwo = await chengyuService.loadIdioms({ page: 2, pageSize: 2 });

    // page + pageSize are forwarded as query params.
    expect(requested).toEqual([
      { page: 1, pageSize: 2 },
      { page: 2, pageSize: 2 },
    ]);
    // Page 2 is NOT served page-1 data (cache key includes page).
    expect(pageOne.items.map((i) => i.id)).toEqual(["cy_0001", "cy_0002"]);
    expect(pageTwo.items.map((i) => i.id)).toEqual(["cy_0003"]);
    expect(pageOne.total).toBe(3);
    expect(pageTwo.total).toBe(3);

    // Repeating the exact page-1 call is served from the module cache.
    const cached = await chengyuService.loadIdioms({ page: 1, pageSize: 2 });
    expect(requested).toHaveLength(2);
    expect(cached).toEqual(pageOne);
  });

  it("serves detail results from the module cache keyed by id", async () => {
    let calls = 0;
    server.use(
      http.get(LIST_URL.replace("idioms", "idioms/cy_0001"), () => {
        calls += 1;
        return HttpResponse.json(
          {
            id: "cy_0001",
            chengyu: "破釜沉舟",
            pinyin: "pò fǔ chén zhōu",
            literalMeaning: "Break the pots and sink the boats",
            figurativeMeaning: "To burn one's bridges",
            story: "In 207 BCE…",
            storySource: "《史记》",
            era: "Qin–Han transition",
            theme: "determination",
            sortOrder: 1,
            examples: [],
            relatedIdioms: [],
          },
          { status: 200 },
        );
      }),
    );

    const first = await chengyuService.loadIdiomById("cy_0001");
    const second = await chengyuService.loadIdiomById("cy_0001");
    expect(calls).toBe(1); // second call served from the detail cache
    expect(second).toEqual(first);
  });
});
