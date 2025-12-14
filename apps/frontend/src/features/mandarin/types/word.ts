/**
 * WordBasic: Basic information for a vocabulary word
 */
export type WordBasic = {
  wordId: string;
  chinese: string;
  pinyin: string;
  english: string;
};

/**
 * WordProgress: Tracks learning progress for a vocabulary word
 */
export type WordProgress = {
  wordId: string;
  learnedAt?: string | null;
};

/**
 * WordAudio: Audio data for a vocabulary word
 */
export type WordAudio = {
  audioUrl: string;
};

/**
 * WordAudioRequest: Parameters for requesting word audio
 */
export type WordAudioRequest = {
  chinese: string;
  voice?: string;
  bitrate?: number;
};
