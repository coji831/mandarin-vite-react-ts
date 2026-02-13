/**
 * Daily Review Quiz Container
 * Story 15.6: Quiz Container & State Management
 *
 * Main quiz container orchestrating state machine flow:
 * - Initializes quiz with interleaved questions
 * - Manages answer validation and feedback
 * - Auto-advances after 1.5s feedback delay
 * - Composes Story 15.5 components (QuizCard, TypeAnswerInput, ToneInput)
 *
 * Mock data: 4 hardcoded words (Story 15.8 will replace with API)
 */

import { useEffect, useReducer } from "react";
import {
  QuizCard,
  QuizComplete,
  QuizLoading,
  QuizProgressBar,
  TypeAnswerInput,
} from "../components";
import "./DailyReviewQuiz.css";
import { initialState, quizReducer } from "../reducers/quizReducer";
import { QuizQuestion } from "../types/QuizTypes";
import { createInterleavedQuestions } from "../utils/interleaving";

// Mock data for Story 15.6 (Story 15.8 will replace with API)
const MOCK_DUE_WORDS = [
  { id: "1", chinese: "你好", pinyin: "nǐhǎo", english: "hello" },
  { id: "2", chinese: "谢谢", pinyin: "xièxie", english: "thank you" },
  { id: "3", chinese: "再见", pinyin: "zàijiàn", english: "goodbye" },
  { id: "4", chinese: "早上好", pinyin: "zǎoshang hǎo", english: "morning" },
];

export function DailyReviewQuiz() {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  // Initialize quiz on mount
  useEffect(() => {
    const questions = createInterleavedQuestions(MOCK_DUE_WORDS);
    dispatch({ type: "INITIALIZE_QUIZ", questions });
  }, []);

  const handleAnswer = (userAnswer: string) => {
    const currentQuestion = state.questions[state.currentIndex];
    const correct = validateAnswer(userAnswer, currentQuestion);

    dispatch({
      type: "SUBMIT_ANSWER",
      answer: {
        wordId: currentQuestion.wordId,
        questionType: currentQuestion.mode,
        userAnswer,
        correct,
        timestamp: new Date(),
      },
    });

    // Auto-advance after 1.5s
    setTimeout(() => {
      dispatch({ type: "NEXT_QUESTION" });
    }, 1500);
  };

  const validateAnswer = (userAnswer: string, question: QuizQuestion): boolean => {
    switch (question.mode) {
      case "multiple_choice":
        return userAnswer.toLowerCase() === question.english.toLowerCase();
      case "type_pinyin":
        return userAnswer.toLowerCase() === question.pinyin.toLowerCase();
      case "type_character":
        return userAnswer === question.word;
      default:
        return false;
    }
  };

  // Loading state
  if (state.phase === "LOADING") {
    return <QuizLoading />;
  }

  // Complete state
  if (state.phase === "COMPLETE") {
    return <QuizComplete answers={state.answers} />;
  }

  // Question state
  const currentQuestion = state.questions[state.currentIndex];
  const lastAnswer = state.answers[state.answers.length - 1];

  return (
    <div className="dailyReviewContainer">
      <QuizProgressBar current={state.currentIndex + 1} total={state.questions.length} />

      <QuizCard
        question={currentQuestion}
        mode={currentQuestion.mode}
        options={currentQuestion.options}
        onAnswer={handleAnswer}
      />

      {currentQuestion.mode !== "multiple_choice" && (
        <TypeAnswerInput
          placeholder={
            currentQuestion.mode === "type_pinyin" ? "Type pinyin..." : "Type character..."
          }
          mode={currentQuestion.mode}
          onAnswer={handleAnswer}
        />
      )}

      {state.phase === "ANSWER_FEEDBACK" && lastAnswer && (
        <div
          className={`feedbackContainer ${lastAnswer.correct ? "feedbackCorrect" : "feedbackIncorrect"}`}
        >
          <p
            className={`feedbackText ${lastAnswer.correct ? "feedbackTextCorrect" : "feedbackTextIncorrect"}`}
          >
            {lastAnswer.correct ? "✓ Correct!" : "✗ Incorrect"}
          </p>
        </div>
      )}
    </div>
  );
}
