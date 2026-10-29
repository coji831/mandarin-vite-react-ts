/**
 * DashboardGuest
 *
 * Guest-facing dashboard. Owns the page's section rhythm via PageStack +
 * PageGrid (the page container owns the PageShell measure).
 *
 * Rework (§8): the order is INVERTED. The guest used to be pitched registration
 * first, then handed the course. BM-2 §4 says the opposite: prove the delta in
 * session 1 — the DEMO leads, and registration is the outcome of it ("keep this
 * queue", "keep these numbers"), not the entry fee. The wedge card therefore
 * sits directly under the h1, the Blueprint invitation is the single primary
 * CTA, and "Create account" is a ghost in the same row as the page's other
 * secondary actions.
 *
 * Phase previews stay as previews (D.2): they describe the course and never
 * claim a lock — BM-1 makes every Learn surface open to everyone.
 */
import { useNavigate } from "react-router-dom";
import { Box, Button, Icon, PageGrid, PageHeader, PageStack } from "shared/components";
import type { IconName } from "shared/components";
import { learn_foundations, register_page } from "shared/constants";
import { ToneDemoCard } from "./ToneDemoCard";

const PHASE_PREVIEWS: { phase: number; title: string; icon: IconName; description: string }[] = [
  {
    phase: 1,
    title: "Foundations",
    icon: "letters",
    description: "Pinyin, tones, and basic strokes",
  },
  {
    phase: 2,
    title: "Radicals & Characters",
    icon: "radicals",
    description: "Learn radicals and character components",
  },
  {
    phase: 3,
    title: "Reading & Grammar",
    icon: "book",
    description: "Phonetic clusters and graded readers",
  },
  {
    phase: 4,
    title: "Advanced",
    icon: "chengyu",
    description: "Mastery and advanced content",
  },
];

export function DashboardGuest() {
  const navigate = useNavigate();

  return (
    <PageStack size="default">
      {/* Header — value pitch; the single primary CTA is starting to learn. */}
      <PageHeader
        title="Welcome to PinyinPal!"
        description="Start learning Mandarin — no account needed"
      >
        <Button variant="primary" size="lg" onClick={() => navigate(learn_foundations)}>
          Start the Blueprint
        </Button>
      </PageHeader>

      {/* BM-2 wedge FIRST — prove the delta before asking for anything. */}
      <ToneDemoCard onTry={() => navigate(`${learn_foundations}/reference?tab=tones`)} />

      <div>
        <Button variant="ghost" onClick={() => navigate(register_page)}>
          Create an account to keep your progress
        </Button>
      </div>

      {/* All-phase preview cards (previews only — D.2) */}
      <PageGrid columns={2} aria-label="Course phases">
        {PHASE_PREVIEWS.map((phase) => (
          <div key={phase.phase} role="listitem" className="flex min-w-0">
            <Box variant="card-elevated" className="flex-col gap-sm flex-1">
              <Icon name={phase.icon} size={24} aria-hidden />
              <h2 className="font-lg fw-600 text-primary m-0">
                Phase {phase.phase}: {phase.title}
              </h2>
              <p className="font-sm text-secondary m-0">{phase.description}</p>
            </Box>
          </div>
        ))}
      </PageGrid>
    </PageStack>
  );
}
