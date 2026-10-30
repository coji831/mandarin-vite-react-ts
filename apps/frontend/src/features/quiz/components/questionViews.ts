/**
 * questionViews.ts — the question-surface dispatch contract (Epic 26 §26.3.1).
 *
 * A `Record<StrategyType, ComponentType>` rather than an if-chain: adding a
 * format to the `StrategyType` union without naming its view is a type error,
 * not a silent fall-through to the pinyin input (which is what the old
 * duplicated `MULTIPLE_CHOICE_STRATEGIES` set would have caused once two
 * single-select formats existed).
 *
 * Lives outside `QuizRouter.tsx` so the router file exports components only.
 */
import type { ComponentType } from "react";
import type { StrategyType } from "../types";
import { QuestionView } from "./QuestionView";
import { IMEQuestionView } from "./ime-input/IMEQuestionView";
import { MultipleChoiceView } from "./MultipleChoiceView";
import { ClozeQuestion } from "./formats/ClozeQuestion";
import { SentenceBuilderQuestion } from "./formats/SentenceBuilderQuestion";
import { DictationQuestion } from "./formats/DictationQuestion";
import { ToneJudgmentQuestion } from "./formats/ToneJudgmentQuestion";

/** Every strategy id → the component that renders its question. */
export const QUESTION_VIEWS: Record<StrategyType, ComponentType> = {
  // Legacy FE aliases: no backend strategy, same audio + typed-pinyin surface.
  "audio-to-pinyin": QuestionView,
  "audio-to-tone": QuestionView,
  "audio-to-pinyin-tone": QuestionView,
  "ime-simulator": IMEQuestionView,
  "radical-gate": MultipleChoiceView,
  cloze: ClozeQuestion,
  "sentence-building": SentenceBuilderQuestion,
  "listening-dictation": DictationQuestion,
  "tone-judgment": ToneJudgmentQuestion,
};
