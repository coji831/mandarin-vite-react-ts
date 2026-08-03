/**
 * @file shared/services/audio/__tests__/audioService.test.ts
 * @description Integration test (MSW) for `AudioBackend.fetchWordAudio` error
 * discrimination (Phase A fix).
 *
 * Verifies the backend preserves typed failure info through the real apiClient
 * (interceptors included): auth 401/403, rate-limit 429, server 5xx, network —
 * so the resolver can apply its fallback policy instead of swallowing errors
 * into a generic message.
 */

import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server } from "src/mocks/server";
import { AudioBackend } from "../audioService";
import { WordAudioError } from "../errors";

const TTS_URL = "http://localhost:3001/api/v1/tts";
const REFRESH_URL = "http://localhost:3001/api/v1/auth/refresh";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  localStorage.removeItem("accessToken");
});
afterAll(() => server.close());

describe("AudioBackend.fetchWordAudio", () => {
  it("returns the word audio on success (surfaces the backend `cached` flag)", async () => {
    server.use(
      http.post(TTS_URL, () =>
        HttpResponse.json({
          audioUrl: "https://cdn/好.mp3",
          text: "好",
          languageCode: "zh-CN",
          cached: true,
        }),
      ),
    );
    const result = await new AudioBackend().fetchWordAudio({ chinese: "好" });
    expect(result.audioUrl).toBe("https://cdn/好.mp3");
    expect(result.text).toBe("好");
    expect(result.cached).toBe(true);
  });

  it("classifies a 401 as auth failure", async () => {
    server.use(
      http.post(REFRESH_URL, () => HttpResponse.json({ error: "MISSING_TOKEN" }, { status: 400 })),
      http.post(TTS_URL, () => HttpResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })),
    );
    await expect(new AudioBackend().fetchWordAudio({ chinese: "好" })).rejects.toMatchObject({
      kind: "auth",
      status: 401,
    });
  });

  it("classifies a 403 as auth failure", async () => {
    server.use(
      http.post(TTS_URL, () => HttpResponse.json({ error: "Forbidden" }, { status: 403 })),
    );
    await expect(new AudioBackend().fetchWordAudio({ chinese: "好" })).rejects.toMatchObject({
      kind: "auth",
      status: 403,
    });
  });

  it("classifies a 429 as rate-limit", async () => {
    server.use(
      http.post(TTS_URL, () => HttpResponse.json({ error: "RATE_LIMIT" }, { status: 429 })),
    );
    await expect(new AudioBackend().fetchWordAudio({ chinese: "好" })).rejects.toMatchObject({
      kind: "rate-limit",
      status: 429,
    });
  });

  it("classifies a 5xx as server", async () => {
    server.use(http.post(TTS_URL, () => HttpResponse.json({ error: "boom" }, { status: 500 })));
    await expect(new AudioBackend().fetchWordAudio({ chinese: "好" })).rejects.toMatchObject({
      kind: "server",
      status: 500,
    });
  });

  it("classifies a network failure as network", async () => {
    server.use(http.post(TTS_URL, () => HttpResponse.error()));
    await expect(new AudioBackend().fetchWordAudio({ chinese: "好" })).rejects.toMatchObject({
      kind: "network",
    });
  });

  it("throws typed WordAudioError instances", async () => {
    server.use(http.post(TTS_URL, () => HttpResponse.json({ error: "boom" }, { status: 500 })));
    try {
      await new AudioBackend().fetchWordAudio({ chinese: "好" });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(WordAudioError);
      expect((err as WordAudioError).kind).toBe("server");
    }
  });
});
