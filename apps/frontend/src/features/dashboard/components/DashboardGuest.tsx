/**
 * DashboardGuest
 *
 * Guest-facing dashboard component for unauthenticated users.
 * Shows a welcome message, quick action to start learning,
 * all-phase preview cards, and a registration CTA.
 *
 * No SRS/progress/gamification sections — those are registered-only.
 */
import { useNavigate } from "react-router-dom";
import { Box, Button } from "shared/components";
import { learn_foundations, register_page } from "shared/constants";

const PHASE_PREVIEWS = [
  { phase: 1, title: "Foundations", icon: "🔤", description: "Pinyin, tones, and basic strokes" },
  {
    phase: 2,
    title: "Radicals & Characters",
    icon: "📘",
    description: "Learn radicals and character components",
  },
  {
    phase: 3,
    title: "Reading & Grammar",
    icon: "📖",
    description: "Phonetic clusters and graded readers",
  },
  { phase: 4, title: "Advanced", icon: "🏮", description: "Mastery and advanced content" },
];

export function DashboardGuest() {
  const navigate = useNavigate();

  return (
    <div className="dashboard mx-auto p-lg flex-col gap-lg">
      {/* Welcome header */}
      <div className="text-center">
        <h1 className="font-3xl text-primary m-0">👋 Welcome to PinyinPal!</h1>
        <p className="font-md text-secondary m-0">Start learning Mandarin — no account needed</p>
      </div>

      {/* Quick action */}
      <Box variant="dark" padding="lg" className="flex-col-center gap-md text-center">
        <Button variant="primary" size="lg" onClick={() => navigate(learn_foundations)}>
          Start with Pinyin Basics ▸
        </Button>
      </Box>

      {/* All-phase preview cards */}
      <div className="grid-2-col gap-md w-full">
        {PHASE_PREVIEWS.map((phase) => (
          <Box key={phase.phase} variant="dark" padding="lg" className="flex-col gap-sm">
            <span className="font-3xl">{phase.icon}</span>
            <h3 className="font-lg fw-600 text-primary m-0">
              Phase {phase.phase}: {phase.title}
            </h3>
            <p className="font-sm text-secondary m-0">{phase.description}</p>
          </Box>
        ))}
      </div>

      {/* Registration CTA */}
      <Box variant="dark" padding="2xl" className="flex-col-center gap-md text-center">
        <h2 className="font-2xl fw-700 text-primary m-0">🚀 Save Your Progress</h2>
        <p className="font-md text-secondary m-0 max-w-480">
          Create a free account to save your progress, track scores, and unlock AI-powered features.
        </p>
        <Button variant="primary" size="lg" onClick={() => navigate(register_page)}>
          Sign Up Free ▸
        </Button>
      </Box>
    </div>
  );
}
