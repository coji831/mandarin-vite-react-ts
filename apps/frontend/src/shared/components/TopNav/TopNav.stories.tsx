/**
 * TopNav Component — Storybook stories
 *
 * Uses an inline preview component that renders `<a>` tags instead of
 * `<NavLink>` (since Storybook has no router). The actual `TopNav`
 * component uses react-router-dom `<NavLink>` internally.
 *
 * Covers: default, active middle, locked items, guest mode, mobile.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

// ──────────────────────────────────────────────
// Inline TopNav Preview
// ──────────────────────────────────────────────

type TopNavPreviewItem = {
  id: string;
  label: string;
  icon?: string;
  path: string;
  isLocked?: boolean;
};

type TopNavPreviewProps = {
  items: TopNavPreviewItem[];
  activeId: string;
  phaseGate?: number;
  requiredPhase?: (id: string) => number;
  "aria-label"?: string;
  align?: "start" | "center" | "end";
};

const SAMPLE_ITEMS: TopNavPreviewItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊", path: "/dashboard" },
  { id: "learn", label: "Learn", icon: "📚", path: "/learn" },
  { id: "review", label: "Review", icon: "🔄", path: "/review" },
  { id: "practice", label: "Practice", icon: "✍️", path: "/practice" },
  { id: "dictionary", label: "Dictionary", icon: "📖", path: "/dictionary" },
];

/**
 * Maps an item id to the phase required to unlock it.
 * Dashboard/Learn = phase 1, Review = phase 2, Practice = phase 3, Dictionary = phase 4
 */
function getRequiredPhase(id: string): number {
  const phaseMap: Record<string, number> = {
    dashboard: 1,
    learn: 1,
    review: 2,
    practice: 3,
    dictionary: 4,
  };
  return phaseMap[id] ?? 1;
}

function TopNavPreview({
  items,
  activeId,
  phaseGate = Infinity,
  requiredPhase,
  "aria-label": ariaLabel = "Main navigation",
  align = "start",
}: TopNavPreviewProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        background: "var(--surface-dark)",
        minHeight: "200px",
      }}
    >
      <nav
        role="navigation"
        aria-label={ariaLabel}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            align === "center" ? "center" : align === "end" ? "flex-end" : "flex-start",
          gap: "var(--space-xs)",
          padding: "var(--space-xs)",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {items.map((item) => {
          const required = requiredPhase?.(item.id) ?? 1;
          const isLocked = item.isLocked ?? required > phaseGate;
          const isActive = item.id === activeId;

          return (
            <a
              key={item.id}
              href={isLocked ? undefined : item.path}
              onClick={(e) => e.preventDefault()}
              aria-disabled={isLocked || undefined}
              title={isLocked ? `Complete Phase ${required} to unlock` : item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "var(--space-xs)",
                textDecoration: "none",
                fontSize: "var(--font-sm)",
                whiteSpace: "nowrap",
                color: isActive && !isLocked ? "var(--color-primary-lighter)" : "var(--text-muted)",
                borderBottom:
                  isActive && !isLocked
                    ? "2px solid var(--color-primary)"
                    : "2px solid transparent",
                cursor: isLocked ? "not-allowed" : "pointer",
                opacity: isLocked ? 0.4 : 1,
                transition: "all 0.15s ease",
              }}
            >
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              <span>{item.label}</span>
              {isLocked && (
                <span className="font-xs" aria-label="locked">
                  🔒
                </span>
              )}
            </a>
          );
        })}
      </nav>
    </div>
  );
}

// ──────────────────────────────────────────────
// Meta
// ──────────────────────────────────────────────

const meta: Meta<typeof TopNavPreview> = {
  title: "Shared/TopNav",
  component: TopNavPreview,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "**TopNav** — Compact top-level navigation bar using `<NavLink>` with `font-sm` and underline active indicator. For content switching within a page, use `<Tabs>`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TopNavPreview>;

// ──────────────────────────────────────────────
// Stories
// ──────────────────────────────────────────────

export const Default: Story = {
  name: "Default — Phase 1, Dashboard Active",
  args: {
    items: SAMPLE_ITEMS,
    activeId: "dashboard",
    phaseGate: 1,
    requiredPhase: getRequiredPhase,
  },
};

export const ActiveMiddle: Story = {
  name: "Active Middle — Phase 2, Review Active",
  args: {
    items: SAMPLE_ITEMS,
    activeId: "review",
    phaseGate: 2,
    requiredPhase: getRequiredPhase,
  },
};

export const WithLocked: Story = {
  name: "With Locked — Phase 1, Some Locked",
  args: {
    items: SAMPLE_ITEMS,
    activeId: "learn",
    phaseGate: 1,
    requiredPhase: getRequiredPhase,
  },
};

export const GuestMode: Story = {
  name: "Guest Mode — Phase 4, All Unlocked",
  args: {
    items: SAMPLE_ITEMS,
    activeId: "learn",
    phaseGate: 4,
    requiredPhase: getRequiredPhase,
  },
};

export const Mobile: Story = {
  name: "Mobile — Narrow Viewport",
  args: {
    items: SAMPLE_ITEMS,
    activeId: "dashboard",
    phaseGate: 1,
    requiredPhase: getRequiredPhase,
  },
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
};

export const AlignCenter: Story = {
  name: "Align Center — Centered Nav Items",
  args: {
    items: SAMPLE_ITEMS,
    activeId: "learn",
    phaseGate: 2,
    requiredPhase: getRequiredPhase,
    align: "center",
  },
};
