/**
 * Grid Component — Generic paginated grid
 *
 * Renders items in a responsive CSS grid with pagination controls.
 * Renders nothing about the items — delegates rendering to `renderItem`.
 * No business domain dependencies.
 */
import { Button, Spinner } from "shared/components";
import "./Grid.css";

export type GridProps<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  isLoading?: boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

export function Grid<T>({
  items,
  total,
  page,
  pageSize,
  isLoading = false,
  renderItem,
  onPageChange,
  onPageSizeChange,
}: GridProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) {
    return (
      <div
        className="grid__loading flex-col-center text-muted gap-sm p-2xl"
        role="status"
        aria-label="Loading content"
      >
        <Spinner size="md" />
        <p>Loading...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="grid__empty flex-col-center text-muted p-2xl" role="status">
        <p>No items found.</p>
      </div>
    );
  }

  return (
    <div className="grid flex-col gap-md">
      <div className="grid__results-info font-sm text-muted">
        <span>
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </span>
      </div>

      <div className="grid__grid gap-md">{items.map((item, i) => renderItem(item, i))}</div>

      <div className="grid__pagination flex-center gap-sm flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="grid__page-btn bg-surface-dark-alt-2"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Prev
        </Button>

        <span className="grid__page-info font-sm text-tertiary">
          Page {page} of {totalPages}
        </span>

        <Button
          variant="ghost"
          size="sm"
          className="grid__page-btn bg-surface-dark-alt-2"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next →
        </Button>

        {onPageSizeChange && (
          <div className="flex-center gap-xs">
            <label htmlFor="grid-page-size" className="grid__page-size-label font-xs text-muted">
              Per page:
            </label>
            <select
              id="grid-page-size"
              className="text-secondary font-xs bg-surface-dark-alt-2"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Items per page"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
