/**
 * ContentGrid Component
 *
 * Responsive CSS grid (auto-fill, min 280px) that renders ContentCards.
 * Story 17.7: Content Browser Infrastructure.
 *
 * Features:
 * - Responsive auto-fill grid layout
 * - Pagination controls (Prev/Next + Page X of Y)
 * - Page size selector (10/20/50)
 * - Loading and empty states with clear filters action
 *
 * Usage:
 * ```tsx
 * <ContentGrid
 *   items={items}
 *   total={total}
 *   page={page}
 *   pageSize={pageSize}
 *   onPageChange={setPage}
 *   onPageSizeChange={setPageSize}
 *   onItemClick={handleItemClick}
 *   isLoading={isLoading}
 *   onClearFilters={() => {}}
 *   onTabSuggestion={(tab) => {}}
 * />
 * ```
 */

import { ContentCard } from "./ContentCard";
import { Box, Button, EmptyState, Icon, LoadingScreen } from "shared/components";
import type { IconName } from "shared/components";
import type { ContentItem, ContentType } from "./types";
import { CONTENT_TABS } from "./types";
import "./ContentBrowser.css";

export { ContentGrid };

const CATEGORY_SUGGESTIONS: { id: ContentType; label: string; icon: IconName }[] = [
  { id: "foundations", label: "Foundations", icon: "letters" },
  { id: "radical", label: "Radicals", icon: "radicals" },
  { id: "phonetic", label: "Phonetic", icon: "audio" },
  { id: "reader", label: "Readers", icon: "book" },
  { id: "grammar", label: "Grammar", icon: "grammar" },
  { id: "chengyu", label: "Chengyu", icon: "chengyu" },
];

function ContentGrid({
  items,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onItemClick,
  isLoading = false,
  onClearFilters,
  onTabSuggestion,
}: {
  items: ContentItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onItemClick?: (item: ContentItem) => void;
  isLoading?: boolean;
  onClearFilters?: () => void;
  onTabSuggestion?: (tab: ContentType) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) {
    return <LoadingScreen message="Loading content..." />;
  }

  if (items.length === 0) {
    return (
      <Box variant="dashed" padding="2xl" className="content-grid__empty" role="status">
        <EmptyState
          icon="search-x"
          title="No content found"
          description="Try adjusting your search or filters to discover more content."
          action={
            <div className="flex-col-center gap-md">
              {onClearFilters && (
                <Button variant="secondary" size="sm" onClick={onClearFilters}>
                  Clear all filters
                </Button>
              )}

              {onTabSuggestion && (
                <div className="content-grid__category-suggestions flex-center flex-wrap gap-sm">
                  {CATEGORY_SUGGESTIONS.map((cat) => {
                    const tabDef = CONTENT_TABS.find((t) => t.id === cat.id);
                    return (
                      <Button
                        key={cat.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => onTabSuggestion(cat.id)}
                        title={`Browse ${tabDef?.label ?? cat.label}`}
                      >
                        <Icon name={cat.icon} size={16} aria-hidden />
                        {cat.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          }
        />
      </Box>
    );
  }

  return (
    <div className="content-grid gap-md">
      <div className="content-grid__results-info font-sm text-muted">
        <span>
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </span>
      </div>

      <div className="content-grid__grid gap-md">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} onClick={onItemClick} />
        ))}
      </div>

      <div className="content-grid__pagination flex-center gap-sm p-md">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          ← Prev
        </Button>

        <span className="content-grid__page-info font-sm text-secondary">
          Page {page} of {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next →
        </Button>

        {onPageSizeChange && (
          <div className="content-grid__page-size flex-center gap-xs">
            <label
              htmlFor="page-size-select"
              className="content-grid__page-size-label font-xs text-muted"
            >
              Per page:
            </label>
            <select
              id="page-size-select"
              className="content-grid__page-size-select input-base p-xs"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Items per page"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
