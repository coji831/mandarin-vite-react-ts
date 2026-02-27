/**
 * ErrorScreen Component
 * Component Reorganization: Renamed from QuizError
 *
 * Error state display when quiz fails to load due to API errors.
 * Shows error message with retry button.
 */

import "./ErrorScreen.css";

export { ErrorScreen };

type ErrorScreenProps = {
  error: string;
  onRetry: () => void;
};

function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  return (
    <div className="quizError flex-col-center text-center">
      <div className="errorIcon">⚠️</div>
      <h2 className="errorTitle">Failed to Load Quiz</h2>
      <p className="errorMessage">{error}</p>
      <button onClick={onRetry} className="btn-primary">
        Try Again
      </button>
    </div>
  );
}
