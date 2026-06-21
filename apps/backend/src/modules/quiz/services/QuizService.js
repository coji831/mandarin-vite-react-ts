/**
 * @file apps/backend/src/modules/quiz/services/QuizService.js
 * Generic quiz service — delegates question generation and answer validation
 * to the registered strategy for the given quizType.
 * Cross-module: calls ProgressionService.updatePhaseGate() on pass.
 */
import { getStrategy } from "../strategies/index.js";
import { readStaticReference } from "../../../shared/infrastructure/data/readStaticReference.js";

export class QuizService {
  constructor(quizRepository, progressionService) {
    if (!quizRepository) throw new Error("QuizService requires quizRepository");
    this.quizRepository = quizRepository;
    this.progressionService = progressionService;
  }

  async createQuizAttempt(userId, quizType, phase = 1) {
    if (!quizType) throw new Error("quizType is required");
    return this.quizRepository.createQuizAttempt({ userId, quizType, phase });
  }

  async submitAnswer(attemptId, data) {
    const { questionIndex, pinyinInput, selectedTone, correctPinyin, correctTone, category } = data;
    const correct = pinyinInput === correctPinyin && selectedTone === correctTone;
    return this.quizRepository.createQuizAttemptAnswer({
      attemptId,
      questionIndex,
      pinyinInput,
      selectedTone,
      correctPinyin,
      correctTone,
      correct,
      category,
    });
  }

  async completeQuizAttempt(attemptId) {
    const answers = await this.quizRepository.findQuizAttemptAnswers(attemptId);
    if (!answers || answers.length === 0) throw new Error("No answers found for this quiz attempt");

    const totalScore = answers.filter((a) => a.correct).length;
    const maxScore = answers.length;
    const accuracy = maxScore > 0 ? totalScore / maxScore : 0;
    const passed = accuracy >= 0.9;

    const attempt = await this.quizRepository.findQuizAttemptById(attemptId);
    if (!attempt) throw new Error("Quiz attempt not found");

    await this.quizRepository.completeQuizAttempt(attemptId, { totalScore, maxScore, passed });

    if (passed) {
      try {
        await this.progressionService.updatePhaseGate(attempt.userId, {
          phase: attempt.phase || 1,
          passed: true,
          gateCriteria: "quiz",
        });
      } catch (err) {
        console.error("[QuizService] Failed to update phase gate:", err);
      }
    }

    return { totalScore, maxScore, passed, accuracy };
  }

  async getUserQuizAttempts(userId) {
    return this.quizRepository.findQuizAttemptsByUser(userId);
  }

  /**
   * Generate questions for a quiz type from the shared pinyin-tones pool.
   * @param {string} quizType - e.g., "audio-to-type"
   * @param {number} count - number of questions to generate (default 20)
   * @returns {Promise<Array>} array of question objects
   */
  async generateQuestions(quizType, count = 20) {
    if (quizType === "audio-to-type") {
      return this._generateAudioToTypeQuestions(count);
    }
    throw new Error(`Unknown quiz type: ${quizType}`);
  }

  /**
   * Generate audio-to-type questions from the pool.
   * Randomly selects syllable+tone combinations from the shared data.
   */
  async _generateAudioToTypeQuestions(count) {
    const pool = await readStaticReference("foundations/pinyin-tones-pool.json");

    // Build a flat list of all valid syllable+tone combinations
    const entries = [];

    for (const combo of pool.combinations) {
      // combo.tones is always [tone1, tone2, tone3, tone4, tone0]
      combo.tones.forEach((tonedSyllable, toneIndex) => {
        const tone = toneIndex === 4 ? 0 : toneIndex + 1;
        entries.push({
          syllable: tonedSyllable,
          initial: combo.initial,
          final: combo.final,
          tone,
        });
      });
    }

    // Shuffle and pick 'count' entries
    const shuffled = this._shuffleArray(entries);
    const selected = shuffled.slice(0, count);

    // Format as question objects matching the QuizQuestion interface
    return selected.map((entry, index) => ({
      id: `q-${index + 1}`,
      audioKey: entry.syllable,
      correctPinyin: this._stripToneMarks(entry.syllable),
      correctTone: entry.tone,
      category: entry.tone === 0 ? "tones" : Math.random() > 0.5 ? "pinyin" : "tones",
      displayPinyin: entry.syllable,
    }));
  }

  /** Strip tone marks from a pinyin syllable to get the base form */
  _stripToneMarks(syllable) {
    return syllable
      .replace(/[āáǎà]/g, "a")
      .replace(/[ōóǒò]/g, "o")
      .replace(/[ēéěè]/g, "e")
      .replace(/[īíǐì]/g, "i")
      .replace(/[ūúǔù]/g, "u")
      .replace(/[ǖǘǚǜ]/g, "ü");
  }

  /** Fisher-Yates shuffle */
  _shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
