/**
 * @file shared/services/audio/interfaces.ts
 * @description Interfaces for audio service layer
 *
 * Extracted from features/vocabulary/services/interfaces.ts (deprecated vocabulary feature).
 * Defines contracts for audio backend implementations with DI support.
 */

import type {
  WordAudio,
  WordAudioRequest,
  TurnAudioRequest,
  TurnAudioResponse,
} from "@mandarin/shared-types";

/**
 * Interface for audio backend implementations (used by AudioService)
 */
export interface IAudioBackend {
  fetchWordAudio(params: WordAudioRequest): Promise<WordAudio>;
  fetchTurnAudio(params: TurnAudioRequest): Promise<TurnAudioResponse>;
}

/**
 * Interface for the audio service consumed by hooks and components
 */
export interface IAudioService {
  fetchWordAudio(params: WordAudioRequest): Promise<WordAudio>;
  fetchTurnAudio(params: TurnAudioRequest): Promise<TurnAudioResponse>;
}

/**
 * Generic base service with fallback support
 * Provides a template for services that need fallback logic
 */
export class BaseService<Args extends unknown[], Result> {
  protected fallbackService?: BaseService<Args, Result>;

  constructor(fallbackService?: BaseService<Args, Result>) {
    this.fallbackService = fallbackService;
  }

  async fetch(...args: Args): Promise<Result> {
    try {
      return await this.execute(...args);
    } catch (err) {
      if (this.fallbackService) {
        return this.fallbackService.fetch(...args);
      }
      throw err;
    }
  }

  protected async execute(..._args: Args): Promise<Result> {
    throw new Error("execute() must be implemented by subclass");
  }
}
