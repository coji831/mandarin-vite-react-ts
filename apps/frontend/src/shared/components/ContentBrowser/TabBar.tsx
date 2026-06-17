/**
 * TabBar Component
 *
 * Horizontal tab bar for filtering content by type.
 * Story 17.7: Content Browser Infrastructure.
 *
 * Features:
 * - Horizontal scrollable tabs for mobile
 * - Highlights the active tab
 * - Uses URL search params to preserve tab selection
 * - Falls back to props if no URL params available
 * - Locked tabs are dimmed and disabled with a lock icon
 *
 * Usage:
 * ```tsx
 * <TabBar activeTab={tab} onTabChange={setTab} tabs={visibleTabs} />
 * ```
 */

import { useSearchParams } from "react-router-dom";
import { CONTENT_TABS } from "./types";
import type { TabDefinition } from "./types";

export { TabBar };

const PHASE_ACCESS: Record<string, number> = {
  foundations: 1,
  radical: 2,
  grammar: 2,
  phonetic: 3,
  reader: 3,
  chengyu: 4,
};

function getLockPhase(tabId: string): number | null {
  return PHASE_ACCESS[tabId] ?? null;
}

function TabBar({
  activeTab,
  onTabChange,
  tabs = CONTENT_TABS,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs?: TabDefinition[];
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    const newParams = new URLSearchParams(searchParams);
    if (tabId === "all") {
      newParams.delete("tab");
    } else {
      newParams.set("tab", tabId);
    }
    setSearchParams(newParams, { replace: true });
  };

  return (
    <nav className="tab-bar" role="tablist" aria-label="Content type tabs">
      {tabs.map((tab) => {
        const lockPhase = tab.isLocked ? getLockPhase(tab.id) : null;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            className={`tab-bar__tab ${activeTab === tab.id ? "tab-bar__tab--active" : ""} ${tab.isLocked ? "tab-bar__tab--locked" : ""}`}
            aria-selected={activeTab === tab.id}
            disabled={tab.isLocked}
            onClick={() => !tab.isLocked && handleTabClick(tab.id)}
            title={lockPhase ? `Complete Phase ${lockPhase} to unlock` : undefined}
          >
            <span aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.isLocked && (
              <span className="tab-bar__lock-icon" aria-label="locked">
                🔒
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
