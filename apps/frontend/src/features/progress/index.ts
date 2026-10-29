/**
 * @file index.ts
 * @description Barrel exports for the progress feature (Progress page data +
 * its one populated card). Re-exports only — no inline definitions.
 */

export { useProgressSummary } from "./hooks/useProgressSummary";
export type { ProgressSummary } from "./hooks/useProgressSummary";

export { ProgressSummaryCard } from "./components/ProgressSummaryCard";
export type { ProgressSummaryCardProps } from "./components/ProgressSummaryCard";
