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
import { WordRepository } from "../shared/infrastructure/repositories/WordRepository.js";
import { ProgressionRepository } from "../modules/progression/repositories/ProgressionRepository.js";
import { ReviewRepository } from "../modules/review/repositories/ReviewRepository.js";
import { QuizRepository } from "../modules/quiz/repositories/QuizRepository.js";

const authRepository = new AuthRepository();
const wordRepository = new WordRepository();
const progressionRepository = new ProgressionRepository();
const reviewRepository = new ReviewRepository();
const quizRepository = new QuizRepository();

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

import { redisClient } from "../shared/infrastructure/redis/RedisClient.js";

// Adapter wrapping the module-level TTS functions to the ITTSClient interface
const rawTtsService = {
  async synthesizeSpeech(text, options) {
    return ttsClientModule.synthesizeSpeech(text, options);
  },
  async healthCheck() {
    return true;
  },
};

// ── Foundations Data ──────────────────────────────────────────────
import { FoundationsController, FoundationsService } from "../modules/foundations/index.js";
const foundationsService = new FoundationsService();
export const foundationsController = new FoundationsController(foundationsService);

// ── Radicals Data ─────────────────────────────────────────────────
import { RadicalsController, RadicalsService } from "../modules/radicals/index.js";
const radicalsService = new RadicalsService();
export const radicalsController = new RadicalsController(radicalsService);

// ── Core: Services ─────────────────────────────────────────────────────────
import { AuthService } from "../modules/auth/index.js";
import { AIFeedbackService } from "../modules/quiz/use-cases/AIFeedbackService.js";
import { ProgressionService } from "../modules/progression/index.js";
import { ReviewService, ReviewController } from "../modules/review/index.js";
const authService = new AuthService(authRepository, jwtService, passwordService);
const reviewService = new ReviewService(reviewRepository);
const progressionService = new ProgressionService(progressionRepository);
import { QuizService, QuizController } from "../modules/quiz/index.js";
const quizService = new QuizService(quizRepository, progressionService);
export const quizController = new QuizController(quizService);

export const reviewController = new ReviewController(reviewService);

// ── Cache Middleware ───────────────────────────────────────────────────────
import { withCache } from "../shared/middleware/cacheMiddleware.js";

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

// ── API: Controllers ───────────────────────────────────────────────────────
import { AuthController } from "../modules/auth/api/AuthController.js";
import { AIFeedbackController } from "../modules/quiz/api/AIFeedbackController.js";
import { HealthController } from "../modules/health/api/HealthController.js";
import TtsController from "../shared/api/TtsController.js";
import { ProgressionController } from "../modules/progression/api/ProgressionController.js";
export const authController = new AuthController(authService);
export const aiFeedbackController = new AIFeedbackController(cachedAIFeedback);
export const healthController = new HealthController(
  geminiClient,
  ttsClientModule,
  redisClient.getClient(),
);
export const ttsController = new TtsController(cachedTts, gcsClient);
export const progressionController = new ProgressionController(progressionService, reviewService);
