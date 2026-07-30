/**
 * @file services/__mocks__/sandhiDrillService.ts
 * @description Manual mock for sandhiDrillService used in component tests
 * Story 21.17: Tone Sandhi Practice Quiz
 */

import { vi } from "vitest";

const mockQuestions = [
  {
    id: "sq-001",
    characters: "你好",
    dictionaryPinyin: "nǐ hǎo",
    correctAnswer: "ní hǎo",
    ruleId: "3-3-sandhi",
    options: ["ní hǎo", "nǐ hǎo", "nǐ háo", "nì hǎo"],
  },
  {
    id: "sq-002",
    characters: "不是",
    dictionaryPinyin: "bù shì",
    correctAnswer: "bú shì",
    ruleId: "bu-before-4th",
    options: ["bú shì", "bù shì", "bù shí", "bú shí"],
  },
];

export const getSandhiDrillQuestions = vi.fn().mockResolvedValue(mockQuestions);

export const calculateScore = vi.fn(
  (answers: { selected: string; correctAnswer: string }[]) => ({
    score: answers.filter((a) => a.selected === a.correctAnswer).length,
    total: answers.length,
    ruleScores: {},
  }),
);

export const submitSandhiDrillAttempt = vi.fn().mockResolvedValue(undefined);
