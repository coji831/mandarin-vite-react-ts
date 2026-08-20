/**
 * DashboardGuest
 *
 * Guest-facing dashboard component for unauthenticated users.
 * PageHeader carries the single primary "Sign Up Free ▸" CTA (amber budget
 * ≤1/viewport — D.3); the hero focal card offers a secondary "Start with
 * Pinyin Basics ▸"; all-phase preview cards follow.
 *
 * No SRS/progress/gamification sections — those are registered-only.
 */
import { useNavigate } from "react-router-dom";
import { Box, Button, Icon, PageHeader } from "shared/components";
import type { IconName } from "shared/components";
import { learn_foundations, register_page } from "shared/constants";

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
    <div className="dashboard flex-col gap-lg">
      {/* Header — value pitch + the single primary CTA (registration merged here, D.3) */}
      <PageHeader
        title="Welcome to PinyinPal!"
        description="Start learning Mandarin — no account needed"
      >
        <Button variant="primary" size="lg" onClick={() => navigate(register_page)}>
          Sign Up Free ▸
        </Button>
      </PageHeader>

      {/* Hero focal card — start now via the secondary action (D.3/D.6) */}
      <Box
        variant="dark"
        padding="lg"
        className="dashboard-card flex-col-center gap-md text-center"
      >
        <Button variant="secondary" size="lg" onClick={() => navigate(learn_foundations)}>
          Start with Pinyin Basics ▸
        </Button>
      </Box>

      {/* All-phase preview cards (previews only — D.2) */}
      <div className="grid-2-col gap-md w-full">
        {PHASE_PREVIEWS.map((phase) => (
          <Box
            key={phase.phase}
            variant="dark"
            padding="lg"
            className="dashboard-card flex-col gap-sm"
          >
            <Icon name={phase.icon} size={24} aria-hidden />
            <h2 className="font-lg fw-600 text-primary m-0">
              Phase {phase.phase}: {phase.title}
            </h2>
            <p className="font-sm text-secondary m-0">{phase.description}</p>
          </Box>
        ))}
      </div>
    </div>
  );
}
