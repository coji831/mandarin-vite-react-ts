/**
 * LearnLayout stories
 *
 * Visual stories for the Learn section inline pill tabs layout.
 * Covers all four phases with different tab lock states,
 * and a mobile viewport variant.
 *
 * Inline pill tabs render inside the content area (not a full-width bar).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";

// ──────────────────────────────────────────────
// Inline Pill Tabs Preview
//
// Changes from previous:
// 1. Pills are inline within the content area (no separate nav bar)
// 2. Active pill: primary bg + amber border + pill radius (20px)
// 3. Inactive pill: transparent, tertiary text
// 4. Locked: 0.5 opacity, muted text, 🔒 icon
// 5. Horizontal scroll on overflow
// ──────────────────────────────────────────────

type LearnPillsPreviewProps = {
  currentPhase: number;
  activeTabId: string;
};

const ALL_TABS = [
  { id: "foundations", label: "Foundations", icon: "🔤", requiredPhase: 1 },
  { id: "radicals", label: "Radicals", icon: "📘", requiredPhase: 2 },
  { id: "grammar", label: "Grammar", icon: "📕", requiredPhase: 2 },
  { id: "phonetic", label: "Phonetic", icon: "🔊", requiredPhase: 3 },
  { id: "readers", label: "Readers", icon: "📖", requiredPhase: 3 },
  { id: "chengyu", label: "Chengyu", icon: "🏮", requiredPhase: 4 },
] as const;

function LearnPillsPreview({
  currentPhase = 1,
  activeTabId = "foundations",
}: LearnPillsPreviewProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        background: "var(--surface-dark-alt)",
        minHeight: "400px",
      }}
    >
      {/* Inline pill tabs at top of content */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-xs)",
          overflowX: "auto",
          flexShrink: 0,
        }}
        className="p-md"
        role="tablist"
        aria-label="Learn section tabs"
      >
        {ALL_TABS.map((tab) => {
          const isLocked = tab.requiredPhase > currentPhase;
          const isActive = tab.id === activeTabId;

          return (
            <a
              key={tab.id}
              href={isLocked ? undefined : `/learn/${tab.id}`}
              onClick={(e) => e.preventDefault()}
              role="tab"
              aria-selected={isActive}
              aria-disabled={isLocked || undefined}
              className={`p-xs ${isLocked ? "op-60" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                border: "none",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                color: isActive
                  ? "var(--color-primary)"
                  : isLocked
                    ? "var(--text-muted)"
                    : "var(--text-tertiary)",
                fontWeight: isActive ? 600 : 400,
                fontSize: "var(--font-sm)",
                background: isActive ? "var(--color-primary-bg)" : "transparent",
                cursor: isLocked ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              title={isLocked ? `Complete Phase ${tab.requiredPhase} to unlock` : tab.label}
            >
              <span aria-hidden="true" style={{ fontSize: "var(--font-md)" }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {isLocked && (
                <span aria-label="locked" style={{ fontSize: "var(--font-xs)", marginLeft: "1px" }}>
                  🔒
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Content area */}
      <div
        className="p-xl"
        style={{
          flex: 1,
          color: "var(--text-secondary)",
        }}
      >
        {ALL_TABS.find((t) => t.id === activeTabId)?.label || "Unknown"} content placeholder
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Meta
// ──────────────────────────────────────────────

const meta: Meta<typeof LearnPillsPreview> = {
  title: "Layouts/LearnLayout",
  component: LearnPillsPreview,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "**Inline Pill Tabs** — Phase-gated pill tabs rendered inside the content area. Active pill uses primary bg with radius-md, matching the FoundationsPage tab variant style.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LearnPillsPreview>;

export const Phase1: Story = {
  args: { currentPhase: 1, activeTabId: "foundations" },
};

export const Phase2Radicals: Story = {
  args: { currentPhase: 2, activeTabId: "radicals" },
};

export const Phase3: Story = {
  args: { currentPhase: 3, activeTabId: "readers" },
};

export const Phase4: Story = {
  args: { currentPhase: 4, activeTabId: "chengyu" },
};

/**
 * Guest mode — all tabs unlocked.
 * Guest users see effectivePhase = 4 (all tabs accessible).
 */
export const GuestMode: Story = {
  args: { currentPhase: 4, activeTabId: "foundations" },
  name: "Guest mode — all tabs unlocked",
};

export const Mobile: Story = {
  args: { currentPhase: 2, activeTabId: "radicals" },
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
};
