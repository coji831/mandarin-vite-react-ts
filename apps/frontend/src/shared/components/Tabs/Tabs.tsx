/**
 * Tabs Component — Tab bar with optional panel wrapper
 *
 * Renders a row of tabs using shared Button tab variants (`tab`/`tab-active`).
 * Optionally wraps the active tab's content in a `role="tabpanel"` container.
 * Supports locked (disabled) tabs with phase-gate tooltip info.
 * No business domain dependencies.
 */
import { Button, Icon } from "shared/components";
import { isIconName } from "shared/components";
import "./Tabs.css";

export type TabConfig = {
  id: string;
  label: string;
  icon?: string;
};

export type TabsVariant = "default" | "underline";

export type TabsProps = {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  /** Optional panel content rendered below the tab bar */
  children?: React.ReactNode;
  /** Array of locked tab ids */
  lockedTabs?: string[];
  /** Maps a tab id to the phase required to unlock it (for tooltip) */
  getLockPhase?: (id: string) => number | null;
  /** Alignment of tab items in the bar */
  align?: "start" | "center" | "end";
  /** Visual variant: default (filled active) or underline (amber underline) */
  variant?: TabsVariant;
};

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  children,
  lockedTabs,
  getLockPhase,
  align = "start",
  variant = "default",
}: TabsProps) {
  const containerClass = [
    "tabs-container",
    variant === "underline" ? "tabs-container--underline" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass}>
      <div
        className="tabs-tab-bar gap-xs p-xs"
        style={{
          justifyContent:
            align === "center" ? "center" : align === "end" ? "flex-end" : "flex-start",
        }}
        role="tablist"
        aria-label="Content tabs"
      >
        {tabs.map((tab) => {
          const isLocked = lockedTabs?.includes(tab.id) ?? false;
          const isActive = tab.id === activeTab;
          const lockPhase = isLocked ? (getLockPhase?.(tab.id) ?? null) : null;

          return (
            <Button
              key={tab.id}
              variant={isActive ? "tab-active" : "tab"}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={children ? `panel-${tab.id}` : undefined}
              disabled={isLocked}
              onClick={() => !isLocked && onTabChange(tab.id)}
              className={`tabs__tab ${isLocked ? "op-40" : ""}`}
              title={lockPhase ? `Complete Phase ${lockPhase} to unlock` : undefined}
            >
              {tab.icon && (
                <span className="tabs__tab-icon" aria-hidden="true">
                  {isIconName(tab.icon) ? <Icon name={tab.icon} size={16} /> : tab.icon}
                </span>
              )}
              <span className="tabs__tab-label">{tab.label}</span>
              {isLocked && <Icon name="lock" size={16} label="locked" />}
            </Button>
          );
        })}
      </div>
      {children && (
        <div
          className="tabs-panel p-md"
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          // Scrollable region (overflow-y:auto) must be keyboard-focusable (axe
          // scrollable-region-focusable). Tab panels are scroll containers.
          tabIndex={0}
        >
          {children}
        </div>
      )}
    </div>
  );
}
