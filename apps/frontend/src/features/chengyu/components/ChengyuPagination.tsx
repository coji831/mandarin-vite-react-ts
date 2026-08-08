/**
 * @file components/ChengyuPagination.tsx
 * @description Pagination footer for the Chengyu idiom list — the
 * "Showing A–B of total" results summary plus the prev/next pager ("Page X of
 * N"). Rendered by `ChengyuPage` OUTSIDE the scrolling list region (a flex
 * sibling of `chengyu-page__list-wrapper`), so it stays visible while idiom
 * cards scroll. Pure presentational shell — no hooks/API.
 * Story 23.3: Chengyu UI
 *
 * Mirrors the shared `Grid` / `ContentGrid` pagination controls (Button
 * variant secondary + the same aria-labels). BUG-1 fix: surfaces
 * `total`/`totalPages` so all idioms are reachable by browsing.
 */
import { Button } from "shared/components";
import "./ChengyuPagination.css";

export interface ChengyuPaginationProps {
  /** Current 1-based page (1 = first). */
  page: number;
  /** Total matching idioms across all pages. */
  total: number;
  /** Total pages for the current page size. */
  totalPages: number;
  /** Items per page (used for the "Showing A–B of total" summary). */
  pageSize: number;
  /** Navigate to a page (prev/next compute from `page` / `totalPages`). */
  onPageChange: (page: number) => void;
}

export function ChengyuPagination({
  page,
  total,
  totalPages,
  pageSize,
  onPageChange,
}: ChengyuPaginationProps) {
  return (
    <div className="chengyu-pagination" role="region" aria-label="Chengyu list pagination">
      <div className="chengyu-pagination__results-info font-sm text-muted">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </div>

      <div className="chengyu-pagination__controls flex-center gap-sm">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          ← Prev
        </Button>

        <span className="chengyu-pagination__page-info font-sm text-secondary">
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
      </div>
    </div>
  );
}
