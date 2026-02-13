/**
 * QuizLoading Component
 * Story 15.6: Quiz Container & State Management
 *
 * Loading state indicator while quiz questions are being prepared.
 * Displays temporary message during initialization phase.
 */

export { QuizLoading };

function QuizLoading() {
  return (
    <div className="quizLoading">
      <p className="loadingText">Loading quiz...</p>
    </div>
  );
}
