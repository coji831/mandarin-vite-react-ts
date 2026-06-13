/**
 * @file apps/backend/src/modules/quiz/domain/entities/StudyStreak.js
 * @description StudyStreak entity - Domain model for study streak tracking
 *
 * Clean Architecture: Domain Layer - Core business entity
 * Tracks a user's consecutive study days and streak milestones.
 *
 * Responsibilities:
 * - Encapsulate streak data
 * - Support streak-based gamification
 */

export class StudyStreak {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.currentStreak = data.currentStreak || 0;
    this.longestStreak = data.longestStreak || 0;
    this.lastActivityDate = data.lastActivityDate;
    this.freezeCount = data.freezeCount || 0;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
