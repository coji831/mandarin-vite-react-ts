import { describe, it, expect, vi, beforeEach } from "vitest";
import { CachedExampleService } from "../../src/core/services/CachedExampleService.js";

describe("CachedExampleService integration (with mocked deps)", () => {
  let exampleServiceMock;
  let redisLockMock;
  let gcsServiceMock;
  let hmacManagerMock;
  let sut;

  beforeEach(() => {
    exampleServiceMock = { generateExamples: vi.fn().mockResolvedValue({ examples: ["gen"] }) };
    redisLockMock = { acquire: vi.fn().mockResolvedValue(true), release: vi.fn().mockResolvedValue(true) };
    gcsServiceMock = { get: vi.fn().mockResolvedValue(null), set: vi.fn().mockResolvedValue(undefined) };
    hmacManagerMock = { deriveKey: vi.fn().mockReturnValue("hk-123") };
    sut = new CachedExampleService(exampleServiceMock, redisLockMock, gcsServiceMock, hmacManagerMock);
  });

  it("returns cached value when GCS has data (cache hit)", async () => {
    gcsServiceMock.get.mockResolvedValueOnce({ examples: ["cached"] });
    const res = await sut.generateExamples("word", 1, "zh");
    expect(res).toEqual({ examples: ["cached"] });
    expect(exampleServiceMock.generateExamples).not.toHaveBeenCalled();
  });

  it("generates and persists on cache miss when lock acquired", async () => {
    gcsServiceMock.get.mockResolvedValueOnce(null);
    redisLockMock.acquire.mockResolvedValueOnce(true);
    const res = await sut.generateExamples("word", 1, "zh");
    expect(exampleServiceMock.generateExamples).toHaveBeenCalled();
    expect(gcsServiceMock.set).toHaveBeenCalled();
    expect(redisLockMock.release).toHaveBeenCalled();
    expect(res).toEqual({ examples: ["gen"] });
  });

  it("falls back to uncached generation when lock not acquired", async () => {
    gcsServiceMock.get.mockResolvedValueOnce(null);
    redisLockMock.acquire.mockResolvedValueOnce(false);
    const res = await sut.generateExamples("word", 1, "zh");
    expect(exampleServiceMock.generateExamples).toHaveBeenCalled();
    expect(gcsServiceMock.set).not.toHaveBeenCalled();
    expect(res).toEqual({ examples: ["gen"] });
  });

  it("second request sees persisted cache after first generates and persists", async () => {
    // First call: miss -> acquire -> generate -> persist
    gcsServiceMock.get.mockResolvedValueOnce(null);
    redisLockMock.acquire.mockResolvedValueOnce(true);
    await sut.generateExamples("word", 1, "zh");
    expect(gcsServiceMock.set).toHaveBeenCalled();

    // Simulate GCS now has persisted object
    gcsServiceMock.get.mockResolvedValueOnce({ examples: ["persisted"] });
    const res2 = await sut.generateExamples("word", 1, "zh");
    expect(res2).toEqual({ examples: ["persisted"] });
  });

  it("propagates exampleService errors", async () => {
    gcsServiceMock.get.mockResolvedValueOnce(null);
    redisLockMock.acquire.mockResolvedValueOnce(false);
    exampleServiceMock.generateExamples.mockRejectedValueOnce(new Error("generator fail"));
    await expect(sut.generateExamples("word", 1, "zh")).rejects.toThrow("generator fail");
  });

  it("continues generation when GCS read fails and still persists best-effort", async () => {
    gcsServiceMock.get.mockRejectedValueOnce(new Error("gcs read error"));
    redisLockMock.acquire.mockResolvedValueOnce(true);
    gcsServiceMock.set.mockRejectedValueOnce(new Error("gcs write error"));
    const res = await sut.generateExamples("word", 1, "zh");
    expect(res).toEqual({ examples: ["gen"] });
    expect(redisLockMock.release).toHaveBeenCalled();
  });
});
