/**
 * @file Word.js
 * @description Word entity - Core domain model for vocabulary words
 *
 * Clean Architecture: Domain Layer - Core business entity
 * Pure word data without infrastructure concerns.
 *
 * Responsibilities:
 * - Encapsulate word data (no audioUrl, no exampleSentence)
 * - Provide word identification and display properties
 */

export class Word {
  constructor(data) {
    this.id = data.id;
    this.simplified = data.simplified;
    this.traditional = data.traditional;
    this.pinyin = data.pinyin;
    this.english = data.english;
    this.hskLevel = data.hskLevel;
  }
}
