/**
 * ErrorScreen Component
 * Component Reorganization: Renamed from QuizError
 *
 * Generic error state display for any failure scenario.
 * Shows error icon, configurable title, error message, and retry button.
 */

import { Button } from "shared/components";
import "./ErrorScreen.css";

export { ErrorScreen };

type ErrorScreenProps = {
  error: string;
  onRetry: () => void;
  title?: string;
};

function ErrorScreen({ error, onRetry, title = "Something went wrong" }: ErrorScreenProps) {
  return (
    <div className="error-screen flex-col-center text-center gap-lg p-2xl">
      <div className="error-screen__icon font-5xl op-100">⚠️</div>
      <h2 className="text-error font-2xl fw-600">{title}</h2>
      <p className="error-screen__message text-tertiary font-md lh-normal">{error}</p>
      <Button variant="primary" onClick={onRetry} size="md">
        Try Again
      </Button>
    </div>
  );
}
