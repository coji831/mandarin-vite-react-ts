/**
 * ContentBrowser Component
 *
 * Main composition component providing a unified mixed-card grid with
 * type badges, search bar, filter dropdowns, and tab-based filtering.
 * Story 17.7: Content Browser Infrastructure.
 *
 * Features:
 * - Tab-based content type filtering
 * - Debounced search across Chinese/pinyin/english
 * - HSK level and phase filter dropdowns
 * - Paginated responsive card grid
 * - URL search param persistence for shareable state
 * - Loading and error states
 *
 * Usage:
 * ```tsx
 * <ContentBrowser contentSource={myContentSource} />
 * ```
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CONTENT_TABS } from "./types";
import type { ContentItem, ContentSource, ContentType } from "./types";
import { TabBar } from "./TabBar";
import { SearchBar } from "./SearchBar";
import { FilterDropdown } from "./FilterDropdown";
import { ContentGrid } from "./ContentGrid";
import "./ContentBrowser.css";

export { ContentBrowser };

function ContentBrowser({
  contentSource,
  defaultTab = "all",
  userPhase = 1,
}: {
  contentSource: ContentSource;
  defaultTab?: string;
  userPhase?: number;
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive initial state from URL params
  const initialTab = searchParams.get("tab") ?? defaultTab;
  const initialQuery = searchParams.get("q") ?? "";
  const initialHsk = searchParams.get("hsk") ? Number(searchParams.get("hsk")) : undefined;
  const initialPhase = searchParams.get("phase") ? Number(searchParams.get("phase")) : undefined;
  const initialPage = searchParams.get("page") ? Number(searchParams.get("page")) : 1;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [hskLevel, setHskLevel] = useState<number | undefined>(initialHsk);
  const [phase, setPhase] = useState<number | undefined>(initialPhase);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phase-gated tab visibility (wireframe Section 1.4)
  const visibleTabs = useMemo(() => {
    const phaseAccess: Record<string, number> = {
      foundations: 1,
      radical: 2,
      grammar: 2,
      phonetic: 3,
      reader: 3,
      chengyu: 4,
    };

    return CONTENT_TABS.map((tab) => {
      if (tab.id === "all") return { ...tab, isLocked: false };
      const requiredPhase = phaseAccess[tab.id];
      return {
        ...tab,
        isLocked: requiredPhase ? userPhase < requiredPhase : false,
      };
    });
  }, [userPhase]);

  // Sync state to URL params
  const syncUrlParams = useCallback(
    (params: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === "" || value === "all") {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      }
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    syncUrlParams({ tab: tab === defaultTab ? undefined : tab, page: undefined });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    syncUrlParams({ q: query || undefined, page: undefined });
  };

  const handleHskLevelChange = (level: number | undefined) => {
    setHskLevel(level);
    setPage(1);
    syncUrlParams({ hsk: level?.toString(), page: undefined });
  };

  const handlePhaseChange = (p: number | undefined) => {
    setPhase(p);
    setPage(1);
    syncUrlParams({ phase: p?.toString(), page: undefined });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    syncUrlParams({ page: newPage > 1 ? newPage.toString() : undefined });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  // Determine the content type filter based on active tab
  const contentTypeFilter = useMemo(() => {
    if (activeTab === "all") return undefined;
    return activeTab as ContentType;
  }, [activeTab]);

  // Load data when filters change
  useEffect(() => {
    let cancelled = false;

    const loadItems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await contentSource.getItems({
          contentType: contentTypeFilter,
          searchQuery: searchQuery || undefined,
          hskLevel,
          phase,
          page,
          pageSize,
        });

        if (!cancelled) {
          setItems(result.items);
          setTotal(result.total);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load content");
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadItems();

    return () => {
      cancelled = true;
    };
  }, [contentSource, contentTypeFilter, searchQuery, hskLevel, phase, page, pageSize]);

  if (error) {
    return (
      <div className="content-browser" role="alert">
        <div className="content-browser__error">
          <p>Error: {error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-browser">
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} tabs={visibleTabs} />

      <div className="content-browser__toolbar">
        <div className="content-browser__search-filter">
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by Chinese, pinyin, or English..."
          />
          <FilterDropdown
            selectedHskLevel={hskLevel}
            onHskLevelChange={handleHskLevelChange}
            selectedPhase={phase}
            onPhaseChange={handlePhaseChange}
          />
        </div>
      </div>

      <ContentGrid
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onItemClick={() => {}}
        isLoading={isLoading}
      />
    </div>
  );
}
