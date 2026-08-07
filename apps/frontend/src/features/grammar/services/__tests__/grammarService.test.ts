/**
 * @file services/__tests__/grammarService.test.ts
 * @description Integration tests (Testing Trophy, INTEGRATION tier) for
 * `grammarService` — list with filters, detail, error, and module-level cache
 * invalidation.
 * Story 22.3: Grammar UI
 *
 * Uses the REAL `apiClient` intercepted by the MSW node server
 * (`src/mocks/server` + `grammar-handlers`), proving the full
 * service → axios → network-layer wiring without a backend.
 */
import { describe, expect, it, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { server, grammarHandlers } from "src/mocks/server";
import { grammarService } from "../grammarService";

const LIST_URL = `http://localhost:3001/api${ROUTE_PATTERNS.grammarPatterns}`;
const DETAIL_URL = `http://localhost:3001/api${ROUTE_PATTERNS.grammarPatternById("gr_0018")}`;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  grammarService.clearCache();
});
afterAll(() => server.close());

describe("grammarService (integration + MSW)", () => {
  it("loads the full list with the default grammar handlers", async () => {
    server.use(...grammarHandlers.default());

    const patterns = await grammarService.loadPatterns();

    expect(patterns.map((p) => p.id)).toEqual(["gr_0005", "gr_0018", "gr_0019"]);
    expect(patterns[0].name).toBe("吗 yes/no questions");
    expect(patterns[0].previewExample).toBe("你好吗？");
  });

  it("passes non-empty filters to the list endpoint and returns the filtered page", async () => {
    // The default handler filters list responses by ?phase= and ?hskLevel=
    server.use(...grammarHandlers.default());

    const patterns = await grammarService.loadPatterns({ phase: 4, hskLevel: 4 });

    expect(patterns.map((p) => p.id)).toEqual(["gr_0018", "gr_0019"]);
  });

  it("loads a single pattern detail (structure, examples, related patterns)", async () => {
    server.use(...grammarHandlers.default());

    const pattern = await grammarService.loadPatternById("gr_0018");

    expect(pattern.id).toBe("gr_0018");
    expect(pattern.explanation).toContain("把");
    expect(pattern.examples).toHaveLength(2);
    expect(pattern.examples[0].segments.length).toBeGreaterThan(0);
    expect(pattern.relatedPatterns.map((r) => r.id)).toContain("gr_0019");
  });

  it("rejects when the list endpoint returns a server error", async () => {
    server.use(...grammarHandlers.error());

    await expect(grammarService.loadPatterns()).rejects.toThrow();
  });

  it("serves list results from the module cache and refetches after clearCache()", async () => {
    let listCalls = 0;
    server.use(
      http.get(LIST_URL, () => {
        listCalls += 1;
        return HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }, { status: 200 });
      }),
    );

    await grammarService.loadPatterns();
    await grammarService.loadPatterns(); // cached — no second request
    expect(listCalls).toBe(1);

    grammarService.clearCache();
    await grammarService.loadPatterns();
    expect(listCalls).toBe(2);
  });

  it("serves detail results from the module cache keyed by id", async () => {
    let detailCalls = 0;
    server.use(
      http.get(DETAIL_URL, () => {
        detailCalls += 1;
        return HttpResponse.json(
          {
            id: "gr_0018",
            name: "把 (bǎ)",
            structure: "S + 把",
            explanation: "x",
            phase: 4,
            hskLevel: 4,
            sortOrder: 18,
            examples: [],
            relatedPatterns: [],
          },
          { status: 200 },
        );
      }),
    );

    const first = await grammarService.loadPatternById("gr_0018");
    const second = await grammarService.loadPatternById("gr_0018");
    expect(first.id).toBe("gr_0018");
    expect(second.id).toBe("gr_0018");
    expect(detailCalls).toBe(1);

    grammarService.clearCache();
    await grammarService.loadPatternById("gr_0018");
    expect(detailCalls).toBe(2);
  });
});
