/**
 * ToneJudgmentQuestion — the wired `tone-judgment` surface (Epic 26 §26.3.5).
 *
 * Written stimulus only: `ToneJudgmentView` renders the phrase and its base
 * tones, and this host deliberately mounts NO audio primitive — that absence is
 * what separates the format from `audio-to-tone` (perception from audio).
 *
 * Answer encoding (§26.4.2): `pinyinInput` = the judged syllable,
 * `selectedTone` = the chosen tone 0–4.
 */
import { useEffect, useRef, useState } from "react";
import { extractToneNumber } from "@mandarin/shared-utils";
import { useQuizSessionStore } from "../../stores/quizSessionStore";
import { ToneJudgmentView } from "./ToneJudgmentView";
import type { SelectOption } from "./ClozeQuestionView";

/** Neutral first, then tones 1-4 — the group's natural reading order. */
const TONE_OPTIONS: SelectOption[] = [
  { value: "0", label: "Neutral tone (0)" },
  { value: "1", label: "First tone (1)" },
  { value: "2", label: "Second tone (2)" },
  { value: "3", label: "Third tone (3)" },
  { value: "4", label: "Fourth tone (4)" },
];

export function ToneJudgmentQuestion() {
  const questions = useQuizSessionStore((s) => s.questions);
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);
  const submitAnswer = useQuizSessionStore((s) => s.submitAnswer);
  const question = questions[currentIndex];

  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setSelected(null);
    setSubmitting(false);
    headingRef.current?.focus();
  }, [currentIndex]);

  const targetIndex = question?.targetIndex ?? -1;
  const syllables = (question?.dictionaryPinyin ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((text, index) => ({
      text,
      // Every syllable shows its DICTIONARY tone; only the target's surface tone
      // is the question, so nothing here reveals the answer (§26.3.5).
      baseTone:
        index === targetIndex
          ? (question?.baseTone ?? extractToneNumber(text))
          : extractToneNumber(text),
      target: index === targetIndex,
    }));

  const judgedSyllable = question?.targetSyllable ?? syllables[targetIndex]?.text ?? "";
  const targetGlyph = question?.targetGlyph ?? "";

  return (
    <ToneJudgmentView
      ruleName={question?.ruleTitle ?? question?.ruleId ?? ""}
      syllables={syllables}
      question={
        targetGlyph
          ? `What tone does ${targetGlyph} surface as here?`
          : "What tone does the marked syllable surface as here?"
      }
      options={TONE_OPTIONS}
      selected={selected}
      onSelect={setSelected}
      onSubmit={() => {
        if (selected === null || submitting) return;
        setSubmitting(true);
        void submitAnswer(judgedSyllable, Number(selected)).finally(() => setSubmitting(false));
      }}
      submitting={submitting}
      locked={submitting}
      empty={!question || syllables.length === 0}
      headingRef={headingRef}
    />
  );
}
