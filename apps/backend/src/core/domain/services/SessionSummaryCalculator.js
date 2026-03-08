/**
 * Session Summary Calculator
 *
 * Domain service responsible for calculating quiz session statistics and summaries.
 * This service encapsulates all business logic related to session metrics calculation,
 * ensuring consistency across the application.
 *
 * @module core/domain/services/SessionSummaryCalculator
 */

import {
  LEECH_THRESHOLD,
  XP_PER_CORRECT_ANSWER,
  STREAK_BONUS_THRESHOLD,
  STREAK_BONUS_XP,
  PERCENTAGE_MULTIPLIER,
  isLeech,
  calculateXP,
  calculateAccuracy,
  getMysteryBoxDropRate,
} from "../constants/BusinessRules.js";

/**
 * Calculate comprehensive summary for a quiz session
 *
 * @param {Object} session - The quiz session with answers
 * @param {Array} session.answers - Array of answer records
 * @param {Array} session.questions - Array of session questions with word data
 * @param {Object} options - Additional data for summary
 * @param {number} options.currentStreak - Current streak count from StreakService
 * @param {number} options.availableFreezes - Available freeze count from StreakService
 * @returns {Object} Summary statistics
 */
export function calculateSessionSummary(session, options = {}) {
  if (!session || !session.answers || !Array.isArray(session.answers)) {
    throw new Error("Invalid session: answers array is required");
  }

  const answers = session.answers;
  const questions = session.questions || [];
  const { currentStreak = 0, availableFreezes = 0 } = options;

  // Count correct and incorrect answers
  const correctCount = answers.filter((a) => a.correct).length;
  const incorrectCount = answers.filter((a) => !a.correct).length;
  const totalQuestions = questions.length; // Type audit: totalQuestions not totalAnswered

  // Calculate accuracy
  const accuracyRate = calculateAccuracy(correctCount, totalQuestions);

  // Get gamification data from session (already saved during completion)
  const xpEarned = session.xpEarned || calculateXP(correctCount, currentStreak); // Type audit: xpEarned not totalXP
  const newBadges = session.newBadges || [];
  const mysteryBox = session.mysteryBox || null;

  // Identify leech words (words with lapseCount >= LEECH_THRESHOLD)
  const leechWordIds = [];
  const leechWords = [];

  for (const question of questions) {
    if (question.word && question.word.lapseCount >= LEECH_THRESHOLD) {
      leechWordIds.push(question.wordId);
      leechWords.push({
        wordId: question.wordId,
        hanzi: question.word.hanzi,
        pinyin: question.word.pinyin,
        english: question.word.english,
        lapseCount: question.word.lapseCount,
      });
    }
  }

  // Collect incorrect words with their answer details
  const incorrectWords = [];
  for (const answer of answers) {
    if (!answer.correct) {
      const question = questions.find((q) => q.id === answer.questionId);
      if (question && question.word) {
        incorrectWords.push({
          wordId: question.wordId,
          hanzi: question.word.hanzi,
          pinyin: question.word.pinyin,
          english: question.word.english,
          userAnswer: answer.userAnswer,
          correctAnswer: answer.correctAnswer,
          questionType: question.questionType,
          lapseCount: question.word.lapseCount,
          isLeech: isLeech(question.word.lapseCount),
        });
      }
    }
  }

  return {
    sessionId: session.id,
    accuracyRate: Math.round(accuracyRate * 100) / 100, // Round to 2 decimal places
    correctCount,
    incorrectCount,
    totalQuestions, // Type audit: totalQuestions not totalAnswered
    xpEarned, // Type audit: xpEarned not totalXP
    newBadges, // Gamification data from session
    mysteryBox, // Gamification data from session
    currentStreak, // From StreakService
    availableFreezes, // From StreakService
    leechCount: leechWordIds.length,
    leechWordIds,
    leechWords,
    incorrectWords,
    completedAt: session.completedAt || new Date().toISOString(),
    expiresAt: session.expiresAt || null, // Session expiration timestamp
  };
}

/**
 * Calculate if a specific answer resulted in a leech word
 *
 * @param {number} lapseCount - Current lapse count for the word
 * @returns {boolean} Whether the word is now a leech
 */
export function calculateIsLeech(lapseCount) {
  return isLeech(lapseCount);
}

/**
 * Calculate XP for a single correct answer
 *
 * @returns {number} XP value for one correct answer
 */
export function getXPPerCorrectAnswer() {
  return XP_PER_CORRECT_ANSWER;
}
