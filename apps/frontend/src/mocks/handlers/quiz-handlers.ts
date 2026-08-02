/**
 * @file mocks/handlers/quiz-handlers.ts
 * @description MSW handlers for Quiz API endpoints (Story 21.17)
 *
 * Provides factory functions for sandhi-drill questions endpoint:
 * default (populated), loading (never-resolving), empty, error.
 *
 * Also handles POST /v1/quiz/attempts for "sandhi-drill" quiz type.
 *
 * Handlers are used in both Storybook stories (via msw-storybook-addon)
 * and Vitest tests (via msw/node).
 */

import { http, HttpResponse } from "msw";
import type { DrillQuestion } from "features/foundations";

const API_BASE = "http://localhost:3001";

// ─── Sample Data ────────────────────────────────────────────────────────

const sampleQuestions: DrillQuestion[] = [
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
    characters: "很好",
    dictionaryPinyin: "hěn hǎo",
    correctAnswer: "hén hǎo",
    ruleId: "3-3-sandhi",
    options: ["hén hǎo", "hěn hǎo", "hěn háo", "hèn hǎo"],
  },
  {
    id: "sq-003",
    characters: "不是",
    dictionaryPinyin: "bù shì",
    correctAnswer: "bú shì",
    ruleId: "bu-before-4th",
    options: ["bú shì", "bù shì", "bù shí", "bú shí"],
  },
  {
    id: "sq-004",
    characters: "不会",
    dictionaryPinyin: "bù huì",
    correctAnswer: "bú huì",
    ruleId: "bu-before-4th",
    options: ["bú huì", "bù huì", "bù huī", "bú huī"],
  },
  {
    id: "sq-005",
    characters: "一个",
    dictionaryPinyin: "yī gè",
    correctAnswer: "yí gè",
    ruleId: "yi-before-4th",
    options: ["yí gè", "yī gè", "yì gè", "yī gé"],
  },
  {
    id: "sq-006",
    characters: "一次",
    dictionaryPinyin: "yī cì",
    correctAnswer: "yí cì",
    ruleId: "yi-before-4th",
    options: ["yí cì", "yī cì", "yì cì", "yī cí"],
  },
  {
    id: "sq-007",
    characters: "一般",
    dictionaryPinyin: "yī bān",
    correctAnswer: "yì bān",
    ruleId: "yi-before-non4th",
    options: ["yì bān", "yī bān", "yí bān", "yī bàn"],
  },
  {
    id: "sq-008",
    characters: "一年",
    dictionaryPinyin: "yī nián",
    correctAnswer: "yì nián",
    ruleId: "yi-before-non4th",
    options: ["yì nián", "yī nián", "yí nián", "yī niàn"],
  },
  {
    id: "sq-009",
    characters: "水果",
    dictionaryPinyin: "shuǐ guǒ",
    correctAnswer: "shuí guǒ",
    ruleId: "3-3-sandhi",
    options: ["shuí guǒ", "shuǐ guǒ", "shuǐ guō", "shuì guǒ"],
  },
  {
    id: "sq-010",
    characters: "一起",
    dictionaryPinyin: "yī qǐ",
    correctAnswer: "yì qǐ",
    ruleId: "yi-before-non4th",
    options: ["yì qǐ", "yī qǐ", "yí qǐ", "yī qì"],
  },
];

// ─── Handler Factories ──────────────────────────────────────────────────

export const quizHandlers = {
  default: {
    sandhiQuestions: http.get(`${API_BASE}/v1/quiz/sandhi-drill/questions`, ({ request }) => {
      const url = new URL(request.url);
      const countParam = url.searchParams.get("count");
      const count = countParam ? Math.min(parseInt(countParam, 10), 25) : 10;
      return HttpResponse.json(sampleQuestions.slice(0, count), { status: 200 });
    }),

    createAttempt: http.post(`${API_BASE}/v1/quiz/attempts`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      if (body.quizType === "sandhi-drill") {
        return HttpResponse.json(
          { id: "attempt-mock-1", quizType: "sandhi-drill", ...body },
          { status: 201 },
        );
      }
      return HttpResponse.json(
        { error: "Unsupported quiz type", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }),
  },

  loading: {
    sandhiQuestions: http.get(
      `${API_BASE}/v1/quiz/sandhi-drill/questions`,
      () => new Promise(() => {}),
    ),
  },

  empty: {
    sandhiQuestions: http.get(`${API_BASE}/v1/quiz/sandhi-drill/questions`, () =>
      HttpResponse.json([], { status: 200 }),
    ),
  },

  error: {
    sandhiQuestions: http.get(`${API_BASE}/v1/quiz/sandhi-drill/questions`, () =>
      HttpResponse.json(
        { error: "Failed to generate sandhi drill questions", code: "GENERATION_ERROR" },
        { status: 500 },
      ),
    ),
  },
};
