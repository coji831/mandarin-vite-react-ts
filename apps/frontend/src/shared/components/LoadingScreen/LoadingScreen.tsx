/**
 * LoadingScreen Component
 * Component Reorganization: Renamed from QuizLoading
 *
 * Loading state indicator with CSS spinner animation while content is being prepared.
 * Displays temporary message during initialization phase.
 */

import { Spinner } from "shared/components";
import "./LoadingScreen.css";

export { LoadingScreen };

type LoadingScreenProps = {
  message?: string;
};

function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="flex-col-center loading-screen gap-lg">
      <Spinner size="lg" />
      <p className="m-0 text-center text-secondary font-lg">{message ?? "Loading..."}</p>
    </div>
  );
}
