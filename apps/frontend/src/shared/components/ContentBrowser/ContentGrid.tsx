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
 * - Loading and empty states
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
 * />
 * ```
 */

import { ContentCard } from "./ContentCard";
import type { ContentItem } from "./types";

export { ContentGrid };

function ContentGrid({
  items,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onItemClick,
  isLoading = false,
}: {
  items: ContentItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onItemClick?: (item: ContentItem) => void;
  isLoading?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) {
    return (
      <div className="content-grid__loading" role="status" aria-label="Loading content">
        <div className="content-grid__spinner" />
        <p>Loading content...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="content-grid__empty" role="status">
        <p>No content found. Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="content-grid">
      <div className="content-grid__results-info">
        <span>
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </span>
      </div>

      <div className="content-grid__grid">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} onClick={onItemClick} />
        ))}
      </div>

      <div className="content-grid__pagination">
        <button
          type="button"
          className="content-grid__page-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          ← Prev
        </button>

        <span className="content-grid__page-info">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          className="content-grid__page-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next →
        </button>

        {onPageSizeChange && (
          <div className="content-grid__page-size">
            <label htmlFor="page-size-select" className="content-grid__page-size-label">
              Per page:
            </label>
            <select
              id="page-size-select"
              className="content-grid__page-size-select"
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
