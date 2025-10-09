/**
 * VocabularyListPage.tsx
 * Purpose: Interactive, filterable, and responsive vocabulary list selection page.
 * Features:
 *   - Card-based layout for vocabulary lists
 *   - Metadata display, search/filter UI, progress indicator, accessibility, responsive design
 *   - Uses helper functions from utils/vocabListUtils for filtering and tag/difficulty extraction
 *   - Progress calculation via context API (calculateListProgress)
 *   - Navigation via React Router
 * Related: Epic 5 (Vocabulary List UI Enhancement), Stories 5.1–5.4
 * Last updated: 2025-10-09
 *
 * Uses MandarinContext for state and navigation.
 * Loads vocabulary list metadata from /data/vocabulary/vocabularyLists.json
 * Converts between VocabWord format from CSV files and internal Word format for context state.
 * Loads and displays sample words from each available vocabulary list.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FilterChip, VocabularyCard } from "../components";
import { useMandarinContext } from "../hooks";
import type { VocabularyList } from "../types";
import {
  extractDistinctDifficulties,
  extractDistinctTags,
  getFilteredVocabularyLists,
} from "../utils";

export function VocabularyListPage() {
  const { calculateListProgress } = useMandarinContext();

  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await fetch("/data/vocabulary/vocabularyLists.json");
        if (!res.ok) throw new Error("Failed to fetch vocabulary lists");
        const data: VocabularyList[] = await res.json();
        setLists(data);
      } catch (error) {
        console.warn(error);
      }
    };
    void fetchLists();
  }, []);

  // Collect all unique tags and difficulties for filter UI
  const allTags = useMemo(extractDistinctTags(lists), [lists]);
  const allDifficulties = useMemo(extractDistinctDifficulties(lists), [lists]);

  // Filtering logic
  const filteredLists = useMemo(
    getFilteredVocabularyLists(lists, search, selectedDifficulties, selectedTags),
    [lists, search, selectedDifficulties, selectedTags]
  );

  // Handlers for filter chip selection
  const updateDifficultySelection = (difficulty: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty) ? prev.filter((x) => x !== difficulty) : [...prev, difficulty]
    );
  };
  const updateTagSelection = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]
    );

  // Clear all filters
  const clearAll = () => {
    setSearch("");
    setSelectedDifficulties([]);
    setSelectedTags([]);
  };

  return (
    <div>
      <div className="search-filter-bar">
        <input
          type="search"
          placeholder="Search vocabulary lists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-box"
          aria-label="Search vocabulary lists"
        />
        <div className="filter-group">
          <span className="filter-label">Difficulty:</span>
          {allDifficulties.map((d) => (
            <FilterChip
              key={d}
              label={d}
              selected={selectedDifficulties.includes(d)}
              onClick={() => updateDifficultySelection(d)}
            />
          ))}
        </div>
        <div className="filter-group">
          <span className="filter-label">Tags:</span>
          {allTags.map((t) => (
            <FilterChip
              key={t}
              label={t}
              selected={selectedTags.includes(t)}
              onClick={() => updateTagSelection(t)}
            />
          ))}
        </div>
        {(search || selectedDifficulties.length > 0 || selectedTags.length > 0) && (
          <button className="clear-all" onClick={clearAll} type="button">
            Clear All
          </button>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.5em",
        }}
      >
        {filteredLists.length === 0 ? (
          <div className="empty-state">
            <p>No lists found. Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredLists.map((list) => {
            // Calculate progress for this list using context state
            const { mastered, percent } = calculateListProgress(list.id, list.wordCount ?? 0);
            return (
              <VocabularyCard
                key={list.name}
                list={list}
                onSelect={() => navigate(`/mandarin/flashcards/${list.id}`)}
                progress={percent}
                masteredCount={mastered}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

// CSS for filter chips and search bar should be added to VocabularyCard.css or a new CSS file.
