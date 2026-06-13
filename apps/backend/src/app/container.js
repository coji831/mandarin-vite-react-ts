/**
 * @file apps/backend/src/app/container.js
 * @description Composition root — single place where all dependencies are instantiated.
 * Clean architecture: wires infrastructure → core → API layers exactly once.
 * All route files import controllers from here instead of constructing their own instances.
 */

// ── Infrastructure: Cache ──────────────────────────────────────────────────
import { CacheFactory } from "../shared/infrastructure/cache/CacheFactory.js";

export const cacheService = await CacheFactory.create("default");

// ── Infrastructure: Repositories ──────────────────────────────────────────
import { AuthRepository } from "../modules/auth/repositories/AuthRepository.js";
import { BadgeRepository } from "../modules/gamification/repositories/BadgeRepository.js";
import { ProgressRepository } from "../modules/quiz/repositories/ProgressRepository.js";
import { QuizSessionAnswerRepository } from "../modules/quiz/repositories/QuizSessionAnswerRepository.js";
import { QuizSessionRepository } from "../modules/quiz/repositories/QuizSessionRepository.js";
import { QuizSessionSummaryRepository } from "../modules/quiz/repositories/QuizSessionSummaryRepository.js";
import { StreakRepository } from "../modules/quiz/repositories/StreakRepository.js";
import { VocabularyRepository } from "../modules/vocabulary/repositories/VocabularyRepository.js";
import { WordRepository } from "../modules/word/repositories/WordRepository.js";
import { VocabularyListRepository } from "../modules/vocabulary/repositories/VocabularyListRepository.js";

const authRepository = new AuthRepository();
const badgeRepository = new BadgeRepository();
const progressRepository = new ProgressRepository();
const quizSessionAnswerRepository = new QuizSessionAnswerRepository();
const quizSessionRepository = new QuizSessionRepository();
const quizSessionSummaryRepository = new QuizSessionSummaryRepository();
const streakRepository = new StreakRepository();
const vocabularyRepository = new VocabularyRepository();
const wordRepository = new WordRepository();
const vocabularyListRepository = new VocabularyListRepository();

// ── Infrastructure: Security ──────────────────────────────────────────────
import { JwtService } from "../shared/infrastructure/security/JwtService.js";
import { PasswordService } from "../shared/infrastructure/security/PasswordService.js";

const jwtService = new JwtService();
const passwordService = new PasswordService();

// ── Infrastructure: External Clients ─────────────────────────────────────
import * as geminiClient from "../shared/infrastructure/external/GeminiClient.js";
import * as gcsClient from "../shared/infrastructure/external/GCSClient.js";
import * as ttsClientModule from "../shared/infrastructure/external/GoogleTTSClient.js";
import { config } from "../shared/config/index.js";

// Per-module GCS storage instances (future: each points to its own bucket)
import { StorageFactory } from "../shared/infrastructure/storage/StorageFactory.js";
const ttsStorage = StorageFactory.create("tts", { bucket: config.gcsBucket });
const examplesStorage = StorageFactory.create("examples", { bucket: config.gcsBucket });
const vocabularyStorage = StorageFactory.create("vocabulary", { bucket: config.gcsBucket });

// Examples infrastructure & services
import ExampleService from "../modules/examples/services/ExampleService.js";
import { redisClient } from "../shared/infrastructure/redis/RedisClient.js";
import RedisLockManager from "../shared/infrastructure/redis/RedisLockManager.js";
import HmacManager from "../shared/infrastructure/security/HmacManager.js";

// Adapter wrapping the module-level TTS functions to the ITTSClient interface
const rawTtsService = {
  async synthesizeSpeech(text, options) {
    return ttsClientModule.synthesizeSpeech(text, options);
  },
  async healthCheck() {
    return true;
  },
};

// ── Core: Services ─────────────────────────────────────────────────────────
import { AuthService } from "../modules/auth/index.js";
import { AIFeedbackService } from "../modules/quiz/use-cases/AIFeedbackService.js";
import { GamificationService } from "../modules/gamification/index.js";
import { LearningService } from "../modules/quiz/use-cases/LearningService.js";
import { ProgressService } from "../modules/quiz/index.js";
import { QuizSessionOrchestrator } from "../modules/quiz/use-cases/QuizSessionOrchestrator.js";
import { StreakService } from "../modules/quiz/use-cases/StreakService.js";
import { VocabularyService } from "../modules/vocabulary/services/VocabularyService.js";
import { WordService } from "../modules/word/index.js";
import { VocabularyListService } from "../modules/vocabulary/services/VocabularyListService.js";
const authService = new AuthService(authRepository, jwtService, passwordService);
const gamificationService = new GamificationService(badgeRepository, streakRepository);
const streakService = new StreakService(streakRepository, quizSessionAnswerRepository);
const learningService = new LearningService(progressRepository, wordRepository);
const progressService = new ProgressService(progressRepository);
const vocabularyService = new VocabularyService(vocabularyRepository);
const wordService = new WordService(wordRepository);
const vocabularyListService = new VocabularyListService(vocabularyListRepository);
// ── Cache Middleware ───────────────────────────────────────────────────────
import { withCache, withGcsCache } from "../shared/middleware/cacheMiddleware.js";

