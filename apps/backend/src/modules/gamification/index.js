/**
 * @file apps/backend/src/modules/gamification/index.js
 * @description Gamification module - Public API
 *
 * Simple CRUD module for gamification operations (badges, streaks, rewards).
 * Exports only what other modules or container.js can consume.
 *
 * Exports:
 * - GamificationService: Gamification business logic (badges, XP, mystery boxes)
 *
 * NOT exported: BadgeRepository, GamificationController, gamificationRoutes
 */

export { GamificationService } from "./services/GamificationService.js";
