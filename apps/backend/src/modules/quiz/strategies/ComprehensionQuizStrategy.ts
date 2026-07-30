/**
 * @file apps/backend/src/modules/quiz/strategies/ComprehensionQuizStrategy.ts
 * @description Template-based comprehension question generator from passage sentences.
 * Generates 5 multiple-choice questions by extracting subjects/verbs/objects from
 * passage sentences using Chinese text patterns. Distractors drawn from other
 * elements in the same passage. No LLM dependency.
 *
 * Story 21.9: Phase Gate Calibration
 */

import { GATE_THRESHOLDS } from "../../../config/gate-thresholds.js";
import { shuffleArray } from "../../../shared/utils/contentUtils.js";
import type {
  PassageRecord,
  PassageContent,
  PassageSentence,
} from "../../readers/types/readers.js";

// ── Types ───────────────────────────────────────────────────────────────────

export interface ComprehensionQuestion {
  id: string;
  type: "subject" | "action" | "location" | "object";
  question: string;
  sentence: string;
  correctAnswer: string;
  choices: string[];
  correctIndex: number;
}

/**
 * Represents an extractable element from a sentence.
 */
interface SentenceElement {
  text: string;
  type: "subject" | "verb" | "object" | "location" | "other";
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Roughly extract potential "elements" from a Chinese sentence based on
 * common grammatical patterns. This is a heuristic — not NLP.
 *
 * Patterns matched:
 * - "S 是 O" → subject = S, object = O
 * - "S V O" → verb = V, object = O
 * - "在 L" → location = L
 * - "S 有 O" → subject = S, object = O
 * - "S 很 Adj" → subject = S, verb = Adj
 * - "S 也/都/还 V" → subject = S, verb = V
 */
function extractElements(sentence: string): SentenceElement[] {
  const elements: SentenceElement[] = [];
  const text = sentence.trim();

  // Split by common punctuation to get clauses
  const clauses = text.split(/[,，。！？、；;：:\n]/).filter(Boolean);

  for (const clause of clauses) {
    const trimmed = clause.trim();
    if (!trimmed) continue;

    // Try to extract based on patterns
    // Pattern: X 是 Y (X is Y)
    const shiMatch = trimmed.match(/^(.{1,20})是(.{1,20})$/);
    if (shiMatch) {
      elements.push({ text: shiMatch[1].trim(), type: "subject" });
      elements.push({ text: shiMatch[2].trim(), type: "object" });
      continue;
    }

    // Pattern: X 有 Y (X has Y)
    const youMatch = trimmed.match(/^(.{1,20})有(.{1,20})$/);
    if (youMatch) {
      elements.push({ text: youMatch[1].trim(), type: "subject" });
      elements.push({ text: youMatch[2].trim(), type: "object" });
      continue;
    }

    // Pattern: 在 L (at/in location) — look for location phrases
    const zaiMatch = trimmed.match(/在(.{1,30})/);
    if (zaiMatch) {
      elements.push({ text: zaiMatch[1].trim(), type: "location" });
    }

    // Pattern: X 很 Adj (X is very Adj)
    const henMatch = trimmed.match(/^(.{1,15})很(.{2,10})$/);
    if (henMatch) {
      elements.push({ text: henMatch[1].trim(), type: "subject" });
      elements.push({ text: henMatch[2].trim(), type: "verb" });
      continue;
    }

    // Pattern: X V O — extract first few chars as likely subject
    // For short sentences, treat first 1-3 chars as subject
    if (trimmed.length >= 4) {
      // Likely subject: first 1-3 characters (typically a noun/pronoun)
      const firstChars = trimmed.slice(0, Math.min(3, trimmed.length));
      elements.push({ text: firstChars, type: "subject" });

      // Likely verb/object: remaining text
      const rest = trimmed.slice(Math.min(3, trimmed.length));
      if (rest.length >= 2) {
        // Try to identify a verb (often 1-2 chars)
        const verb = rest.slice(0, Math.min(2, rest.length));
        elements.push({ text: verb, type: "verb" });
      }
    }
  }

  return elements;
}

/**
 * Collect all unique non-target elements from a passage to use as distractor pool.
 */
function _collectDistractorPool(
  targetSentence: string,
  allSentences: PassageSentence[],
  excludeElements: string[],
): string[] {
  const pool = new Set<string>();

  for (const sentence of allSentences) {
    if (sentence.text === targetSentence) continue;
    const elements = extractElements(sentence.text);
    for (const el of elements) {
      const trimmed = el.text.trim();
      if (trimmed && !excludeElements.includes(trimmed) && trimmed.length >= 1) {
        pool.add(trimmed);
      }
    }
  }

  return Array.from(pool);
}

/**
 * Build a question based on the sentence's subject element.
 */
function buildSubjectQuestion(
  sentence: PassageSentence,
  elements: SentenceElement[],
  distractorPool: string[],
  index: number,
): ComprehensionQuestion | null {
  const subject = elements.find((e) => e.type === "subject");
  if (!subject || subject.text.length < 1) return null;

  const distractors = pickDistractors(distractorPool, 3, subject.text);
  const choices = shuffleArray([subject.text, ...distractors]);
  const correctIndex = choices.indexOf(subject.text);

  return {
    id: `comp-q-subject-${index}`,
    type: "subject",
    question: `Who or what is this sentence about?`,
    sentence: sentence.text,
    correctAnswer: subject.text,
    choices,
    correctIndex,
  };
}

/**
 * Build a question based on the sentence's verb/action element.
 */
function buildActionQuestion(
  sentence: PassageSentence,
  elements: SentenceElement[],
  distractorPool: string[],
  index: number,
): ComprehensionQuestion | null {
  const verb = elements.find((e) => e.type === "verb");
  if (!verb || verb.text.length < 1) return null;

  const distractors = pickDistractors(distractorPool, 3, verb.text);
  const choices = shuffleArray([verb.text, ...distractors]);
  const correctIndex = choices.indexOf(verb.text);

  return {
    id: `comp-q-action-${index}`,
    type: "action",
    question: `What action is described in this sentence?`,
    sentence: sentence.text,
    correctAnswer: verb.text,
    choices,
    correctIndex,
  };
}

/**
 * Build a question based on the sentence's location element.
 */
function buildLocationQuestion(
  sentence: PassageSentence,
  elements: SentenceElement[],
  distractorPool: string[],
  index: number,
): ComprehensionQuestion | null {
  const location = elements.find((e) => e.type === "location");
  if (!location || location.text.length < 1) return null;

  const distractors = pickDistractors(distractorPool, 3, location.text);
  const choices = shuffleArray([location.text, ...distractors]);
  const correctIndex = choices.indexOf(location.text);

  return {
    id: `comp-q-location-${index}`,
    type: "location",
    question: `Where does this sentence take place?`,
    sentence: sentence.text,
    correctAnswer: location.text,
    choices,
    correctIndex,
  };
}

/**
 * Build a question based on the sentence's object element.
 */
function buildObjectQuestion(
  sentence: PassageSentence,
  elements: SentenceElement[],
  distractorPool: string[],
  index: number,
): ComprehensionQuestion | null {
  const object = elements.find((e) => e.type === "object");
  if (!object || object.text.length < 1) return null;

  const distractors = pickDistractors(distractorPool, 3, object.text);
  const choices = shuffleArray([object.text, ...distractors]);
  const correctIndex = choices.indexOf(object.text);

  return {
    id: `comp-q-object-${index}`,
    type: "object",
    question: `What is being described or mentioned in this sentence?`,
    sentence: sentence.text,
    correctAnswer: object.text,
    choices,
    correctIndex,
  };
}

/**
 * Pick N random distinct items from an array, excluding specified items.
 */
function pickDistractors(pool: string[], n: number, exclude: string): string[] {
  const filtered = pool.filter((item) => item !== exclude);
  return shuffleArray(filtered).slice(0, n);
}

// ── Strategy Factory ────────────────────────────────────────────────────────

/**
 * ComprehensionQuizStrategy
 * Generates multiple-choice comprehension questions from passage sentences
 * using template-based pattern matching. No LLM dependency.
 */
export const comprehensionQuizStrategy = {
  type: "comprehension",
  questionCount: GATE_THRESHOLDS.COMPREHENSION_QUESTION_COUNT,
  passThreshold: GATE_THRESHOLDS.COMPREHENSION_QUIZ_MIN_SCORE,
  timeLimitMinutes: 10,

  /**
   * Generate comprehension questions from a passage.
   * @param userId - User ID (unused in template-based generation)
   * @param passage - Optional passage record to generate questions from
   */
  async generateQuestions(
    userId?: string,
    passage?: PassageRecord,
  ): Promise<ComprehensionQuestion[]> {
    if (!passage) {
      throw new Error("ComprehensionQuizStrategy requires a passage to generate questions");
    }

    const content = passage.content as PassageContent;
    const sentences = content.sentences;

    if (!sentences || sentences.length === 0) {
      throw new Error("Passage has no sentences to generate questions from");
    }

    // Pre-compute distractor pool from all sentences
    const allElements: SentenceElement[] = [];
    for (const sentence of sentences) {
      allElements.push(...extractElements(sentence.text));
    }
    const globalDistractorPool = allElements.map((e) => e.text).filter((t) => t.length >= 1);
    const uniqueDistractorPool = [...new Set(globalDistractorPool)];

    // Pick target sentences (shuffle and pick)
    const targetSentences = shuffleArray([...sentences]).slice(
      0,
      GATE_THRESHOLDS.COMPREHENSION_QUESTION_COUNT,
    );

    const questions: ComprehensionQuestion[] = [];

    for (let i = 0; i < targetSentences.length; i++) {
      const sentence = targetSentences[i];
      const elements = extractElements(sentence.text);

      // Try to build a question, prioritizing different question types
      const questionTypes = [
        () => buildSubjectQuestion(sentence, elements, uniqueDistractorPool, i),
        () => buildActionQuestion(sentence, elements, uniqueDistractorPool, i),
        () => buildLocationQuestion(sentence, elements, uniqueDistractorPool, i),
        () => buildObjectQuestion(sentence, elements, uniqueDistractorPool, i),
      ];

      // Shuffle question types for variety
      const shuffledTypes = shuffleArray(questionTypes);

      for (const builder of shuffledTypes) {
        const question = builder();
        if (question) {
          questions.push(question);
          break;
        }
      }
    }

    if (questions.length === 0) {
      throw new Error("Failed to generate any comprehension questions from the passage");
    }

    return questions;
  },
};
