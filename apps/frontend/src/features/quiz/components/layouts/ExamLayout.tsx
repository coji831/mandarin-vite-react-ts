/**
 * ExamLayout Component
 * Epic 19: State Refactor
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
 *
 * All state and actions read from QuizContext - zero props drilling.
 */

import { useQuizState, useQuizActions } from "../../context";
import { QuestionSection, ProgressBar, HintOverlay, AnswerSection, FeedbackSection } from "../";
import "./ExamLayout.css";

export function ExamLayout() {
  const {
    phase,
    currentQuestion,
    currentIndex,
    questions,
    showHint,
    answerValue,
    aiFeedback,
    answers,
  } = useQuizState();

  const { toggleHint, setAnswerValue, handleSubmitAnswer, handleAnswer, handleNext } =
    useQuizActions();

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
