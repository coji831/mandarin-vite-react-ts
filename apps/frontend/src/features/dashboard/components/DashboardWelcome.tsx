/**
 * DashboardWelcome
 *
 * Phase 1 welcome state for the dashboard. Owns the page's section rhythm via
 * PageStack (the page container owns the PageShell measure).
 *
 * Rework (§8): ONE primary CTA (start the Blueprint) — the amber budget is
 * ≤1/viewport — then the BM-2 wedge card, so a brand-new learner meets the
 * differentiator on the first screen instead of a grid of destinations.
 */
import { Box, Button, Icon, PageHeader, PageStack } from "shared/components";
import { ToneDemoCard } from "./ToneDemoCard";

export interface DashboardWelcomeProps {
  streakDays?: number;
  onStartLearning?: () => void;
  /** Opens the tone drill standing in for the (not yet live) grading demo. */
  onTryToneDemo: () => void;
}

export function DashboardWelcome({
  streakDays = 0,
  onStartLearning,
  onTryToneDemo,
}: DashboardWelcomeProps) {
  return (
    <PageStack size="default">
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
          Start with Pinyin Basics
        </Button>
      </PageHeader>

      <ToneDemoCard onTry={onTryToneDemo} />

      <Box
        variant="dashed"
        radius="lg"
        padding="2xl"
        className="flex-col-center gap-md text-center"
      >
        <p className="font-lg fw-600 text-primary m-0">The Blueprint is seven steps</p>
        <p className="font-sm text-secondary m-0 max-w-480">
          Initials, finals, the four tones, tone pairs, stroke order, your first radicals, then your
          first twenty characters.
        </p>
      </Box>
    </PageStack>
  );
}
