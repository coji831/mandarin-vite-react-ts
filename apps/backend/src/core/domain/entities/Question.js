/**
 * @file Question.js
 * @description Question entity - Domain model for quiz questions
 * 
 * Clean Architecture: Domain Layer - Value object/Entity
 * Represents a single quiz question with its associated word data
 * 
 * Responsibilities:
 * - Encapsulate question data and type
 * - Provide correct answer based on question type
 * - Validate question structure
 */

export class Question {
  constructor(data) {
    this.id = data.id;
    this.wordId = data.wordId;
    this.questionType = data.questionType; // 'multiple_choice' | 'type_pinyin' | 'type_character'
    this.word = data.word; // Word entity/object
    this.correctAnswer = data.correctAnswer;
  }

  /**
   * Get correct answer based on question type
   * Business rule: Answer type depends on question type
   * @returns {string}
   */
  getCorrectAnswer() {
    if (this.correctAnswer) {
      return this.correctAnswer;
    }

    // Derive from word data based on question type
    switch (this.questionType) {
      case 'type_pinyin':
        return this.word.pinyin;
      case 'type_character':
        return this.word.simplified;
      case 'multiple_choice':
        return this.word.english;
      default:
        throw new Error(`Unknown question type: ${this.questionType}`);
    }
  }

  /**
   * Check if user answer is correct
   * @param {string} userAnswer
   * @returns {boolean}
   */
  isCorrect(userAnswer) {
    const correctAnswer = this.getCorrectAnswer();
    
    // Normalize for comparison (case-insensitive, trim whitespace)
    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();
    
    return normalizedUser === normalizedCorrect;
  }

  /**
   * Validate question structure
   * @throws {Error} if invalid
   */
  validate() {
    if (!this.id || !this.wordId) {
      throw new Error('Question must have id and wordId');
    }
    
    const validTypes = ['multiple_choice', 'type_pinyin', 'type_character'];
    if (!validTypes.includes(this.questionType)) {
      throw new Error(`Invalid question type: ${this.questionType}`);
    }
    
    if (!this.word) {
      throw new Error('Question must have associated word data');
    }
  }
}
