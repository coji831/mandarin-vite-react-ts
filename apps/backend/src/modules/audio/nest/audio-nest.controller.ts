/**
 * @file apps/backend/src/modules/audio/nest/audio-nest.controller.ts
 * @description NestJS controller for the TTS route (Story 24-10 — Audio +
 * Health Port).
 *
 * Mirrors `api/AudioController.ts` (Express) 1:1 — `POST /v1/tts` verbatim:
 * the same `{ text, voice = voiceDefault }` body read, the same delegation to
 * the `AudioService` facade (reused unchanged — GCS exists-check → sign or
 * synthesize+upload+sign, `{ audioUrl, cached }`), and the same 2xx JSON
 * `{ audioUrl, cached }`. Validation / upstream failures are thrown by the
 * service and serialized by the global 24-3 `AppExceptionFilter` into the
 * `{ code, message, requestId }` envelope — identical status + body to the
 * Express `errorHandler.ts` (`validationError` → 400 `VALIDATION_ERROR`;
 * `classifyTtsError` → 500 `TTS_ERROR`).
 *
 * ## Calibrated `optionalAuth` (F5 — the post-epic-25-calibrated TTS surface)
 * `@UseGuards(OptionalAuthGuard)` mirrors the Express `optionalAuth` mount:
 *   - Guest (no token / bad token): `req.userId` stays UNDEFINED and the
 *     request NEVER 401s — the guard establishes guest identity, exactly like
 *     the Express middleware. Cache-first free reads: a GCS cache HIT returns
 *     the signed URL with `{ cached: true }` and NO billable Google TTS
 *     generation (the F5 "cache-first free-for-guests" contract, verified
 *     in-port by the 24-10 parity harness).
 *   - Registered (valid token): `req.userId` is attached (authenticated).
 * Guest-visible generation (a guest cache MISS) keeps the verbatim route
 * behavior today; per the calibration spec the generated-audio path is
 * COUNTER-GATED with the mechanics deferred to epic-29 (no counter ships here).
 *
 * The route is verbatim — the controller does not branch on `req.userId`
 * (matching Express); `req.userId` is read to surface the calibrated guest-vs-
 * user distinction that 29's counter-gating will consume.
 */

import { Body, Controller, HttpCode, Inject, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { AudioService } from "../services/AudioService.js";
import { AUDIO_CONFIG_TOKEN } from "../../../nest/shared/shared.module.js";
import { OptionalAuthGuard } from "../../../nest/guards/optional-auth.guard.js";
import type { audioConfig } from "../config.js";

/**
 * NestJS controller for text-to-speech (Story 24-10).
 */
@Controller("v1/tts")
export class AudioNestController {
  constructor(
    @Inject(AudioService) private readonly audioService: AudioService,
    @Inject(AUDIO_CONFIG_TOKEN) private readonly audioConfigValue: typeof audioConfig,
  ) {}

  /**
   * POST /v1/tts
   * Resolve a browser-playable TTS audio URL for the given Hanzi text.
   * OptionalAuthGuard: calibrated F5 — guests get cache-first free reads
   * (`req.userId` undefined, never 401); registered users are authenticated.
   * `@HttpCode(200)` mirrors the Express `res.status(200).json(...)` — Nest's
   * POST default of 201 would otherwise break status parity.
   */
  @Post()
  @HttpCode(200)
  @UseGuards(OptionalAuthGuard)
  async getTtsAudio(
    @Body() body: { text?: string; voice?: string },
    @Req() req: Request,
  ): Promise<{ audioUrl: string; cached: boolean }> {
    // Verbatim Express body read (`audioConfig.voiceDefault` default). `body ??
    // {}` guards the no-body edge (Express destructures `req.body` directly,
    // which 500s on an absent body-parser run; here it degrades to the
    // service's clean 400 VALIDATION_ERROR "Text is required.").
    const { text, voice = this.audioConfigValue.voiceDefault } = body ?? {};

    // `req.userId` is read (not branched on) to surface the calibrated
    // guest-vs-user distinction for the F5 surface (guest → undefined;
    // registered → userId). Errors are classified by AudioService.getTtsUrl
    // (validationError / ttsError) and propagate as-is — no re-classification
    // here (avoids drift with the Express controller).
    void req.userId;
    // `text` is typed optional on the body; the service validates `undefined`
    // at runtime (400 "Text is required.") — the cast mirrors the Express
    // controller, which passes the raw (any-typed) body straight through.
    const { audioUrl, cached } = await this.audioService.getTtsUrl(text as string, voice);
    return { audioUrl, cached };
  }
}
