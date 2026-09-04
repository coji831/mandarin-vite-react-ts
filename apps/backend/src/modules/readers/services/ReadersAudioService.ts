/**
 * @file apps/backend/src/modules/readers/services/ReadersAudioService.ts
 * @description Resolves audio for every sentence in a passage via the unified
 * modules/audio `synthesizeToPath` primitive (D4).
 *
 * Flow per sentence (the two-tier collapses into "exists? cached : synthesize"):
 *   `synthesizeToPath(text, tts/{passageHash}/{i}.mp3)` — the primitive owns the
 *   GCS exists-check → re-sign (source: "gcs") or synthesize+upload (source:
 *   "ondemand"); a throw is reported as `source: "failed"`.
 *
 * Uses Promise.allSettled — per-sentence errors never fail the whole batch.
 * URLs are always SHORT-LIVED SIGNED GCS URLs — directly playable by a browser
 * <audio>/Audio() element (which cannot attach Authorization headers) without
 * requiring the bucket to be publicly readable.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import type { PassageRecord, PassageContent } from "../types/readers.js";
import type { AudioServiceLike } from "../../../modules/audio/index.js";
import type {
  PassageAudioResponse,
  SentenceAudioResult,
  AudioSource,
} from "../types/readers-audio.js";

const logger = createLogger("ReadersAudioService");

/**
 * Passage audio path helpers — the audio-domain hashing/path primitives
 * (`passageHashFor` / `passagePath` from `modules/audio/services/paths.ts`).
 * Constructor-injected (DI) instead of imported directly from `modules/audio`
 * so the Nest shell consumes them from the ported `AudioModule` (Story 24-12 —
 * no direct `modules/audio` function import in Nest land).
 */
export interface PassagePathHelpers {
  /** Passage-level hash: SHA256 of the concatenated sentence texts. */
  passageHashFor(sentenceTexts: string[]): string;
  /** Passage sentence path: `tts/{passageHash}/{index}.mp3` (D4). */
  passagePath(passageHash: string, index: number): string;
}

/**
 * ReadersAudioService — resolves audio URLs for all sentences in a passage.
 * Delegates to the audio service (synthesizeToPath) which owns synthesis,
 * GCS upload, and signing — no hand-rolled GCS fast-path here.
 */
export class ReadersAudioService {
  constructor(
    private readonly audioService: AudioServiceLike,
    private readonly passagePathHelpers: PassagePathHelpers,
  ) {
    logger.info("Initialized ReadersAudioService");
  }

  /**
   * Get audio URLs for every sentence in a passage.
   * Passage hash = SHA256 of the concatenated sentence texts.
   * GCS path format: `tts/{passageHash}/{sentenceIndex}.mp3` — identical to
   * future pre-gen paths (D4).
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

    // Passage-level hash from concatenated sentence texts
    const passageHash = this.passagePathHelpers.passageHashFor(sentences.map((s) => s.text));

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
   * Resolve audio for a single sentence via the unified primitive:
   * file already existed → `cached:true` → source "gcs";
   * just synthesized → `cached:false` → source "ondemand"; throw → "failed".
   */
  private async processSentence(
    text: string,
    index: number,
    passageHash: string,
  ): Promise<SentenceAudioResult> {
    try {
      const result = await this.audioService.synthesizeToPath(
        text,
        this.passagePathHelpers.passagePath(passageHash, index),
      );
      return {
        url: result.audioUrl,
        source: result.cached ? ("gcs" as AudioSource) : ("ondemand" as AudioSource),
      };
    } catch (err) {
      logger.error(`Audio resolution failed for sentence ${index}`, err);
      return { url: "", source: "failed" as AudioSource };
    }
  }
}
