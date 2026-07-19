/**
 * SearchInput Component — Generic debounced search input
 *
 * A controlled text input with search icon styling.
 * No business domain dependencies.
 */
import { Box } from "shared/components";
import "./SearchInput.css";

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
  return (
    <Box
      variant="item"
      padding="xs"
      className="search-input transition-border-color flex-center gap-xs bg-transparent focus-within:border-primary"
    >
      <span className="font-sm shrink-0" aria-hidden="true">
        🔍
      </span>
      <input
        className="search-input__field text-secondary font-sm w-full border-none bg-transparent outline-none"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
    </Box>
  );
}
