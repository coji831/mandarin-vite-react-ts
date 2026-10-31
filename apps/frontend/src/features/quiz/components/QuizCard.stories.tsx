/**
 * QuizCard.stories.tsx — the rebuilt card (Epic 26 §26.1 items 3, 5, 7).
 *
 * What to look for: every assessment in `quizzes` has its own labelled CTA, and
 * each timeline row states its phase in WORDS. `CurrentPhasePassed` is the case
 * the old card got wrong: the phase is passed and it is still the current one.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { QuizCard } from "./QuizCard";
import type { QuizAssessment } from "../hooks/useQuizCard";

const PHASE_1 = "The Blueprint - Foundations";
const PHASE_LABELS = ["The Blueprint - Foundations", "The Core 300", "The Network", "Fluidity"];

function makeTimeline(passedUpTo: number, currentPhase: number) {
  return PHASE_LABELS.map((_, index) => {
    const phase = index + 1;
    return {
      phase,
      isPassed: phase <= passedUpTo,
      isCurrent: phase === currentPhase,
      isLocked: phase > currentPhase,
    };
  });
}

const TWO_ASSESSMENTS: QuizAssessment[] = [
  { label: "Audio to Pinyin & Tone", type: "audio-to-pinyin-tone", phase: 1, tier: 1 },
  { label: "Tone Judgment", type: "tone-judgment", phase: 1, tier: 1 },
];

const meta = {
  title: "Features/Practices/Quiz/QuizCard",
  component: QuizCard,
  args: {
    currentPhase: 1,
    label: PHASE_1,
    quizzes: TWO_ASSESSMENTS,
    takeQuiz: fn(),
    timeline: makeTimeline(0, 1),
  },
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-full max-w-480">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QuizCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two assessments, two CTAs — the defect this rebuild fixes. */
export const Default: Story = {};

/** Phase 2 passed and still the current phase: the marker stays. */
export const CurrentPhasePassed: Story = {
  args: {
    currentPhase: 2,
    label: PHASE_LABELS[1],
    quizzes: [
      { label: "Listening Dictation", type: "listening-dictation", phase: 2, tier: 1 },
      { label: "IME Simulator", type: "ime-simulator", phase: 2, tier: 1 },
      { label: "Radical Gate", type: "radical-gate", phase: 2, tier: 1 },
    ],
    timeline: makeTimeline(2, 2),
  },
};

/** Aggregated phases: every assessment from phases <= current is available. */
export const AggregatedPhases: Story = {
  args: {
    currentPhase: 3,
    label: PHASE_LABELS[2],
    quizzes: [
      { label: "Cloze", type: "cloze", phase: 3, tier: 1 },
      { label: "Sentence Building", type: "sentence-building", phase: 3, tier: 1 },
      { label: "Tone Judgment", type: "tone-judgment", phase: 1, tier: 1 },
    ],
    timeline: makeTimeline(3, 3),
  },
};

/** Data-resilient shell: no assessments for the phase renders no list. */
export const NoAssessments: Story = {
  args: { quizzes: [] },
};

/** Phase 4 re-runs a phase-2 format at tier 2 — the label says so. */
export const TierTwo: Story = {
  args: {
    currentPhase: 4,
    label: PHASE_LABELS[3],
    quizzes: [
      { label: "Listening Dictation (tier 2)", type: "listening-dictation", phase: 4, tier: 2 },
    ],
    timeline: makeTimeline(3, 4),
  },
};

/** Edge — 320px: the assessment row wraps and the CTA never leaves the card. */
export const Edge: Story = {
  args: {
    currentPhase: 3,
    label: PHASE_LABELS[2],
    quizzes: [
      { label: "Sentence Building", type: "sentence-building", phase: 3, tier: 1 },
      { label: "Listening Dictation (tier 2)", type: "listening-dictation", phase: 4, tier: 2 },
    ],
    timeline: makeTimeline(2, 3),
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
