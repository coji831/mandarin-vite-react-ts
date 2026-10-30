/**
 * quizSessionStore — the session announcement + the guest completion path.
 *
 * Epic 26 §26.2.4: one `role="status"` node in QuizSessionPage reads
 * `announcement`, and the store is its only writer. The completion summary is
 * composed ONCE at the RESULTS transition from LOCAL state — never from
 * `completionResult`, which lands later and would announce the same fact twice.
 *
 * Epic 26 §26.4.5: `initialize` calls `createQuizAttempt` unconditionally (the
 * server's OptionalAuthGuard returns a mock and writes no row). This file asserts
 * the client half — one call, no auth branch — and that the session still
 * completes from local state when the attempt id is a mock. The row-level
 * assertion ("0 QuizAttempt rows for a guest") lives in the controller test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useQuizSessionStore } from "../quizSessionStore";
import { quizService } from "../../services/quizService";
import { createInitialSession } from "../../types";
import type { QuizQuestion } from "../../types";

/** Exactly what the server's OptionalAuthGuard stub returns for a guest attempt. */
const GUEST_STUB_RESULT = {
  totalScore: 0,
  maxScore: 0,
  passed: false,
  accuracy: 0,
  categoryBreakdown: { pinyin: 0, tones: 0, pairs: 0, rules: 0 },
};

const STRATEGY_CONFIG = {
  type: "audio-to-pinyin-tone",
  questionCount: 10,
  passThreshold: 0.6,
  timeLimitMinutes: 2.5,
  tierRules: null,
};

function makeQuestion(index: number): QuizQuestion {
  return {
    id: `q${index + 1}`,
    audioKey: "bā",
    correctPinyin: "ba",
    correctTone: 1,
    category: "pinyin",
    displayPinyin: "bā",
  };
}

const TEN_QUESTIONS = Array.from({ length: 10 }, (_, i) => makeQuestion(i));

let submitSpy: ReturnType<typeof vi.spyOn>;

function stubServices(questions: QuizQuestion[]) {
  vi.spyOn(quizService, "getQuizConfig").mockResolvedValue(STRATEGY_CONFIG);
  vi.spyOn(quizService, "fetchQuestions").mockResolvedValue(questions);
  vi.spyOn(quizService, "createQuizAttempt").mockResolvedValue({
    id: "guest-mock-attempt",
  } as Awaited<ReturnType<typeof quizService.createQuizAttempt>>);
  vi.spyOn(quizService, "completeQuizAttempt").mockResolvedValue(GUEST_STUB_RESULT);
  submitSpy = vi.spyOn(quizService, "submitAnswer").mockResolvedValue({
    correct: true,
  } as Awaited<ReturnType<typeof quizService.submitAnswer>>);
}

async function answerAll(correct: boolean) {
  const total = useQuizSessionStore.getState().questions.length;
  for (let i = 0; i < total; i += 1) {
    await useQuizSessionStore.getState().submitAnswer(correct ? "ba" : "bo", correct ? 1 : 3);
    if (useQuizSessionStore.getState().phase === "FEEDBACK") {
      useQuizSessionStore.getState().nextQuestion();
    }
  }
}

describe("quizSessionStore — announcements (§26.2.4)", () => {
  beforeEach(() => {
    useQuizSessionStore.setState(createInitialSession("audio-to-pinyin-tone"));
    stubServices(TEN_QUESTIONS);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("announces the session start, the verdict, and the advance", async () => {
    await useQuizSessionStore.getState().initialize("audio-to-pinyin-tone");
    // No remote attempt: the local evaluation is the verdict (an online guest's
    // stub answers cannot contradict it for this strategy either).
    useQuizSessionStore.setState({ attemptId: null });
    expect(useQuizSessionStore.getState().announcement).toBe("Session started. Question 1 of 10.");

    await useQuizSessionStore.getState().submitAnswer("ba", 1);
    expect(useQuizSessionStore.getState().announcement).toBe("Correct. Tone 1.");

    useQuizSessionStore.getState().nextQuestion();
    expect(useQuizSessionStore.getState().announcement).toBe("Question 2 of 10.");

    await useQuizSessionStore.getState().submitAnswer("bo", 3);
    expect(useQuizSessionStore.getState().announcement).toBe(
      "Incorrect. The answer is bā, tone 1.",
    );
  });

  it("announces the timer thresholds only, never the ticking value", async () => {
    await useQuizSessionStore.getState().initialize("audio-to-pinyin-tone");

    useQuizSessionStore.setState({ timer: 20 });
    useQuizSessionStore.getState().tick();
    expect(useQuizSessionStore.getState().timer).toBe(19);
    expect(useQuizSessionStore.getState().announcement).toBe("Session started. Question 1 of 10.");

    useQuizSessionStore.setState({ timer: 31 });
    useQuizSessionStore.getState().tick();
    expect(useQuizSessionStore.getState().announcement).toBe("30 seconds left");

    useQuizSessionStore.setState({ timer: 11 });
    useQuizSessionStore.getState().tick();
    expect(useQuizSessionStore.getState().announcement).toBe("10 seconds left");

    useQuizSessionStore.setState({ timer: 1 });
    useQuizSessionStore.getState().tick();
    expect(useQuizSessionStore.getState().phase).toBe("RESULTS");
    expect(useQuizSessionStore.getState().announcement).toBe("Time is up. Showing your results.");
  });

  it("composes the completion summary once, at the transition, from local state", async () => {
    vi.restoreAllMocks();
    stubServices([makeQuestion(0)]);
    await useQuizSessionStore.getState().initialize("audio-to-pinyin-tone");

    await useQuizSessionStore.getState().submitAnswer("ba", 1);

    // Local state says passed; the server stub that lands later says otherwise
    // and must not be able to rewrite (or re-announce) the summary.
    expect(useQuizSessionStore.getState().phase).toBe("RESULTS");
    expect(useQuizSessionStore.getState().announcement).toBe(
      "Quiz complete. 1 of 1, 100 percent. Passed.",
    );

    await vi.waitFor(() => {
      expect(useQuizSessionStore.getState().completionResult).toEqual(GUEST_STUB_RESULT);
    });
    expect(useQuizSessionStore.getState().announcement).toBe(
      "Quiz complete. 1 of 1, 100 percent. Passed.",
    );
  });
});

describe("quizSessionStore — guest completion path (§26.4.5)", () => {
  beforeEach(() => {
    useQuizSessionStore.setState(createInitialSession("audio-to-pinyin-tone"));
    stubServices(TEN_QUESTIONS);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("asks for an attempt once — no client-side auth branch — and completes from local state", async () => {
    await useQuizSessionStore.getState().initialize("audio-to-pinyin-tone");

    // The client does not branch on auth: the server's OptionalAuthGuard decides.
    expect(quizService.createQuizAttempt).toHaveBeenCalledTimes(1);
    expect(useQuizSessionStore.getState().attemptId).toBe("guest-mock-attempt");

    await answerAll(true);

    expect(useQuizSessionStore.getState().phase).toBe("RESULTS");
    expect(useQuizSessionStore.getState().score).toBe(10);
    await vi.waitFor(() => {
      expect(useQuizSessionStore.getState().completionResult).toEqual(GUEST_STUB_RESULT);
    });
    // The mock id is only ever used to address the attempt, never to invent a score.
    expect(submitSpy).toHaveBeenCalled();
    const attemptIds = (submitSpy.mock.calls as [string, unknown][]).map(([id]) => id);
    expect(attemptIds.every((id) => id === "guest-mock-attempt")).toBe(true);
  });
});
