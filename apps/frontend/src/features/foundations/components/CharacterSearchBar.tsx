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

export interface CharacterSearchBarProps {
  onCharacterSelect: (character: string) => void;
}

/**
 * Validate input is a single hanzi character (CJK Unified Ideographs range)
 */
function isValidHanzi(input: string): boolean {
  return /^[\u4e00-\u9fff\u3400-\u4dbf]$/.test(input);
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
    <section className="stroke-anim-section">
      <h3 className="stroke-anim-heading">Stroke Animations</h3>
      <p className="stroke-anim-subtitle">Type any character to see its stroke order</p>
      <div className="stroke-anim-search">
        <span className="stroke-anim-search-icon">🔍</span>
        <input
          className="stroke-anim-input"
          type="text"
          placeholder="Type a character..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={1}
          aria-label="Search character"
        />
        <button
          className="stroke-anim-search-btn"
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
