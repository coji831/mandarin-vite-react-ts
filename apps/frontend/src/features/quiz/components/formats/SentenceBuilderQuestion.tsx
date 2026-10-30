/**
 * SentenceBuilderQuestion — the wired `sentence-building` surface (Epic 26 §26.3.3).
 *
 * `SentenceBuilderView` is the approved shell (tap-to-place, keyboard-first, no
 * drag); this host owns the ordered ids and the per-add announcement.
 *
 * Answer encoding (§26.4.2): the placed tokens joined by a SINGLE ASCII space,
 * `selectedTone` = the `0` sentinel. The bank chip toggles: pressing a placed
 * token removes it, so `aria-pressed` never describes a dead control.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuizSessionStore } from "../../stores/quizSessionStore";
import { SentenceBuilderView } from "./SentenceBuilderView";

export function SentenceBuilderQuestion() {
  const questions = useQuizSessionStore((s) => s.questions);
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);
  const submitAnswer = useQuizSessionStore((s) => s.submitAnswer);
  const announce = useQuizSessionStore((s) => s.announce);
  const question = questions[currentIndex];

  // Bank ids are positional: a sentence may repeat a token ("我 … 我"), and two
  // identical chips must still be two distinct placeable words.
  const bank = useMemo(
    () => (question?.tokens ?? []).map((text, index) => ({ id: `${index}:${text}`, text })),
    [question],
  );
  const textById = useMemo(() => new Map(bank.map((token) => [token.id, token.text])), [bank]);

  const [order, setOrder] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setOrder([]);
    setSubmitting(false);
    headingRef.current?.focus();
  }, [currentIndex]);

  const answer = order.map((id) => ({ id, text: textById.get(id) ?? "" }));
  const locked = submitting;

  const remove = (id: string) => {
    setOrder((current) => current.filter((tokenId) => tokenId !== id));
  };

  const handleAppend = (id: string) => {
    if (locked) return;
    if (order.includes(id)) {
      remove(id);
      announce(`Removed ${textById.get(id) ?? "the word"}.`);
      return;
    }
    const nextLength = order.length + 1;
    setOrder((current) => [...current, id]);
    announce(`Added ${textById.get(id) ?? "the word"}, position ${nextLength} of ${bank.length}.`);
  };

  const handleMove = (id: string, direction: "left" | "right") => {
    if (locked) return;
    setOrder((current) => {
      const index = current.indexOf(id);
      const target = direction === "left" ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <SentenceBuilderView
      gloss={question?.english ?? ""}
      bank={bank}
      answer={answer}
      onAppend={handleAppend}
      onRemove={(id) => {
        if (locked) return;
        remove(id);
        announce(`Removed ${textById.get(id) ?? "the word"}.`);
      }}
      onMove={handleMove}
      onReset={() => {
        if (locked) return;
        setOrder([]);
      }}
      onSubmit={() => {
        if (order.length === 0 || submitting) return;
        setSubmitting(true);
        const sentence = order.map((id) => textById.get(id) ?? "").join(" ");
        void submitAnswer(sentence, 0).finally(() => setSubmitting(false));
      }}
      submitting={submitting}
      locked={locked}
      empty={!question || bank.length === 0}
      headingRef={headingRef}
    />
  );
}
