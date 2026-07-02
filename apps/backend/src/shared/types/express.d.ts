/**
 * @file apps/backend/src/shared/types/express.d.ts
 * @description Express type augmentation for controller injection via middleware.
 *
 * Controllers are injected into `req` by middleware in routes.ts so that
 * route handlers don't need to import controllers directly.
 * This augments Express.Request to provide type-safe access.
 *
 * Phase 5 P0 of backend TS migration — replaces `(req as any).xxx` casts.
 */

import type { AuthController } from "../../modules/auth/api/AuthController.js";
import type { QuizController } from "../../modules/quiz/api/QuizController.js";
import type { ReviewController } from "../../modules/review/api/ReviewController.js";
import type { ProgressionController } from "../../modules/progression/api/ProgressionController.js";
import type { AIFeedbackController } from "../../modules/quiz/api/AIFeedbackController.js";
import type { FoundationsController } from "../../modules/foundations/api/FoundationsController.js";
import type { RadicalsController } from "../../modules/radicals/api/RadicalsController.js";

declare global {
  namespace Express {
    interface Request {
      /** User ID set by authMiddleware after JWT verification */
      userId?: string;

      /** Decoded JWT payload set by authMiddleware */
      user?: { userId: string; email?: string } & Record<string, unknown>;

      /** Request ID for tracing, set by requestIdMiddleware */
      requestId?: string;

      /** Injected by routes.ts middleware */
      authController?: AuthController;

      /** Injected by routes.ts middleware */
      quizController?: QuizController;

      /** Injected by routes.ts middleware */
      reviewController?: ReviewController;

      /** Injected by routes.ts middleware */
      progressionController?: ProgressionController;

      /** Injected by routes.ts middleware */
      aiFeedbackController?: AIFeedbackController;

      /** Injected by routes.ts middleware */
      foundationsController?: FoundationsController;

      /** Injected by routes.ts middleware */
      radicalsController?: RadicalsController;
    }
  }
}

export {};
