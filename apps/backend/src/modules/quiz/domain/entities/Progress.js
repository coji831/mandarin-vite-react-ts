/**
 * @file apps/backend/src/modules/quiz/domain/entities/Progress.js
 * @description Progress entity - Domain model for learning progress
 *
 * Clean Architecture: Domain Layer - Core business entity
 * Tracks a user's learning progress for a specific vocabulary word.
 *
 * Responsibilities:
 * - Encapsulate progress data (study count, confidence, next review)
 * - Support spaced repetition scheduling
 */

export class Progress {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.wordId = data.wordId;
    this.studyCount = data.studyCount || 0;
    this.correctCount = data.correctCount || 0;
    this.confidence = data.confidence || 0;
    this.nextReview = data.nextReview;
    this.lapseCount = data.lapseCount || 0;
    this.currentDelay = data.currentDelay;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
