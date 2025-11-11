// Conversation schema and types for Epic 8

export type Conversation = {
  id: string; // Format: ${wordId}-${hash}
  wordId: string;
  word: string;
  meaning?: string;
  context?: string;
  turns: ConversationTurn[];
  generatedAt: string; // ISO 8601 timestamp
  generatorVersion?: string; // Optional metadata; cache keys no longer include it
  hash?: string; // Hash of generation prompt for cache keys
};

export type ConversationTurn = {
  speaker: string; // "A", "B", or descriptive names
  text: string; // Dialogue text in target language
  translation?: string; // Optional English translation
};

export type ConversationAudio = {
  conversationId: string;
  audioUrl: string;
  durationSeconds?: number;
  timeline?: AudioTimeline[]; // For turn-by-turn highlighting
  generatedAt: string;
  voice?: string; // TTS voice identifier
  bitrate?: number; // Audio quality setting
};

export type AudioTimeline = {
  mark: string; // "turn-1", "turn-2", etc.
  timeSeconds: number; // Start time of this turn
};

/**
 * ConversationAudioRequest: Parameters for requesting conversation audio
 */
export type ConversationAudioRequest = {
  wordId: string;
  voice?: string;
  bitrate?: number;
};

/**
 * ConversationGenerateRequest: Parameters for generating a conversation
 */
export type ConversationGenerateRequest = {
  wordId: string;
  word: string;
  generatorVersion?: string;
};
