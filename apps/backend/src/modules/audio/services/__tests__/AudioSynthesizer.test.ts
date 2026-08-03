/**
 * @file apps/backend/src/modules/audio/services/__tests__/AudioSynthesizer.test.ts
 * @description Unit tests for AudioSynthesizer — the unified exists-or-synthesize
 * primitive (D4). Pins the contract:
 *   - exists → `cached:true`, sign fresh URL, NO upstream synthesize
 *   - miss → synthesize + upload to the GIVEN path + record path in Redis →
 *     `cached:false`
 *   - upstream synthesize failure → standardized TTS_ERROR
 *
 * The synthesizeSpeech options are passed EXPLICITLY from modules/audio/config.ts
 * (voice/languageCode/audioEncoding) — the Tier-0 client carries no config.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    cacheHit: vi.fn(),
    cacheMiss: vi.fn(),
  })),
}));

import { AudioPathCache } from "../AudioPathCache.js";
import { AudioSynthesizer } from "../AudioSynthesizer.js";

describe("AudioSynthesizer", () => {
  let synthesizer: AudioSynthesizer;
  let mockCache: any;
  let mockGcs: any;
  let mockTts: any;

  const text = "你好。";
  const voice = "cmn-CN-Wavenet-B";
  const path = "tts/passagehash/0.mp3";
  const redisKey = "tts:path:passagehash";
  const ttl = 86400;
  const signedUrl = `https://storage.googleapis.com/bucket/${path}?X-Goog-Signature=abc`;
  const ttsOptions = { voice, languageCode: "cmn-CN", audioEncoding: "MP3" };

  beforeEach(() => {
    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    mockGcs = {
      fileExists: vi.fn(),
      uploadFile: vi.fn(),
      getSignedUrl: vi.fn(async (_p: string) => signedUrl),
    };
    mockTts = {
      synthesizeSpeech: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      healthCheck: vi.fn(),
    };
    synthesizer = new AudioSynthesizer(new AudioPathCache(mockCache), mockGcs, mockTts);
  });

  it("should return cached:true and sign a fresh URL when the file exists (no upstream synthesize)", async () => {
    mockGcs.fileExists.mockResolvedValue(true);

    const result = await synthesizer.synthesizeToPath(text, path, voice);

    expect(mockGcs.fileExists).toHaveBeenCalledWith(path);
    expect(mockGcs.getSignedUrl).toHaveBeenCalledWith(path, 3600);
    expect(mockTts.synthesizeSpeech).not.toHaveBeenCalled();
    expect(mockGcs.uploadFile).not.toHaveBeenCalled();
    expect(mockCache.set).not.toHaveBeenCalled();
    expect(result).toEqual({ audioUrl: signedUrl, cached: true });
  });

  it("should synthesize, upload to the GIVEN path, sign, and record the path on a miss", async () => {
    mockGcs.fileExists.mockResolvedValue(false);
    const audioBuffer = new Uint8Array([4, 5, 6]);
    mockTts.synthesizeSpeech.mockResolvedValue(audioBuffer);

    const result = await synthesizer.synthesizeToPath(text, path, voice);

    expect(mockGcs.fileExists).toHaveBeenCalledWith(path);
    expect(mockTts.synthesizeSpeech).toHaveBeenCalledWith(text, ttsOptions);
    expect(mockGcs.uploadFile).toHaveBeenCalledWith(path, audioBuffer, "audio/mpeg");
    expect(mockGcs.getSignedUrl).toHaveBeenCalledWith(path, 3600);
    expect(mockCache.set).toHaveBeenCalledWith(redisKey, path, ttl);
    expect(result).toEqual({ audioUrl: signedUrl, cached: false });
  });

  it("should default the voice to the audio config default when not provided", async () => {
    mockGcs.fileExists.mockResolvedValue(false);

    await synthesizer.synthesizeToPath(text, path);

    expect(mockTts.synthesizeSpeech).toHaveBeenCalledWith(text, {
      voice: "cmn-CN-Wavenet-B",
      languageCode: "cmn-CN",
      audioEncoding: "MP3",
    });
  });

  it("should propagate a standardized TTS_ERROR when synthesis fails", async () => {
    mockGcs.fileExists.mockResolvedValue(false);
    mockTts.synthesizeSpeech.mockRejectedValue(new Error("TTS API down"));

    await expect(synthesizer.synthesizeToPath(text, path, voice)).rejects.toMatchObject({
      code: "TTS_ERROR",
    });
  });
});
