/**
 * @file components/RadicalGrid.tsx
 * @description Responsive grid of RadicalCards
 * Story 19.1: Radicals Browser Structure
 */

import type { RadicalData } from "../types";
import { RadicalCard } from "./RadicalCard";
import "./RadicalGrid.css";
import { ErrorScreen, LoadingScreen } from "shared/components";

interface RadicalGridProps {
  radicals: RadicalData[];
  isLoading: boolean;
  error: string | null;
  onRadicalClick?: (radical: RadicalData) => void;
  onRetry?: () => void;
}

export function RadicalGrid({
  radicals,
  isLoading,
  error,
  onRadicalClick,
  onRetry,
}: RadicalGridProps) {
  if (isLoading) {
    return <LoadingScreen message="Loading radicals…" />;
  }

  if (error) {
    if (onRetry) {
      return <ErrorScreen error={error ?? "An unknown error occurred"} onRetry={onRetry} />;
    }
    return (
      <div className="error-screen flex-col-center text-center p-2xl">
        <div className="error-screen__icon font-5xl op-100">⚠️</div>
        <h2 className="text-error font-2xl">Something went wrong</h2>
        <p className="error-screen__message text-tertiary font-md">{error}</p>
      </div>
    );
  }

  if (radicals.length === 0) {
    return (
      <div className="radical-grid__empty grid flex-col flex-center p-xl">
        <p className="text-muted font-lg">No radicals match your filters.</p>
        <p className="text-muted font-sm">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="radical-grid grid gap-md" role="list" aria-label="Radicals grid">
      {radicals.map((radical) => (
        <div key={radical.id} role="listitem">
          <RadicalCard radical={radical} onClick={onRadicalClick} />
        </div>
      ))}
    </div>
  );
}
