import { describe, it, expect, vi, beforeEach } from "vitest";

import { ExampleService } from "../services/ExampleService.js";
import * as geminiClient from "../../../infrastructure/external/GeminiClient.js";

describe("ExampleService - core flows", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns cached value when present (cache hit)", async () => {
    const cachedObj = { chinese: "我吃饭", pinyin: "wǒ chī fàn", english: "I eat" };

    const mockGcs = {
      get: vi.fn().mockResolvedValue(cachedObj),
      set: vi.fn(),
    };

    const svc = new ExampleService({ gcsService: mockGcs, geminiClient });

    const res = await svc.generateSingleLineExample({ word: "饭", hskLevel: 1, language: "zh-CN" });

    // Service wraps cached result in an array with _cache flag
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ ...cachedObj, _cache: true });
    expect(mockGcs.get).toHaveBeenCalled();
    // Should not call Gemini when cache present
    const geminiSpy = vi.spyOn(geminiClient, "generateText");
    expect(geminiSpy).not.toHaveBeenCalled();
  });

  it("happy path: generates, validates, caches and returns result", async () => {
    const mockGcs = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    };

    const generated = { chinese: "我吃饭", pinyin: "wǒ chī fàn", english: "I eat rice" };

    vi.spyOn(geminiClient, "generateText").mockResolvedValue(JSON.stringify(generated));

    const svc = new ExampleService({ gcsService: mockGcs, geminiClient });

    const result = await svc.generateSingleLineExample({
      word: "饭",
      hskLevel: 1,
      language: "zh-CN",
    });

    expect(result).toEqual([generated]);
    expect(mockGcs.set).toHaveBeenCalledOnce();
  });

  it("validation retry: retries generation once when output fails validation then succeeds", async () => {
    const mockGcs = { get: vi.fn().mockResolvedValue(null), set: vi.fn() };

    const invalid = { chinese: "我吃饭", pinyin: "", english: "I eat" };
    const valid = { chinese: "我吃饭", pinyin: "wǒ chī fàn", english: "I eat" };

    const genSpy = vi.spyOn(geminiClient, "generateText");
    genSpy
      .mockResolvedValueOnce(JSON.stringify(invalid))
      .mockResolvedValueOnce(JSON.stringify(valid));

    const svc = new ExampleService({ gcsService: mockGcs, geminiClient });
    const res = await svc.generateSingleLineExample({ word: "饭", hskLevel: 1, language: "zh-CN" });

    expect(genSpy).toHaveBeenCalledTimes(2);
    expect(res).toEqual([valid]);
  });
});
