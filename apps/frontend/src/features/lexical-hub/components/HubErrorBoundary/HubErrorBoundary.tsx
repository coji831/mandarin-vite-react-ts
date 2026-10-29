/**
 * @file features/lexical-hub/components/HubErrorBoundary/HubErrorBoundary.tsx
 * @description Error boundary for the lexical hub SHEET's body.
 *
 * A hub body that throws used to blank the WHOLE app: React unmounted from the
 * root, taking the rail, the top bar and the page with it (no boundary existed
 * anywhere in the tree). This boundary sits inside the sheet, below its header,
 * so a failed entity renders the shared `ErrorScreen` inside the sheet and the
 * learner can still hop back, retry, or close the peek — the app never blanks
 * and the peek never navigates.
 *
 * Retry remounts the body (`onRetry` bumps the caller's key), so a failure
 * caused by one bad fetch is recoverable rather than sticky.
 */
import { Component, type ReactNode } from "react";
import { ErrorScreen } from "shared/components";

export type HubErrorBoundaryProps = {
  children: ReactNode;
  /** Called after the boundary clears its error — the sheet remounts the body. */
  onRetry?: () => void;
};

type HubErrorBoundaryState = { error: Error | null };

export class HubErrorBoundary extends Component<HubErrorBoundaryProps, HubErrorBoundaryState> {
  state: HubErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): HubErrorBoundaryState {
    return { error };
  }

  private handleRetry = () => {
    this.setState({ error: null });
    this.props.onRetry?.();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <ErrorScreen
        error={error.message || "This entry could not be displayed."}
        onRetry={this.handleRetry}
        title="This entry could not be shown"
      />
    );
  }
}
