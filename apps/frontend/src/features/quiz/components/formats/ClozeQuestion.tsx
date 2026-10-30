/**
 * ClozeQuestion — the wired `cloze` surface (Epic 26 §26.3.2).
 *
 * `ClozeQuestionView` is the approved, stateless shell; this host is the only
 * thing that knows the session: it reads the current question off the store, owns
 * the chosen token, and commits through the existing two-argument
 * `submitAnswer(primary, tone)` channel (§26.4.2 — `pinyinInput` = the token,
 * `selectedTone` = the `0` sentinel).
 *
 * The verdict is never decided here. The store evaluates it and moves to
 * FEEDBACK, so the shell's `outcome` prop stays a story-only affordance.
 */
import { useEffect, useRef, useState } from "react";
import { useQuizSessionStore } from "../../stores/quizSessionStore";
import { ClozeQuestionView } from "./ClozeQuestionView";

export function ClozeQuestion() {
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

  const segments = question?.segments ?? [];
  const blankIndex = question?.blankIndex ?? segments.findIndex((segment) => segment.blank);
  const options = (question?.options ?? []).map((option) => ({
    value: option.glyph,
    label: `${option.glyph} — ${option.meaning}`,
  }));
  const hasBlank = blankIndex >= 0 && segments.length > blankIndex;

  return (
    <ClozeQuestionView
      patternName={question?.patternName ?? ""}
      gloss={question?.english ?? ""}
      sentenceBefore={
        hasBlank
          ? segments
              .slice(0, blankIndex)
              .map((s) => s.text)
              .join("")
          : ""
      }
      sentenceAfter={
        hasBlank
          ? segments
              .slice(blankIndex + 1)
              .map((s) => s.text)
              .join("")
          : ""
      }
      options={options}
      selected={selected}
      onSelect={setSelected}
      onSubmit={() => {
        if (selected === null || submitting) return;
        setSubmitting(true);
        void submitAnswer(selected, 0).finally(() => setSubmitting(false));
      }}
      submitting={submitting}
      locked={submitting}
      empty={!question || !hasBlank || options.length === 0}
      headingRef={headingRef}
    />
  );
}
