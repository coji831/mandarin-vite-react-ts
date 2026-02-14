/**
 * Question interleaving utilities
 * Story 15.6: Quiz Container & State Management
 *
 * Implements cognitive science-based interleaving:
 * - Random question type per word (not blocked practice)
 * - Distractor generation for multiple choice
 *
 * Research: Interleaving improves retention 20-30% vs blocked practice
 */

import { QuizQuestion, QuestionMode } from "../types/QuizTypes";

interface Word {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
}

const QUESTION_MODES: QuestionMode[] = ["multiple_choice", "type_pinyin", "type_character"];

/**
 * Creates interleaved quiz questions with random mode per word
 *
 * @param words Array of words to quiz on
 * @returns Array of quiz questions with random modes
 */
export function createInterleavedQuestions(words: Word[]): QuizQuestion[] {
  return words.map((word) => {
    // Random mode selection per word (per-word interleaving)
    const mode = QUESTION_MODES[Math.floor(Math.random() * QUESTION_MODES.length)];

    const question: QuizQuestion = {
      wordId: word.id,
      word: word.chinese,
      pinyin: word.pinyin,
      english: word.english,
      mode,
    };

    // Generate distractors for multiple choice
    if (mode === "multiple_choice") {
      question.options = generateDistractors(word, words);
    }

    return question;
  });
}

/**
 * Generates 4 options for multiple choice: 3 wrong + 1 correct, shuffled
 *
 * @param correctWord The correct answer word
 * @param allWords Pool of words to select distractors from
 * @returns Array of 4 shuffled options (English meanings)
 */
export function generateDistractors(correctWord: Word, allWords: Word[]): string[] {
  // Filter out correct answer from pool
  const incorrectWords = allWords.filter((w) => w.id !== correctWord.id);

  // Take 3 random incorrect words
  const shuffled = [...incorrectWords].sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, 3).map((w) => w.english);

  // Add correct answer
  const options = [...distractors, correctWord.english];

  // Shuffle final options (randomize correct position)
  return options.sort(() => Math.random() - 0.5);
}
