/**
 * AnswerInput.tsx
 * Phase 1 Gate Quiz — Combined answer input with auto-submit
 *
 * Reads local state for pinyin + tone, auto-submits when both are filled.
 * Transitions phase from QUESTION → INPUT during typing, then submit → FEEDBACK.
 */

import { useState, useEffect } from "react";
import { useQuizSessionStore } from "../stores/quizSessionStore";
import { PinyinToneInput } from "./inputs/PinyinToneInput";

/** Answer input with auto-submit on completed input */
export function AnswerInput() {
  const [pinyin, setPinyin] = useState("");
  const [tone, setTone] = useState(-1);
  const submitAnswer = useQuizSessionStore((s) => s.submitAnswer);

  // Auto-submit via debounce when both pinyin and tone are filled
  useEffect(() => {
    if (pinyin.trim() && tone >= 0) {
      const timer = setTimeout(() => {
        submitAnswer(pinyin.trim().toLowerCase(), tone);
        setPinyin("");
        setTone(-1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pinyin, tone, submitAnswer]);

  return (
    <div className="quiz-question__answer flex-col gap-sm p-sm">
      <PinyinToneInput
        pinyin={pinyin}
        tone={tone}
        onPinyinChange={setPinyin}
        onToneSelect={setTone}
      />
    </div>
  );
}
