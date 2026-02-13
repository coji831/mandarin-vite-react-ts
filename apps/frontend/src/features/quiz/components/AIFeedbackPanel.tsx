/**
 * AIFeedbackPanel Component
 * Displays AI-generated error explanations with type badges
 * Story 15.7: Gamification & AI Feedback Display UI
 */

import "./AIFeedbackPanel.css";

export type ErrorType = "tone" | "character" | "meaning" | "generic";

export type AIFeedbackProps = {
  explanation: string;
  errorType: ErrorType;
  loading?: boolean;
};

const errorTypeConfig = {
  tone: {
    icon: "🔊",
    label: "Tone Error",
    className: "error-badge-tone",
  },
  character: {
    icon: "✏️",
    label: "Character Error",
    className: "error-badge-character",
  },
  meaning: {
    icon: "💡",
    label: "Meaning Error",
    className: "error-badge-meaning",
  },
  generic: {
    icon: "ℹ️",
    label: "Info",
    className: "error-badge-generic",
  },
};

export default function AIFeedbackPanel({
  explanation,
  errorType,
  loading = false,
}: AIFeedbackProps) {
  const config = errorTypeConfig[errorType];

  if (loading) {
    return (
      <div className="ai-feedback-panel">
        <div className="feedback-skeleton" role="status" aria-live="polite" aria-busy="true">
          <div className="skeleton-line skeleton-line-1"></div>
          <div className="skeleton-line skeleton-line-2"></div>
          <div className="skeleton-line skeleton-line-3"></div>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="ai-feedback-panel">
        <div className="feedback-fallback">
          <span className="fallback-icon">ℹ️</span>
          <p>AI feedback is currently unavailable. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-feedback-panel" role="region" aria-label="AI Feedback">
      <div className={`error-badge ${config.className}`}>
        <span className="error-badge-icon" aria-hidden="true">
          {config.icon}
        </span>
        <span className="error-badge-label">{config.label}</span>
      </div>
      <div className="feedback-content">
        <p className="feedback-text">{explanation}</p>
      </div>
    </div>
  );
}
