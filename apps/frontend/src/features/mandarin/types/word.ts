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
  // Backend progress fields (Story 13.4)
  studyCount?: number;
  correctCount?: number;
  confidence?: number; // 0.0 - 1.0 scale
  nextReview?: string; // ISO 8601 date string
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
