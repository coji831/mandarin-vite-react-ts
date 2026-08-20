/**
 * DashboardWelcome
 *
 * Phase 1 (empty) welcome state for the dashboard.
 * PageHeader hosts the single primary CTA (amber budget ≤1/viewport); the
 * dashed empty-state focal card carries the message only (D.3).
 */
import { Box, Button, EmptyState, Icon, PageHeader } from "shared/components";

export interface DashboardWelcomeProps {
  streakDays?: number;
  onStartLearning?: () => void;
}

export function DashboardWelcome({ streakDays = 0, onStartLearning }: DashboardWelcomeProps) {
  return (
    <div className="dashboard flex-col gap-lg">
      <PageHeader
        title="Welcome to PinyinPal!"
        description={
          <span className="flex-center gap-xs">
            <Icon name="flame" size={16} aria-hidden />
            {streakDays} day streak
          </span>
        }
      >
        <Button variant="primary" size="lg" onClick={onStartLearning}>
          Start with Pinyin Basics ▸
        </Button>
      </PageHeader>

      {/* Dashed empty-state focal card (D.3) — the CTA lives in the header */}
      <Box
        variant="dashed"
        padding="2xl"
        className="dashboard-empty-state flex-col-center gap-lg text-center"
      >
        <EmptyState
          icon="sparkles"
          title="Let's start learning!"
          description="Begin with the foundations: master Pinyin, tones, and basic strokes. No characters needed yet."
        />
      </Box>
    </div>
  );
}
