/**
 * useQuizEngine.ts
 * Phase 1 Gate Quiz — Engine initializer hook
 *
 * Initializes the quiz session on mount and starts the timer.
 */

import { useEffect, useRef } from "react";
import { useQuizSessionStore } from "../stores/quizSessionStore";
import type { StrategyType } from "../types";

/**
 * Initialize a strategy-based quiz session.
 * Call from the orchestrator page when the quiz type is known.
 */
export function useQuizEngine(strategyType: StrategyType): void {
  const initialize = useQuizSessionStore((s) => s.initialize);
  const tick = useQuizSessionStore((s) => s.tick);
  const phase = useQuizSessionStore((s) => s.phase);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initialize(strategyType);
    }
  }, [strategyType, initialize]);

  // Start countdown timer when quiz is active
  useEffect(() => {
    if (phase === "QUESTION" || phase === "INPUT" || phase === "FEEDBACK") {
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [phase, tick]);
}
