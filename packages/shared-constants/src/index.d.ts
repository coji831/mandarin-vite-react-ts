/**
 * TypeScript definitions for shared constants
 * Provides IDE autocomplete for JavaScript exports
 */

// Route Patterns
export declare const ROUTE_PATTERNS: {
  readonly health: string;
  readonly ttsAudio: string;
  readonly quizFeedback: string;
  readonly authRegister: string;
  readonly authLogin: string;
  readonly authRefresh: string;
  readonly authLogout: string;
  readonly authMe: string;
  readonly progressionFoundationProgress: string;
  readonly progressionFoundationProgressSection: (sectionId: string) => string;
  readonly progressionPhaseGate: string;
  readonly progressionGates: string;
  readonly progressionRadicalProgress: string;
  readonly progressionRadicalProgressById: (radicalId: string) => string;
  readonly quizAttempts: string;
  readonly quizAttemptAnswer: (id: string) => string;
  readonly quizAttemptComplete: (id: string) => string;
  readonly reviewItems: string;
  readonly reviewResult: string;
  readonly reviewDueCount: string;
  readonly radicals: string;
  readonly radicalsById: (radicalId: string) => string;
  readonly radicalsByCharacter: (glyph: string) => string;
  readonly radicalsCharacters: (radicalId: string) => string;
  readonly foundationsPinyinTones: string;
  readonly foundationsPinyinCharacterMap: string;
  readonly foundationsStrokes: string;
  readonly charactersByGlyph: (glyph: string) => string;
  readonly wordsByGlyph: (glyph: string) => string;
  readonly wordsMeasureWords: (wordId: string) => string;
  readonly mnemonics: string;
  readonly mnemonicsByChar: (glyph: string) => string;
  readonly quizConfig: string;
  readonly quizQuestions: string;
  readonly quizSandhiDrill: string;
  readonly readersPassages: string;
  readonly readersPassageById: (id: string) => string;
  readonly readersGenerate: string;
  readonly readersPassageAudioById: (id: string) => string;
  readonly readersSessionByPassageId: (id: string) => string;
  readonly readersSessionCompleteByPassageId: (id: string) => string;
  readonly readersBookmarks: string;
  readonly readersBookmarkByPassageId: (id: string) => string;
  readonly phoneticClusters: string;
  readonly phoneticClustersById: (id: string) => string;
  readonly charactersPhonetic: (glyph: string) => string;
  readonly charactersHomophones: (glyph: string) => string;
  readonly charactersDecomposition: (glyph: string) => string;
  readonly charactersSearch: string;
  readonly charactersFrequency: string;
  readonly radicalsCharacters: (radicalId: string) => string;
  readonly pinyinSearch: string;
  readonly grammarPatterns: string;
  readonly grammarPatternById: (id: string) => string;
};

// HSK Levels
export declare const HSK_LEVELS: readonly number[];

// Language Codes
export declare const LANGUAGE_CODES: {
  readonly CHINESE: string;
  readonly ENGLISH: string;
};

// Foundations
export declare const FOUNDATION_SECTIONS: readonly ["pinyin", "tones", "strokes", "animations"];
export type FoundationSectionId = (typeof FOUNDATION_SECTIONS)[number];
export declare const FOUNDATION_SECTION_LABELS: Record<FoundationSectionId, string>;

// Voice Configuration
export declare const TTS_VOICES: {
  readonly [key: string]: {
    readonly FEMALE: string;
    readonly MALE: string;
  };
};

/**
 * Creates a guest phase gate response — returned when no user is authenticated.
 * All phases unlocked (currentPhase: 4) so guests can browse all content.
 */
export declare function createGuestPhaseGate(): {
  readonly id: "guest-unlocked";
  readonly currentPhase: 4;
  readonly phase1Passed: false;
  readonly phase2Passed: false;
  readonly phase3Passed: false;
  readonly phase4Unlocked: true;
  readonly qualificationScore: null;
  readonly placedPhase: null;
  readonly phase1Retention: null;
  readonly phase2Retention: null;
  readonly phase3Retention: null;
  readonly gateCriteria: null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

// Confidence Levels
export declare const CONFIDENCE_LEVELS: {
  readonly NEW: number;
  readonly LEARNING: number;
  readonly FAMILIAR: number;
  readonly KNOWN: number;
  readonly MASTERED: number;
};

// Review Intervals
export declare const REVIEW_INTERVALS: {
  readonly [key: number]: number;
};

// Pagination
export declare const PAGINATION: {
  readonly DEFAULT_PAGE_SIZE: number;
  readonly MAX_PAGE_SIZE: number;
};

// Cache TTL
export declare const CACHE_TTL: {
  readonly VOCABULARY: number;
  readonly USER_PROGRESS: number;
  readonly TTS_AUDIO: number;
};

// Error Messages
export declare const ERROR_MESSAGES: {
  readonly UNAUTHORIZED: string;
  readonly NOT_FOUND: string;
  readonly VALIDATION_ERROR: string;
  readonly SERVER_ERROR: string;
  readonly TTS_ERROR: string;
  readonly CONVERSATION_ERROR: string;
};
