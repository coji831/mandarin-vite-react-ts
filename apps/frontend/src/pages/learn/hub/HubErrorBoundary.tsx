/**
 * @file pages/learn/hub/HubErrorBoundary.tsx
 * @description Route-level error boundary for the routed lexical session.
 *
 * A hub body that throws used to blank the WHOLE app: React unmounted from the
 * root, taking the rail, the top bar and the page with it (no boundary existed
 * anywhere in the tree). This boundary sits inside the session page, below the
 * chrome, so a failed entity renders the shared `ErrorScreen` inside Focus chrome
 * and the learner can leave with Back/Close or retry the body.
 *
 * Retry remounts the body in the page (`onRetry` bumps the boundary's key), so a
 * failure caused by one bad fetch is recoverable rather than sticky.
 */
import { Component, type ReactNode } from "react";
import { ErrorScreen } from "shared/components";

export type HubErrorBoundaryProps = {
  children: ReactNode;
  /** Called after the boundary clears its error — the page remounts the body. */
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
