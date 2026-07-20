/**
 * DashboardWelcome
 *
 * Phase 1 welcome state for the dashboard.
 * Renders the empty-state prompt when the user hasn't started any phase yet.
 */
import { Box, Button } from "shared/components";

export interface DashboardWelcomeProps {
  streakDays?: number;
  onStartLearning?: () => void;
}

export function DashboardWelcome({ streakDays = 0, onStartLearning }: DashboardWelcomeProps) {
  return (
    <div className="dashboard mx-auto p-lg flex-col gap-lg">
      <div className="flex-col gap-xs">
        <h1 className="font-3xl text-primary">👋 Welcome to PinyinPal!</h1>
        <p className="m-0 text-tertiary font-sm">🔥 {streakDays} days</p>
      </div>
      <Box
        variant="dashed"
        padding="2xl"
        className="dashboard-empty-state flex-col-center gap-lg text-center"
      >
        <span className="font-5xl lh-1">🎉</span>
        <h2 className="font-2xl fw-700 text-primary m-0">Let's start learning!</h2>
        <p className="font-md text-secondary m-0 max-w-480">
          Begin with the foundations: master Pinyin, tones, and basic strokes. No characters needed
          yet.
        </p>
        <Button variant="primary" size="lg" onClick={onStartLearning}>
          Start with Pinyin Basics ▸
        </Button>
      </Box>
    </div>
  );
}
