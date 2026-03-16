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
}
