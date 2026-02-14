/**
 * QuizError Component
 * Story 15.8: Core Quiz Backend Integration
 *
 * Error state display when quiz fails to load due to API errors.
 * Shows error message with retry button.
 */

import "./QuizError.css";

export { QuizError };

type QuizErrorProps = {
  error: string;
  onRetry: () => void;
};

function QuizError({ error, onRetry }: QuizErrorProps) {
  return (
    <div className="quizError">
      <div className="errorIcon">⚠️</div>
      <h2 className="errorTitle">Failed to Load Quiz</h2>
      <p className="errorMessage">{error}</p>
      <button onClick={onRetry} className="retryButton">
        Try Again
      </button>
    </div>
  );
}
