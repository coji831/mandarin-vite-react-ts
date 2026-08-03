/**
 * @file apps/backend/src/modules/audio/api/AudioController.ts
 * @description Audio controller — thin HTTP layer for text-to-speech generation.
 * Business logic delegated to AudioService. Mounts the public wire path
 * `POST /v1/tts` (unchanged API contract — ROUTE_PATTERNS.ttsAudio).
 *
 * @class
 */
import type { Request, Response } from "express";
import { audioConfig } from "../config.js";
import type { AudioServiceLike } from "../types/audio.js";

class AudioController {
  private audioService: AudioServiceLike;

  /**
   * @param audioService - Audio service with business logic + caching
   */
  constructor(audioService: AudioServiceLike) {
    this.audioService = audioService;
  }

  /**
   * Generate TTS audio
   * POST / (mounted at ROUTE_PATTERNS.ttsAudio = "/v1/tts")
   */
  async getTtsAudio(req: Request, res: Response): Promise<void> {
    const { text, voice = audioConfig.voiceDefault } = req.body;

    // Errors are already classified by AudioService.getTtsUrl (validationError
    // for invalid input, ttsError for upstream GCS/TTS failures) — propagate
    // as-is to asyncHandler → errorHandler. No re-classification here (avoids
    // drift).
    const { audioUrl, cached } = await this.audioService.getTtsUrl(text, voice);
    res.status(200).json({ audioUrl, cached });
  }
}

export default AudioController;
