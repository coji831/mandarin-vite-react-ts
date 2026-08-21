/**
 * @file apps/backend/src/modules/audio/nest/__tests__/audio-nest-controller.test.ts
 * @description Unit tests for `AudioNestController` (Story 24-10 — Audio +
 * Health Port).
 *
 * The `AudioService` facade is MOCKED (no real GCS / Google TTS / Redis), and
 * the controller's `getTtsAudio` is exercised directly. This covers the paths
 * the DB-gated parity harness covers end-to-end plus the controller-only
 * concerns: the `audioConfig.voiceDefault` default and explicit-voice
 * pass-through, the 2xx `{ audioUrl, cached }` shape, and that service errors
 * (validation 400 / tts 500) PROPAGATE unchanged (the global 24-3 filter
 * serializes them — no re-classification in the controller, mirroring the
 * Express `AudioController`).
 *
 * The controller is exercised WITHOUT HTTP (decorators are inert on direct
 * calls): `@Body`/`@Req` values are passed positionally, and the
 * `OptionalAuthGuard` is NOT in play here — its calibrated guest-vs-user
 * semantics (guest → `req.userId` undefined, never 401; registered →
 * `req.userId` attached) are proven in the integration parity harness
 * (`tests/integration/nest/audio-health-parity.test.ts`).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Stub the SharedModule import so the controller's `AUDIO_CONFIG_TOKEN` token
// resolves without pulling the entire shared infra graph into the unit test.
vi.mock("../../../nest/shared/shared.module.js", () => ({
  AUDIO_CONFIG_TOKEN: "AUDIO_CONFIG",
}));

import { AudioNestController } from "../audio-nest.controller.js";

describe("AudioNestController", () => {
  let controller: AudioNestController;
  let mockService: { getTtsUrl: ReturnType<typeof vi.fn> };
  const audioConfig = { voiceDefault: "cmn-CN-Wavenet-B" };
  const signedUrl =
    "https://storage.googleapis.com/pinyin-pal-data/tts/test.mp3?X-Goog-Signature=mock";

  beforeEach(() => {
    mockService = { getTtsUrl: vi.fn() };
    controller = new AudioNestController(mockService as never, audioConfig as never);
  });

  it("returns { audioUrl, cached } and delegates to the service with the default voice", async () => {
    mockService.getTtsUrl.mockResolvedValue({ audioUrl: signedUrl, cached: true });

    const result = await controller.getTtsAudio({ text: "你好" }, {} as never);

    expect(result).toEqual({ audioUrl: signedUrl, cached: true });
    expect(mockService.getTtsUrl).toHaveBeenCalledWith("你好", "cmn-CN-Wavenet-B");
  });

  it("passes an explicit voice through to the service", async () => {
    mockService.getTtsUrl.mockResolvedValue({ audioUrl: signedUrl, cached: false });

    await controller.getTtsAudio({ text: "你好", voice: "cmn-CN-Wavenet-C" }, {
      userId: "user-1",
    } as never);

    expect(mockService.getTtsUrl).toHaveBeenCalledWith("你好", "cmn-CN-Wavenet-C");
  });

  it("treats an undefined body as empty (degrades to the service 400, never a 500)", async () => {
    mockService.getTtsUrl.mockRejectedValue(
      Object.assign(new Error("Text is required."), {
        code: "VALIDATION_ERROR",
        statusCode: 400,
      }),
    );

    await expect(controller.getTtsAudio(undefined as never, {} as never)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      statusCode: 400,
    });
    // The default voice is still applied even with no body.
    expect(mockService.getTtsUrl).toHaveBeenCalledWith(undefined, "cmn-CN-Wavenet-B");
  });

  it("propagates a service validation error (400) unchanged — no re-classification", async () => {
    const err = Object.assign(new Error("Please enter between 1 and 15 words."), {
      code: "VALIDATION_ERROR",
      statusCode: 400,
    });
    mockService.getTtsUrl.mockRejectedValue(err);

    await expect(
      controller.getTtsAudio(
        { text: "一 二 三 四 五 六 七 八 九 十 十一 十二 十三 十四 十五 十六" },
        {} as never,
      ),
    ).rejects.toBe(err);
  });

  it("propagates an upstream TTS error (500) unchanged", async () => {
    const err = Object.assign(new Error("TTS API down"), { code: "TTS_ERROR", statusCode: 500 });
    mockService.getTtsUrl.mockRejectedValue(err);

    await expect(controller.getTtsAudio({ text: "你好" }, {} as never)).rejects.toBe(err);
  });
});
