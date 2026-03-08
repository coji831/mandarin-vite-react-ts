/**
 * Quiz Hooks Barrel Export
 * Story 15.8: Core Quiz Backend Integration
 * Story 15.9: Added AI Feedback hook
 * Story 15.11: Added Session Summary hook
 */

export { useGenerateFeedback } from "./useAIFeedback";
export { useSessionSummary } from "./useSessionSummary";

export type { FeedbackRequest, FeedbackResponse } from "./useAIFeedback";
export type { UseSessionSummaryReturn } from "./useSessionSummary";
