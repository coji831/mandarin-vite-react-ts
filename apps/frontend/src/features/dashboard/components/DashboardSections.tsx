/**
 * DashboardSections
 *
 * Phase 2+ dashboard body (overview archetype). Owns the page's section rhythm
 * via PageStack; the page container owns the PageShell measure.
 *
 * Rework (§8): the page had ONE primary CTA plus four QuickTiles (Review / Quiz
 * / Radicals / Progress) — every one of which the rail already carries — and a
 * Current Phase card that duplicated the rail's phase grouping. All five are
 * gone. What is left is the shape the proposal names: h1 + ONE primary next
 * step, then the BM-2 WEDGE card ("Hear your tone"), then a single
 * "Pick up where you left off" row.
 */
import { Box, Button, Icon, PageHeader, PageStack } from "shared/components";
import type { IconName } from "shared/components";
import { ToneDemoCard } from "./ToneDemoCard";

export type ActivityItem = {
  icon: IconName;
  text: string;
};

export interface DashboardSectionsProps {
  /** Phase title without its number, e.g. "The Core 300". */
  phaseTitle: string;
  /** The one next step, verbatim (e.g. "Pinyin §3 — the four tones"). */
  nextStep: string;
  streakDays: number;
  /** Most recent thing the learner did; absent = nothing to resume. */
  lastActivity?: ActivityItem | null;
  onContinueLearning?: () => void;
  /** Opens the tone drill that stands in for the (not yet live) grading demo. */
  onTryToneDemo: () => void;
}

export function DashboardSections({
  phaseTitle,
  nextStep,
  streakDays,
  lastActivity,
  onContinueLearning,
  onTryToneDemo,
}: DashboardSectionsProps) {
  return (
    <PageStack size="default">
      <PageHeader
        eyebrow={phaseTitle}
        title="Welcome back"
        description={
          <span className="flex-center gap-xs">
            <Icon name="flame" size={16} aria-hidden />
            {streakDays} day streak
          </span>
        }
      >
        <Button variant="primary" onClick={onContinueLearning}>
          Continue: {nextStep}
        </Button>
      </PageHeader>

      {/* BM-2 wedge — the home surface's proof, not another destination tile. */}
      <ToneDemoCard onTry={onTryToneDemo} />

      {/* ONE resume row — not a grid of destinations. */}
      <section aria-labelledby="dashboard-resume-title" className="flex flex-col gap-sm">
        <h2 id="dashboard-resume-title" className="font-lg fw-600 text-primary m-0">
          Pick up where you left off
        </h2>
        {lastActivity ? (
          <Box variant="card-elevated" className="flex-center gap-sm font-sm text-secondary">
            <span aria-hidden="true">
              <Icon name={lastActivity.icon} size={16} />
            </span>
            <span>{lastActivity.text}</span>
          </Box>
        ) : (
          <p className="font-sm text-tertiary m-0">
            Nothing to resume yet — your first step is the Blueprint.
          </p>
        )}
      </section>
    </PageStack>
  );
}
