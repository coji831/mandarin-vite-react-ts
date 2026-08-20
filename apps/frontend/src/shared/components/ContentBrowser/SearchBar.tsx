/**
 * SearchBar Component
 *
 * Debounced search input with 300ms delay for content filtering.
 * Story 17.7: Content Browser Infrastructure.
 *
 * Features:
 * - Immediate local input feedback for responsive typing
 * - Debounced onChange callback to reduce filter re-computation
 * - Loading spinner while debounce timer is active
 * - Search icon indicator
 * - Accessible with aria-label
 *
 * Usage:
 * ```tsx
 * <SearchBar value={query} onChange={setQuery} placeholder="Search..." />
 * ```
 */

import { useEffect, useRef, useState } from "react";
import { Icon, Spinner } from "shared/components";

export { SearchBar };

function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setIsDebouncing(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChange(newValue);
      setIsDebouncing(false);
    }, 300);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };

  return (
    <div className="search-bar__row">
      <span className="search-bar__icon op-60" aria-hidden="true">
        <Icon name="search" size={16} />
      </span>
      <input
        type="search"
        className="search-bar__input focus-ring"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {localValue && (
        <button
          className="search-bar__clear btn-base p-sm"
          onClick={handleClear}
          aria-label="Clear search"
          type="button"
        >
          <Icon name="cross" size={16} aria-hidden />
        </button>
      )}
      {isDebouncing && <Spinner size="xs" />}
    </div>
  );
}
