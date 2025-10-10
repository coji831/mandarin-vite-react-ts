// Conversation schema and types for Epic 8

export type Conversation = {
  id: string; // Format: ${wordId}-${generatorVersion}-${shortHash}
  wordId: string;
  word: string;
  meaning?: string;
  context?: string;
  turns: ConversationTurn[];
  generatedAt: string; // ISO 8601 timestamp
  generatorVersion: string; // e.g., "v1", "v2" for cache invalidation
  promptHash?: string; // Hash of generation prompt for cache keys
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
