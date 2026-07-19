/**
 * @file components/CharacterSearchBar.tsx
 * @description Search input for hanzi character lookup
 * Story 18.4: Stroke Order Reference & Animations
 *
 * Controlled component pattern — manages its own input state,
 * emits character selection via onCharacterSelect callback.
 * The parent page owns the selected character state.
 */

import { useState } from "react";
import { isValidHanzi } from "features/foundations";
import { Box, Button, Input } from "shared/components";

export interface CharacterSearchBarProps {
  onCharacterSelect: (character: string) => void;
  compact?: boolean;
}

export function CharacterSearchBar({
  onCharacterSelect,
  compact = false,
}: CharacterSearchBarProps) {
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = () => {
    const trimmed = searchInput.trim();
    if (trimmed && isValidHanzi(trimmed)) {
      onCharacterSelect(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const containerClassName = compact
    ? "flex-center gap-xs grow-1"
    : "stroke-anim-search flex-center gap-xs";

  return compact ? (
    <div className={containerClassName}>
      <Input
        className="grow-1"
        type="text"
        placeholder="Type a character..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Search character"
        maxLength={1}
      />
      <Button
        variant="primary"
        size="sm"
        onClick={handleSearch}
        disabled={!searchInput.trim()}
        aria-label="Search"
      >
        Search
      </Button>
    </div>
  ) : (
    <Box variant="dark-alt" padding="xs" className={containerClassName}>
      <Input
        className="grow-1"
        type="text"
        placeholder="Type a character..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Search character"
        maxLength={1}
      />
      <Button
        variant="primary"
        size="sm"
        onClick={handleSearch}
        disabled={!searchInput.trim()}
        aria-label="Search"
      >
        Search
      </Button>
    </Box>
  );
}
