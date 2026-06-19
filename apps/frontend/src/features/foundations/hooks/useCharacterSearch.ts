/**
 * @file useCharacterSearch.ts
 * @description Hook for character search input state management
 * Story 18.4: Stroke Order Reference & Animations
 */

import { useState, useCallback } from "react";

/**
 * Validate input is a single hanzi character (CJK Unified Ideographs range)
 */
export function isValidHanzi(input: string): boolean {
  return /^[\u4e00-\u9fff\u3400-\u4dbf]$/.test(input);
}

export interface UseCharacterSearchReturn {
  character: string;
  searchInput: string;
  setSearchInput: (value: string) => void;
  handleSearch: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSuggestedClick: (char: string) => void;
}

/**
 * Hook that manages character search input state.
 * Provides validation, search trigger, keyboard handler, and suggested character click.
 *
 * @param initialCharacter - The default character to show (default: "水")
 * @returns Search state and handlers
 */
export function useCharacterSearch(initialCharacter: string = "水"): UseCharacterSearchReturn {
  const [character, setCharacter] = useState<string>(initialCharacter);
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = useCallback(() => {
    const trimmed = searchInput.trim();
    if (trimmed && isValidHanzi(trimmed)) {
      setCharacter(trimmed);
    }
  }, [searchInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch],
  );

  const handleSuggestedClick = useCallback((char: string) => {
    setCharacter(char);
    setSearchInput("");
  }, []);

  return {
    character,
    searchInput,
    setSearchInput,
    handleSearch,
    handleKeyDown,
    handleSuggestedClick,
  };
}
