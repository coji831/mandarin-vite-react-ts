/**
 * LoadingScreen Component
 * Component Reorganization: Renamed from QuizLoading
 *
 * Loading state indicator while quiz questions are being prepared.
 * Displays temporary message during initialization phase.
 */

export { LoadingScreen };

type LoadingScreenProps = {
  message?: string;
};

function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="flex-col-center" style={{ minHeight: "300px" }}>
      <p
        className="text-center"
        style={{ color: "var(--text-secondary)", fontSize: "var(--font-lg)" }}
      >
        {message ?? "Loading quiz..."}
      </p>
    </div>
  );
}
