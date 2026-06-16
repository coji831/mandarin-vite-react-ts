/**
 * ExamLayout Component
 * Epic 19: State Refactor
 * Story 17.6: Reads from Zustand store directly (QuizContext removed).
 *
 * Single orchestrator for both QUESTION and ANSWER_FEEDBACK phases.
 * Consolidates QuestionLayout and FeedbackLayout into a unified exam experience.
 *
 * Responsibilities:
 * - Render progress bar
 * - Render question card with header (quiz type icon + hint button)
 * - Render question content
 * - Render hint overlay
 * - Render answer section (input or feedback based on phase)
 */

import { useCallback, useRef } from "react";
import { useQuizSessionStore } from "../../stores/quizSessionStore";
import { useAnswerSubmission } from "../../hooks/useAnswerSubmission";
import { QuestionSection, ProgressBar, HintOverlay, AnswerSection, FeedbackSection } from "../";
import "./ExamLayout.css";

export function ExamLayout() {
  const phase = useQuizSessionStore((s) => s.phase);
  const questions = useQuizSessionStore((s) => s.questions);
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);
  const answers = useQuizSessionStore((s) => s.answers);
  const showHint = useQuizSessionStore((s) => s.showHint);
  const answerValue = useQuizSessionStore((s) => s.answerValue);
  const aiFeedback = useQuizSessionStore((s) => s.aiFeedback);
  const sessionId = useQuizSessionStore((s) => s.sessionId);

  const questionStartTime = useRef(Date.now());

  // Derived values
  const currentQuestion =
    questions.length > 0 && currentIndex < questions.length ? questions[currentIndex] : undefined;

  // Answer submission hook (was previously initialized in QuizContext)
  const { submitAnswer } = useAnswerSubmission({
    sessionId,
    currentQuestion,
    questionStartTime,
  });

  // Action handlers
  const handleNext = useCallback(() => {
    useQuizSessionStore.getState().nextQuestion();
    questionStartTime.current = Date.now();
  }, []);

  const handleAnswer = useCallback(
    async (userAnswer: string) => {
      await submitAnswer(userAnswer);
    },
    [submitAnswer],
  );

  const handleSubmitAnswer = useCallback(() => {
    if (answerValue.trim().length === 0) return;
    submitAnswer(answerValue.trim().toLowerCase());
    useQuizSessionStore.getState().setAnswerValue("");
  }, [answerValue, submitAnswer]);

  const setAnswerValue = useCallback((value: string) => {
    useQuizSessionStore.getState().setAnswerValue(value);
  }, []);

  const toggleHint = useCallback(() => {
    useQuizSessionStore.getState().toggleHint(!showHint);
  }, [showHint]);

  if (!currentQuestion) {
    return null;
  }

  const lastAnswer = answers[answers.length - 1];
  const showSubmitButton = currentQuestion.mode !== "multiple_choice";

  return (
    <div className="examLayoutContainer">
      <ProgressBar current={currentIndex + 1} total={questions.length} />

      <div className="quizMainCard">
        {/* Question Card */}
        <div className="questionCardWrapper">
          <QuestionSection
            question={currentQuestion}
            mode={currentQuestion.mode}
            onToggleHint={toggleHint}
          />
        </div>

        {/* Hint overlay */}
        <HintOverlay
          isOpen={showHint}
          onClose={toggleHint}
          mode={currentQuestion.mode}
          pinyin={currentQuestion.pinyin}
          english={currentQuestion.english}
        />

        {/* Answer Section - Consolidated QuestionLayout + FeedbackLayout */}
        <div className="answerInputContainer">
          {phase === "QUESTION" && (
            <AnswerSection
              mode={currentQuestion.mode}
              options={currentQuestion.options}
              answerValue={answerValue}
              onAnswerChange={setAnswerValue}
              onSubmit={handleSubmitAnswer}
              onAnswerSelect={handleAnswer}
              currentIndex={currentIndex}
              showSubmitButton={showSubmitButton}
            />
          )}

          {phase === "ANSWER_FEEDBACK" && lastAnswer && (
            <FeedbackSection
              isCorrect={lastAnswer.correct}
              aiFeedback={aiFeedback}
              userAnswer={lastAnswer.userAnswer}
              correctAnswer={lastAnswer.correctAnswer ?? ""}
              onNext={handleNext}
            />
          )}
        </div>
      </div>
    </div>
  );
}
