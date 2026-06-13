/**
 * WordBasic: Basic information for a vocabulary word
 */
export type WordBasic = {
  wordId: string;
  chinese: string;
  pinyin: string;
  english: string;
  hskLevel?: number;
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
