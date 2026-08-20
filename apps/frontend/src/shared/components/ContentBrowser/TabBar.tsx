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
import { Button, Icon } from "shared/components";
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
    <nav
      className="tab-bar p-xs border-2 border-surface"
      role="tablist"
      aria-label="Content type tabs"
    >
      {tabs.map((tab) => {
        const lockPhase = tab.isLocked ? getLockPhase(tab.id) : null;
        return (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "tab-active" : "tab"}
            size="sm"
            role="tab"
            aria-selected={activeTab === tab.id}
            disabled={tab.isLocked}
            onClick={() => !tab.isLocked && handleTabClick(tab.id)}
            title={lockPhase ? `Complete Phase ${lockPhase} to unlock` : undefined}
            className={`tab-bar__tab ${tab.isLocked ? "op-40" : ""}`}
          >
            <Icon name={tab.icon} size={16} aria-hidden />
            <span>{tab.label}</span>
            {tab.isLocked && <Icon name="lock" size={16} label="locked" />}
          </Button>
        );
      })}
    </nav>
  );
}
