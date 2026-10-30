/**
 * DictationQuestion — the wired `listening-dictation` surface (Epic 26 §26.3.4).
 *
 * `DictationQuestionView` is the approved shell; this host supplies the audio it
 * never touches. Playback goes through the shared per-item hook (the same engine
 * `AudioPlayer` uses), on demand only — nothing here autoplays.
 *
 * `promptGlyph: "hide"`: the glyph reaches TTS and never the screen.
 */
import { useEffect, useRef, useState } from "react";
import { useAudioItemPlayback } from "shared/hooks";
import { useQuizSessionStore } from "../../stores/quizSessionStore";
import { DictationQuestionView } from "./DictationQuestionView";

const INSTRUCTION = "Play the audio, then type what you hear. Tone numbers are fine (ni3 hao3).";

export function DictationQuestion() {
  const questions = useQuizSessionStore((s) => s.questions);
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);
  const submitAnswer = useQuizSessionStore((s) => s.submitAnswer);
  const question = questions[currentIndex];

  const [answer, setAnswer] = useState("");
  const [replayCount, setReplayCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { play, isPlaying, isLoading, error } = useAudioItemPlayback();

  useEffect(() => {
    setAnswer("");
    setReplayCount(0);
    setSubmitting(false);
    headingRef.current?.focus();
  }, [currentIndex]);

  const glyph = question?.character ?? question?.audioKey ?? "";

  return (
    <DictationQuestionView
      instruction={INSTRUCTION}
      fieldLabel="Your transcription"
      answer={answer}
      onAnswerChange={setAnswer}
      onSubmit={() => {
        if (!answer.trim() || submitting) return;
        setSubmitting(true);
        void submitAnswer(answer.trim(), 0).finally(() => setSubmitting(false));
      }}
      playing={isPlaying || isLoading}
      replayCount={replayCount}
      onReplay={() => {
        if (!glyph || isPlaying || isLoading) return;
        play(glyph);
        setReplayCount((count) => count + 1);
      }}
      submitting={submitting}
      locked={submitting}
      audioError={error ? "The audio did not play. Press Replay to try again." : null}
      empty={!question}
      headingRef={headingRef}
    />
  );
}
