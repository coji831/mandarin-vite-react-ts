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
import "./CharacterSearchBar.css";

export interface CharacterSearchBarProps {
  onCharacterSelect: (character: string) => void;
}

export function CharacterSearchBar({ onCharacterSelect }: CharacterSearchBarProps) {
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

  return (
    <section className="flex-col">
      <h3 className="stroke-anim-heading font-sm text-secondary fw-600">Stroke Animations</h3>
      <p className="stroke-anim-subtitle font-xs text-muted">
        Type any character to see its stroke order
      </p>
      <div className="stroke-anim-search bg-surface-dark-alt border-default radius-md flex-center">
        <span className="stroke-anim-search-icon font-sm shrink-0">🔍</span>
        <input
          className="stroke-anim-input grow-1 font-sm border-none text-primary"
          type="text"
          placeholder="Type a character..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={1}
          aria-label="Search character"
        />
        <button
          className="stroke-anim-search-btn font-xs cursor-pointer shrink-0 border-none radius-sm"
          onClick={handleSearch}
          disabled={!searchInput.trim()}
          aria-label="Search"
        >
          Search
        </button>
      </div>
    </section>
  );
}