// AIFeedback: wrap pure service with Redis cache (24h TTL)
const aiFeedbackService = new AIFeedbackService(wordRepository, geminiClient);
const cachedAIFeedbackFn = withCache((params) => aiFeedbackService.generateFeedback(params), {
  ttl: 86400,
  keyFn: ({ wordId, userAnswer }) => `quiz:feedback:${wordId}:${userAnswer.toLowerCase()}`,
  serviceName: "AIFeedback",
});

// Preserve expected interface for AIFeedbackController (this.feedbackService.generateFeedback())
export const cachedAIFeedback = {
  generateFeedback: cachedAIFeedbackFn,
  getMetrics: cachedAIFeedbackFn.getMetrics,
};

// TTS: wrap raw TTS service with Redis cache (24h TTL)
const cachedTtsFn = withCache(
  (text, options = {}) => rawTtsService.synthesizeSpeech(text, options),
  {
    ttl: 86400,
    keyFn: (text, options) => `tts:${text}${options.voice || ""}`,
    serviceName: "TTS",
  },
);

// Preserve expected interface for TtsController (this.ttsService.synthesizeSpeech())
export const cachedTts = {
  synthesizeSpeech: cachedTtsFn,
  healthCheck: async () => true,
  getMetrics: cachedTtsFn.getMetrics,
};

// --- Examples service registration (GCS-backed cache with single-flight lock)
// Underlying example service with DI - receives infrastructure clients instead of importing them directly
const rawExampleService = new ExampleService({
  gcsService: examplesStorage,
  geminiClient,
  ttsClient: ttsClientModule,
  cacheService,
});
// Redis client instance (may be null if not configured)
const redisClientInstance = redisClient?.getClient ? redisClient.getClient() : null;
const redisLockManager = new RedisLockManager(redisClientInstance);
const hmacManager = new HmacManager();

// Examples: wrap pure service with GCS-backed cache + single-flight lock
export const exampleService = withGcsCache(
  (word, hskLevel, language) => rawExampleService.generateExamples(word, hskLevel, language),
  {
    hmacManager,
    gcsService: examplesStorage,
    lockManager: redisLockManager,
    serviceName: "Examples",
  },
);

// ── Decomposed QuizSession Sub-Services (BE7) ──────────────────────────────
import { AnswerRecordingService } from "../modules/quiz/use-cases/AnswerRecordingService.js";
import { SummaryService } from "../modules/quiz/use-cases/SummaryService.js";

const answerRecordingService = new AnswerRecordingService({
  answerRepository: quizSessionAnswerRepository,
  learningService,
  aiFeedbackService: cachedAIFeedback,
});

const summaryService = new SummaryService({
  summaryRepository: quizSessionSummaryRepository,
  streakService,
  gamificationService,
  answerRepository: quizSessionAnswerRepository,
  sessionRepository: quizSessionRepository,
});

const quizSessionService = new QuizSessionOrchestrator({
  sessionRepository: quizSessionRepository,
  learningService,
  answerRecordingService,
  summaryService,
});

// ── API: Controllers ───────────────────────────────────────────────────────
import { AuthController } from "../modules/auth/api/AuthController.js";
import { AIFeedbackController } from "../modules/quiz/api/AIFeedbackController.js";
import { GamificationController } from "../modules/gamification/api/GamificationController.js";
import { HealthController } from "../modules/health/api/HealthController.js";
import { LearningController } from "../modules/quiz/api/LearningController.js";
import { ProgressController } from "../modules/quiz/api/ProgressController.js";
import { QuizSessionController } from "../modules/quiz/api/QuizSessionController.js";
import TtsController from "../modules/tts/api/TtsController.js";
import { ExamplesController } from "../modules/examples/api/ExamplesController.js";
import { VocabularyController } from "../modules/vocabulary/api/VocabularyController.js";
import { WordController } from "../modules/word/api/WordController.js";
export const authController = new AuthController(authService);
export const aiFeedbackController = new AIFeedbackController(cachedAIFeedback);
// A6 fix: single instance with both streakService + gamificationService (was split across two route files)
export const gamificationController = new GamificationController(
  streakService,
  gamificationService,
);
export const healthController = new HealthController(
  geminiClient,
  ttsClientModule,
  redisClient.getClient(),
);
export const learningController = new LearningController(learningService);
export const progressController = new ProgressController(
  progressService,
  streakService,
  gamificationService,
);
export const quizSessionController = new QuizSessionController(quizSessionService);
export const ttsController = new TtsController(cachedTts, gcsClient);
export const vocabularyController = new VocabularyController(vocabularyService, progressService);
export const wordController = new WordController(wordService);
export const exampleController = new ExamplesController(exampleService);
