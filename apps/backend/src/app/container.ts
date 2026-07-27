/**
 * @file apps/backend/src/app/container.ts
 * @description Composition root — wires infrastructure, calls module factories.
 *
 * Structure:
 *   1. Imports (infrastructure → module factories)
 *   2. Infrastructure singletons
 *   3. Module factory calls
 *   4. Exports
 */

// ── 1. Imports ─────────────────────────────────────────────────────────────

// Infrastructure
import { CacheFactory } from "../shared/infrastructure/cache/CacheFactory.js";
import { JwtService } from "../shared/infrastructure/security/JwtService.js";
import { PasswordService } from "../shared/infrastructure/security/PasswordService.js";
import { GeminiClient } from "../shared/infrastructure/external/GeminiClient.js";
import { GCSClient } from "../shared/infrastructure/external/GCSClient.js";
import { GoogleTTSClient } from "../shared/infrastructure/external/GoogleTTSClient.js";
import { redisClient } from "../shared/infrastructure/redis/RedisClient.js";
import { TtsService } from "../shared/services/TtsService.js";
import { GeminiService } from "../shared/services/GeminiService.js";

// Repositories
import { AuthRepository } from "../modules/auth/repositories/AuthRepository.js";
import { ProgressionRepository } from "../modules/progression/repositories/ProgressionRepository.js";
import { ReviewRepository } from "../modules/review/repositories/ReviewRepository.js";
import { QuizRepository } from "../modules/quiz/repositories/QuizRepository.js";

// Module factories
import { createFoundationsModule } from "../modules/foundations/container.js";
import { createRadicalsModule } from "../modules/radicals/container.js";
import { createMnemonicsModule } from "../modules/mnemonics/container.js";
import { createAuthModule } from "../modules/auth/container.js";
import { createReviewModule } from "../modules/review/container.js";
import { createProgressionModule } from "../modules/progression/container.js";
import { createQuizModule } from "../modules/quiz/container.js";
import { createHealthModule } from "../modules/health/container.js";
import { createTtsModule } from "../modules/tts/container.js";
import { createReadersModule } from "../modules/readers/container.js";
import { SegmenterService } from "../modules/readers/services/SegmenterService.js";
import { PassageGenerationService } from "../modules/readers/services/PassageGenerationService.js";

// ── 2. Infrastructure Singletons ───────────────────────────────────────────

export const cacheService = await CacheFactory.create("default");

const authRepository = new AuthRepository();
const progressionRepository = new ProgressionRepository();
const reviewRepository = new ReviewRepository();
const quizRepository = new QuizRepository();

const jwtService = new JwtService();
const passwordService = new PasswordService();

const geminiClient = new GeminiClient();
const gcsClient = new GCSClient();
const ttsClient = new GoogleTTSClient();

const ttsService = new TtsService(cacheService, gcsClient, ttsClient);
export const geminiService = new GeminiService(geminiClient);

// ── 3. Module Factory Calls ────────────────────────────────────────────────

// Simple modules (no cross-module deps)
const foundationsModule = createFoundationsModule();
const radicalsModule = createRadicalsModule();
const mnemonicsModule = createMnemonicsModule({ geminiService, cacheService });
const reviewModule = createReviewModule({ reviewRepository });
const authModule = createAuthModule({ authRepository, jwtService, passwordService });

// Cross-module dependencies — order matters
const progressionModule = createProgressionModule({
  progressionRepository,
  reviewService: reviewModule.service,
});

const quizModule = createQuizModule({
  quizRepository,
  progressionService: progressionModule.service,
});

const ttsModule = createTtsModule({ ttsService });

const healthModule = createHealthModule({ geminiService, ttsService, redisClient });

// Readers module — uses SegmenterService and PassageGenerationService singletons
export const segmenterService = new SegmenterService(cacheService);
export const passageGenerationService = new PassageGenerationService(geminiService);

const readersModule = createReadersModule({
  passageGenerationService,
  segmenterService,
  cacheService,
});

// ── 4. Exports ─────────────────────────────────────────────────────────────
export const ttsController = ttsModule.controller;
export const foundationsController = foundationsModule.controller;
export const radicalsController = radicalsModule.controller;
export const mnemonicsController = mnemonicsModule.controller;
export const authController = authModule.controller;
export const reviewController = reviewModule.controller;
export const progressionController = progressionModule.controller;
export const quizController = quizModule.controller;
export const healthController = healthModule.controller;
export const readersController = readersModule.controller;
export { readersModule };
