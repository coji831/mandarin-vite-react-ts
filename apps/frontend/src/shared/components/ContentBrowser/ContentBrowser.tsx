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
import { Box, Button, Chip, Dropdown, Icon } from "shared/components";
import { CONTENT_TABS } from "./types";
import type { ContentItem, ContentSource, ContentType } from "./types";
import { TabBar } from "./TabBar";
import { SearchBar } from "./SearchBar";
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

  // Determine whether any filter is active
  const hasActiveFilters = hskLevel !== undefined || phase !== undefined || searchQuery !== "";
  const activeFilterCount = [
    hskLevel !== undefined,
    phase !== undefined,
    searchQuery !== "",
  ].filter(Boolean).length;

  const handleClearAllFilters = useCallback(() => {
    setHskLevel(undefined);
    setPhase(undefined);
    setSearchQuery("");
    setPage(1);
    syncUrlParams({ hsk: undefined, phase: undefined, q: undefined, page: undefined });
  }, [syncUrlParams]);

  const handleTabSuggestion = useCallback(
    (tab: ContentType) => {
      handleTabChange(tab);
    },
    [handleTabChange],
  );

  if (error) {
    return (
      <div
        className="content-browser mx-auto p-lg flex flex-col gap-lg text-secondary"
        role="alert"
      >
        <Box
          variant="error"
          padding="xl"
          className="content-browser__error text-center bg-surface-dark-alt radius-md flex-col gap-md"
        >
          <p className="text-error font-md">Error: {error}</p>
          <div>
            <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </Box>
      </div>
    );
  }

  return (
    <div className="content-browser mx-auto p-lg flex flex-col gap-lg text-secondary">
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} tabs={visibleTabs} />

      <Box variant="dark" padding="md" className="content-browser__toolbar flex flex-wrap gap-sm">
        {/* Search */}
        <div className="content-browser__toolbar-group flex-col">
          <label
            htmlFor="library-search"
            className="font-xs text-secondary text-uppercase tracking-wide"
          >
            Search
          </label>
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Chinese, pinyin, or English..."
          />
        </div>

        {/* HSK Level dropdown */}
        <div className="content-browser__toolbar-group flex-col gap-xs">
          <Dropdown<number | null>
            value={hskLevel ?? null}
            onChange={(val) => handleHskLevelChange(val === null ? undefined : val)}
            options={[
              { value: null, label: "All" },
              { value: 1, label: "HSK 1" },
              { value: 2, label: "HSK 2" },
              { value: 3, label: "HSK 3" },
              { value: 4, label: "HSK 4" },
              { value: 5, label: "HSK 5" },
              { value: 6, label: "HSK 6" },
            ]}
            label="HSK Level"
            id="hsk-level-select"
            ariaLabel="HSK Level filter"
          />
        </div>

        {/* Phase dropdown */}
        <div className="content-browser__toolbar-group flex-col gap-xs">
          <Dropdown<number | null>
            value={phase ?? null}
            onChange={(val) => handlePhaseChange(val === null ? undefined : val)}
            options={[
              { value: null, label: "All" },
              { value: 1, label: "Phase 1" },
              { value: 2, label: "Phase 2" },
              { value: 3, label: "Phase 3" },
              { value: 4, label: "Phase 4" },
            ]}
            label="Phase"
            id="phase-select"
            ariaLabel="Phase filter"
          />
        </div>

        {/* Clear button */}
        <div className="content-browser__toolbar-group flex-col">
          <span className="font-xs text-secondary text-uppercase tracking-wide">&nbsp;</span>
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasActiveFilters}
            onClick={handleClearAllFilters}
            aria-label="Clear all filters"
          >
            {activeFilterCount > 0 && (
              <Chip interactive={false} variant="primary" size="sm" count={activeFilterCount} />
            )}
            <Icon name="cross" size={16} aria-hidden />
            Clear all
          </Button>
        </div>
      </Box>

      <ContentGrid
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onItemClick={() => {}}
        isLoading={isLoading}
        onClearFilters={handleClearAllFilters}
        onTabSuggestion={handleTabSuggestion}
      />
    </div>
  );
}
