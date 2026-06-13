/**
 * AnswerRecordingService (Domain Layer)
 * Handles answer validation, normalization, and persistence for quiz sessions.
 * Extracted from QuizSessionOrchestrator during god service decomposition (BE7).
 *
 * Responsibilities:
 * - Validate user answers server-side
 * - Normalize input for comparison (pinyin, character, multi-answer support)
 * - Persist answer records
 * - Generate simple AI feedback for incorrect answers
 *
 * Clean Architecture: Domain Layer - Use Case / Application Service
 * Depends on IQuizSessionAnswerRepository and ILearningService interfaces.
 *
 * Dependencies injected via options object:
 * - answerRepository   IQuizSessionAnswerRepository
 * - learningService    LearningService (for recordQuizResult)
 * - aiFeedbackService  CachedAIFeedbackService (optional)
 */

import { createLogger } from "../../../shared/utils/logger.js";

export class AnswerRecordingService {
  /**
   * @param {object} deps - Injected dependencies
   * @param {object} deps.answerRepository    - IQuizSessionAnswerRepository implementation
   * @param {object} deps.learningService     - LearningService instance
   * @param {object} [deps.aiFeedbackService] - CachedAIFeedbackService (optional)
   */
  constructor({ answerRepository, learningService, aiFeedbackService = null }) {
    this.answerRepository = answerRepository;
    this.learningService = learningService;
    this.aiFeedbackService = aiFeedbackService;
    this.logger = createLogger("AnswerRecordingService");
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Validate an answer, record progress, persist answer record, and generate feedback.
   *
   * @param {object}   session      - Authorized session record
   * @param {string}   sessionId    - Session ID
   * @param {string}   questionId   - Question identifier (format: wordId_questionType)
   * @param {string}   userAnswer   - User's answer
   * @param {number}   timeSpentMs  - Time spent on question in milliseconds
   * @returns {Promise<object>} Result with { isCorrect, question, progressUpdate, aiFeedback }
   */
  async recordAnswer(session, sessionId, questionId, userAnswer, timeSpentMs) {
    const question = await this._loadQuestion(session, sessionId, questionId);
    const isCorrect = this._validateAnswer(userAnswer, question);

    const progressUpdate = await this.learningService.recordQuizResult({
      userId: session.userId,
      wordId: question.wordId,
      correct: isCorrect,
      questionType: question.questionType,
      timeSpentMs,
    });

    await this._persistAnswerRecord(
      sessionId,
      session,
      question,
      userAnswer,
      isCorrect,
      timeSpentMs,
      progressUpdate,
    );

    const aiFeedback = this._generateFeedback(isCorrect, question);

    return { isCorrect, question, progressUpdate, aiFeedback };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  async _loadQuestion(session, sessionId, questionId) {
    const question = session.questions.find((q) => q.id === questionId);
    if (!question) {
      const error = new Error("Question not found in session");
      error.code = "INVALID_QUESTION_ID";
      throw error;
    }

    if (this.answerRepository) {
      const existingAnswer = await this.answerRepository.findByQuestionId(questionId);
      if (existingAnswer) {
        const error = new Error("Question already answered");
        error.code = "ALREADY_ANSWERED";
        throw error;
      }
    }

    return question;
  }

  async _persistAnswerRecord(
    sessionId,
    session,
    question,
    userAnswer,
    isCorrect,
    timeSpentMs,
    progressUpdate,
  ) {
    if (!this.answerRepository) return;
    await this.answerRepository.create({
      sessionId,
      userId: session.userId,
      wordId: question.wordId,
      questionId: question.id,
      userAnswer,
      correct: isCorrect,
      timeSpentMs,
      lapseCount: progressUpdate.lapseCount,
      isLeech: progressUpdate.isLeech,
      nextReviewDate: progressUpdate.nextReviewDate,
    });
  }

  _generateFeedback(isCorrect, question) {
    if (isCorrect) return null;
    if (!question.word) return null;

    try {
      return {
        explanation: `the answer is ${this._getCorrectAnswerForType(question.word, question.questionType)}`,
        errorType: "feedback",
      };
    } catch (err) {
      this.logger.warn("Failed to generate AI feedback", { error: err.message });
      return null;
    }
  }

  _validateAnswer(userAnswer, question) {
    const { questionType, correctAnswer } = question;

    const normalizedUser = this._normalizeAnswer(userAnswer, questionType);
    const normalizedCorrect = this._normalizeAnswer(correctAnswer, questionType);

    if (typeof normalizedCorrect === "string" && /[;,，；|｜]/.test(normalizedCorrect)) {
      const acceptableAnswers = normalizedCorrect
        .split(/[;,，；|｜]/)
        .map((ans) => ans.trim())
        .filter(Boolean);

      const userSegments =
        typeof normalizedUser === "string" && /[;,，；|｜]/.test(normalizedUser)
          ? normalizedUser
              .split(/[;,，；|｜]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [normalizedUser];

      return userSegments.some((segment) =>
        acceptableAnswers.some((acceptable) =>
          this._answersMatch(segment, acceptable, questionType),
        ),
      );
    }

    return this._answersMatch(normalizedUser, normalizedCorrect, questionType);
  }

  _normalizeAnswer(answer, questionType) {
    if (!answer) return "";
    if (typeof answer !== "string") return answer;

    let normalized = answer.trim().toLowerCase();

    if (questionType === "type_pinyin") {
      normalized = normalized
        .replace(/([āáǎà])/g, "a")
        .replace(/([ōóǒò])/g, "o")
        .replace(/([ēéěè])/g, "e")
        .replace(/([īíǐì])/g, "i")
        .replace(/([ūúǔù])/g, "u")
        .replace(/([ǖǘǚǜ])/g, "ü")
        .replace(/[,\s]+/g, " ")
        .trim();

      if (normalized.endsWith("5") || normalized.endsWith("0")) {
        normalized = normalized.slice(0, -1).trim();
      }

      normalized = normalized.replace(/([a-z]+)[1-4]/g, "$1");
    }

    if (questionType === "type_character") {
      normalized = normalized.replace(/[\s,，、]+/g, "");
    }

    if (questionType === "multiple_choice") {
      normalized = normalized.replace(/^[a-dA-D][.、\)\s]+/, "").trim();
    }

    return normalized;
  }

  _answersMatch(userAnswer, correctAnswer, questionType) {
    if (userAnswer === correctAnswer) return true;

    if (questionType === "type_character") {
      const simplifiedNormalized = this._normalizeForChineseComparison(userAnswer);
      const correctNormalized = this._normalizeForChineseComparison(correctAnswer);
      if (simplifiedNormalized === correctNormalized) return true;
    }

    return false;
  }

  _normalizeForChineseComparison(text) {
    const traditionalToSimplified = {
      體: "体",
      門: "门",
      開: "开",
      關: "关",
      學: "学",
      習: "习",
      會: "会",
      說: "说",
      話: "话",
      認: "认",
      識: "识",
      讀: "读",
      書: "书",
      寫: "写",
      見: "见",
      問: "问",
      間: "间",
      時: "时",
      後: "后",
      前: "前",
      長: "长",
      來: "来",
      氣: "气",
      過: "过",
      還: "还",
      這: "这",
      那: "那",
      裡: "里",
      隻: "只",
      個: "个",
      們: "们",
      從: "从",
      對: "对",
      動: "动",
      國: "国",
      愛: "爱",
      點: "点",
      兒: "儿",
      車: "车",
      東: "东",
      樂: "乐",
      興: "兴",
      歲: "岁",
      頭: "头",
      發: "发",
      經: "经",
      電: "电",
      語: "语",
      該: "该",
      幫: "帮",
      帶: "带",
      萬: "万",
      與: "与",
      為: "为",
      報: "报",
      醫: "医",
    };

    const chars = [...text];
    return chars.map((c) => traditionalToSimplified[c] || c).join("");
  }

  _getCorrectAnswerForType(word, questionType) {
    switch (questionType) {
      case "multiple_choice":
        return word.english;
      case "type_pinyin":
        return word.pinyin;
      case "type_character":
        return word.simplified;
      default:
        throw new Error(`Unknown question type: ${questionType}`);
    }
  }
}
