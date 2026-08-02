/**
 * @file apps/backend/src/modules/readers/services/ReadersAudioService.ts
 * @description Orchestrates two-tier audio resolution for passage sentences.
 *
 * Flow per sentence:
 *   1. GCS lookup — check if `tts/{passageHash}/{sentenceIndex}.mp3` exists
 *   2. On-demand TTS — if GCS miss, delegate to TtsService.getTtsUrl()
 *   3. Failed — if TTS throws, mark as failed
 *
 * Uses Promise.allSettled — per-sentence errors never fail the whole batch.
 *
 * Architecture note: Tier 2 delegates to TtsService instead of calling the
 * TTS client directly, avoiding duplication of GCS upload and TTS synthesis
 * logic that already exists in the shared TtsService.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import { computeHash } from "../../../shared/utils/hashUtils.js";
import type { PassageRecord, PassageContent } from "../types/readers.js";
import type {
  PassageAudioResponse,
  SentenceAudioResult,
  AudioSource,
} from "../types/readers-audio.js";

const logger = createLogger("ReadersAudioService");

/**
 * Minimal GCS client interface expected by ReadersAudioService.
 */
export interface GcsClientLike {
  fileExists(path: string): Promise<boolean>;
  getSignedUrl(path: string, expirySeconds?: number): Promise<string>;
}

/**
 * Minimal TtsService interface expected by ReadersAudioService.
 * Matches the TtsService.getTtsUrl() contract to avoid tight coupling.
 */
export interface TtsServiceLike {
  getTtsUrl(text: string, voice?: string): Promise<{ audioUrl: string }>;
}

/**
 * ReadersAudioService — resolves audio URLs for all sentences in a passage.
 *
 * Two-tier fallback:
 *   Tier 1: GCS (pre-generated audio from seed/previous runs) — fast-path
 *   Tier 2: On-demand TTS via TtsService (handles generation + caching)
 */
export class ReadersAudioService {
  constructor(
    private readonly ttsService: TtsServiceLike,
    private readonly gcsClient: GcsClientLike,
  ) {
    logger.info("Initialized ReadersAudioService");
  }

  /**
   * Get audio URLs for every sentence in a passage.
   * Passage hash = SHA256 of concatenated sentence texts.
   * GCS path format: `tts/{passageHash}/{sentenceIndex}.mp3`
   *
   * Always returns 200-compatible response — per-sentence failures are
   * reported via `source: "failed"` instead of throwing.
   */
  async getPassageAudio(passage: PassageRecord): Promise<PassageAudioResponse> {
    const content = passage.content as PassageContent;
    const sentences = content.sentences;

    if (!sentences || sentences.length === 0) {
      return { audioUrls: {} };
    }

    // Compute passage-level hash from concatenated sentence texts
    const concatenatedText = sentences.map((s) => s.text).join("");
    const passageHash = computeHash(concatenatedText);

    logger.info(
      `Resolving audio for passage ${passage.id} (hash: ${passageHash}, ${sentences.length} sentences)`,
    );

    // Process every sentence in parallel — individual failures are isolated
    const results = await Promise.allSettled(
      sentences.map((sentence) => this.processSentence(sentence.text, sentence.index, passageHash)),
    );

    const audioUrls: Record<number, SentenceAudioResult> = {};
    results.forEach((result, idx) => {
      const sentenceIndex = sentences[idx]?.index ?? idx;
      if (result.status === "fulfilled") {
        audioUrls[sentenceIndex] = result.value;
      } else {
        logger.warn(`Audio resolution failed for sentence ${sentenceIndex}`, result.reason);
        audioUrls[sentenceIndex] = { url: "", source: "failed" };
      }
    });

    return { audioUrls };
  }

  /**
   * Resolve audio for a single sentence.
   * 1. Check GCS for existing file (fast-path)
   * 2. If miss, delegate to TtsService which handles TTS generation + caching
   * 3. Return signed URL + source indicator
   *
   * URLs are always SHORT-LIVED SIGNED GCS URLs — directly playable by a
   * browser <audio>/Audio() element (which cannot attach Authorization headers)
   * without requiring the bucket to be publicly readable.
   */
  private async processSentence(
    text: string,
    index: number,
    passageHash: string,
  ): Promise<SentenceAudioResult> {
    const gcsPath = `tts/${passageHash}/${index}.mp3`;

    try {
      // ── Tier 1: GCS lookup (fast-path) ─────────────────────────────────
      const exists = await this.gcsClient.fileExists(gcsPath);
      if (exists) {
        logger.debug(`GCS hit: ${gcsPath}`);
        return {
          url: await this.gcsClient.getSignedUrl(gcsPath),
          source: "gcs" as AudioSource,
        };
      }

      // ── Tier 2: On-demand TTS via TtsService ───────────────────────────
      // Delegates to the shared TtsService which handles synthesis, GCS upload,
      // and Redis caching — avoiding duplication of this logic.
      logger.debug(`GCS miss — generating TTS: "${text.substring(0, 40)}"`);

      const result = await this.ttsService.getTtsUrl(text);
      logger.info(`TTS generated via TtsService for sentence ${index}`);
      return {
        url: result.audioUrl,
        source: "ondemand" as AudioSource,
      };
    } catch (err) {
      logger.error(`Audio resolution failed for sentence ${index}`, err);
      return { url: "", source: "failed" as AudioSource };
    }
  }
}
