/**
 * SearchBar Component
 *
 * Debounced search input with 300ms delay for content filtering.
 * Story 17.7: Content Browser Infrastructure.
 *
 * Features:
 * - Immediate local input feedback for responsive typing
 * - Debounced onChange callback to reduce filter re-computation
 * - Search icon indicator
 * - Accessible with aria-label
 *
 * Usage:
 * ```tsx
 * <SearchBar value={query} onChange={setQuery} placeholder="Search..." />
 * ```
 */

import { useEffect, useRef, useState } from "react";

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChange(newValue);
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

  return (
    <div className="search-bar">
      <span className="search-bar__icon" aria-hidden="true">
        🔍
      </span>
      <input
        type="search"
        className="search-bar__input"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
