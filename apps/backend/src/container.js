/**
 * @file apps/backend/src/container.js
 * @description Composition root — single place where all dependencies are instantiated.
 * Clean architecture: wires infrastructure → core → API layers exactly once.
 * All route files import controllers from here instead of constructing their own instances.
 */

// ── Infrastructure: Cache ──────────────────────────────────────────────────
import { getCacheService } from "./infrastructure/cache/index.js";

export const cacheService = getCacheService();

// ── Infrastructure: Repositories ──────────────────────────────────────────
import { AuthRepository } from "./infrastructure/repositories/AuthRepository.js";
import { BadgeRepository } from "./infrastructure/repositories/BadgeRepository.js";
import { ProgressRepository } from "./infrastructure/repositories/ProgressRepository.js";
import { QuizSessionAnswerRepository } from "./infrastructure/repositories/QuizSessionAnswerRepository.js";
import { QuizSessionRepository } from "./infrastructure/repositories/QuizSessionRepository.js";
import { QuizSessionSummaryRepository } from "./infrastructure/repositories/QuizSessionSummaryRepository.js";
import { StreakRepository } from "./infrastructure/repositories/StreakRepository.js";
import { VocabularyRepository } from "./infrastructure/repositories/VocabularyRepository.js";

const authRepository = new AuthRepository();
const badgeRepository = new BadgeRepository();
const progressRepository = new ProgressRepository();
const quizSessionAnswerRepository = new QuizSessionAnswerRepository();
const quizSessionRepository = new QuizSessionRepository();
const quizSessionSummaryRepository = new QuizSessionSummaryRepository();
const streakRepository = new StreakRepository();
const vocabularyRepository = new VocabularyRepository();

// ── Infrastructure: Security ──────────────────────────────────────────────
import { JwtService } from "./infrastructure/security/JwtService.js";
import { PasswordService } from "./infrastructure/security/PasswordService.js";

const jwtService = new JwtService();
const passwordService = new PasswordService();

// ── Infrastructure: External Clients ─────────────────────────────────────
import * as geminiClient from "./infrastructure/external/GeminiClient.js";
import * as gcsClient from "./infrastructure/external/GCSClient.js";
import * as ttsClientModule from "./infrastructure/external/GoogleTTSClient.js";

// Examples infrastructure & services
import ExampleService from "./services/exampleService.js";
import GcsCacheService from "./services/gcsCacheService.js";
import { redisClient } from "./infrastructure/cache/RedisClient.js";
import RedisLockManager from "./infrastructure/cache/RedisLockManager.js";
import HmacManager from "./infrastructure/security/HmacManager.js";
import CachedExampleService from "./core/services/CachedExampleService.js";

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
import { AuthService } from "./core/services/AuthService.js";
import { CachedAIFeedbackService } from "./core/services/CachedAIFeedbackService.js";
import { CachedConversationService } from "./core/services/CachedConversationService.js";
import { CachedTTSService } from "./core/services/CachedTTSService.js";
import { ConversationService } from "./core/services/ConversationService.js";
import { GamificationService } from "./core/services/GamificationService.js";
import { LearningService } from "./core/services/LearningService.js";
import { ProgressService } from "./core/services/ProgressService.js";
import { QuizSessionService } from "./core/services/QuizSessionService.js";
import { StreakService } from "./core/services/StreakService.js";
import { VocabularyService } from "./core/services/VocabularyService.js";

const authService = new AuthService(authRepository, jwtService, passwordService);
const gamificationService = new GamificationService(badgeRepository, streakRepository);
const streakService = new StreakService(streakRepository, quizSessionAnswerRepository);
const learningService = new LearningService(progressRepository, vocabularyRepository);
const progressService = new ProgressService(progressRepository);
const vocabularyService = new VocabularyService(vocabularyRepository);
const aiFeedbackService = new CachedAIFeedbackService(
  vocabularyRepository,
  cacheService,
  geminiClient,
);
const conversationService = new ConversationService(geminiClient, ttsClientModule, gcsClient);
const cachedConversationService = new CachedConversationService(conversationService, cacheService);
const cachedTtsService = new CachedTTSService(rawTtsService, cacheService);

// --- Examples service registration (cached wrapper)
// Create a GCS-backed cache service instance for examples
const examplesGcsService = new GcsCacheService();
// Underlying example service (uses same GCS service by default)
const rawExampleService = new ExampleService(examplesGcsService);
// Redis client instance (may be null if not configured)
const redisClientInstance = redisClient?.getClient ? redisClient.getClient() : null;
const redisLockManager = new RedisLockManager(redisClientInstance);
const hmacManager = new HmacManager();
const cachedExampleService = new CachedExampleService(rawExampleService, redisLockManager, examplesGcsService, hmacManager);

// Export exampleService for routes/controllers to consume transparently
export const exampleService = cachedExampleService;
const quizSessionService = new QuizSessionService({
  sessionRepository: quizSessionRepository,
  learningService,
  gamificationService,
  vocabularyRepository,
  // Reserved for future Gemini-generated answer feedback (service stores but does not yet call it)
  aiFeedbackService,
  streakService,
  summaryRepository: quizSessionSummaryRepository,
  answerRepository: quizSessionAnswerRepository,
});

// ── API: Controllers ───────────────────────────────────────────────────────
import { AuthController } from "./api/controllers/authController.js";
import { AIFeedbackController } from "./api/controllers/AIFeedbackController.js";
import ConversationController from "./api/controllers/conversationController.js";
import { GamificationController } from "./api/controllers/GamificationController.js";
import { LearningController } from "./api/controllers/learningController.js";
import { ProgressController } from "./api/controllers/progressController.js";
import { QuizSessionController } from "./api/controllers/quizSessionController.js";
import TtsController from "./api/controllers/ttsController.js";
import { VocabularyController } from "./api/controllers/vocabularyController.js";

export const authController = new AuthController(authService);
export const aiFeedbackController = new AIFeedbackController(aiFeedbackService);
export const conversationController = new ConversationController(cachedConversationService);
// A6 fix: single instance with both streakService + gamificationService (was split across two route files)
export const gamificationController = new GamificationController(
  streakService,
  gamificationService,
);
export const learningController = new LearningController(learningService);
export const progressController = new ProgressController(
  progressService,
  streakService,
  gamificationService,
);
export const quizSessionController = new QuizSessionController(quizSessionService);
export const ttsController = new TtsController(cachedTtsService, gcsClient);
export const vocabularyController = new VocabularyController(vocabularyService, progressService);

// ── Cache Metrics Registration ─────────────────────────────────────────────
// Centralised here so route files don't each call getCacheService()
import { registerCacheMetrics } from "./api/middleware/cacheMetrics.js";

registerCacheMetrics("AIFeedback", () => aiFeedbackService.getMetrics());
registerCacheMetrics("Conversation", () => cachedConversationService.getMetrics());
registerCacheMetrics("TTS", () => cachedTtsService.getMetrics());
