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
 *
 * Usage:
 * ```tsx
 * <TabBar activeTab={tab} onTabChange={setTab} tabs={CONTENT_TABS} />
 * ```
 */

import { useSearchParams } from "react-router-dom";
import { CONTENT_TABS } from "./types";
import type { TabDefinition } from "./types";

export { TabBar };

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
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          type="button"
          className={`tab-bar__tab ${activeTab === tab.id ? "tab-bar__tab--active" : ""}`}
          aria-selected={activeTab === tab.id}
          onClick={() => handleTabClick(tab.id)}
        >
          <span aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
