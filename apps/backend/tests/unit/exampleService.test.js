import { describe, it, expect, vi, beforeEach } from "vitest";

import ExampleService from "../../src/services/exampleService.js";
import * as gemini from "../../src/services/geminiClient.js";

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

    const svc = new ExampleService(mockGcs);

    const res = await svc.generateSingleLineExample({ word: "饭", hskLevel: 1, language: "zh-CN" });

    expect(res).toMatchObject(cachedObj);
    expect(mockGcs.get).toHaveBeenCalled();
    // Should not call Gemini when cache present
    const geminiSpy = vi.spyOn(gemini, "generateStructured");
    expect(geminiSpy).not.toHaveBeenCalled();
  });

  it("happy path: generates, validates, caches and returns result", async () => {
    const mockGcs = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    };

    const generated = { chinese: "我吃饭", pinyin: "wǒ chī fàn", english: "I eat rice" };

    vi.spyOn(gemini, "generateStructured").mockResolvedValue(generated);

    const svc = new ExampleService(mockGcs);

    const result = await svc.generateSingleLineExample({
      word: "饭",
      hskLevel: 1,
      language: "zh-CN",
    });

    expect(result).toEqual(generated);
    expect(mockGcs.set).toHaveBeenCalledOnce();
  });

  it("validation retry: retries generation once when output fails validation then succeeds", async () => {
    const mockGcs = { get: vi.fn().mockResolvedValue(null), set: vi.fn() };

    const invalid = { chinese: "我吃饭", pinyin: "", english: "I eat" };
    const valid = { chinese: "我吃饭", pinyin: "wǒ chī fàn", english: "I eat" };

    const genSpy = vi.spyOn(gemini, "generateStructured");
    genSpy.mockResolvedValueOnce(invalid).mockResolvedValueOnce(valid);

    const svc = new ExampleService(mockGcs);
    const res = await svc.generateSingleLineExample({ word: "饭", hskLevel: 1, language: "zh-CN" });

    expect(genSpy).toHaveBeenCalledTimes(2);
    expect(res).toEqual(valid);
  });
});
