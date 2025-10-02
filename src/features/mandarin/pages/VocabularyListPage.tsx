/**
 * VocabularyListPage
 * Dedicated subpage for selecting a vocabulary list and previewing sample words.
 * Uses MandarinContext for state and navigation.
 * Updated for story 4-3: Implements new routing, context usage, and navigation logic.
 *
 * Uses the CSV-based vocabulary system with csvLoader.ts utility for loading vocabulary data.
 * Converts between VocabWord format from CSV files and internal Word format for context state.
 * Loads and displays sample words from each available vocabulary list.
 */
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMandarinContext } from "../context/useMandarinContext";
import type { VocabularyList, Word } from "../types";
import { loadCsvVocab, VocabWord } from "../../../utils/csvLoader";
import { VocabularyCard } from "../components/VocabularyCard";
import "../components/VocabularyCard.css";

function getSampleWords<T>(words: T[], count: number = 3): T[] {
  return words.slice(0, count);
}
export function VocabularyListPage() {
  const { selectVocabularyList } = useMandarinContext();
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
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    lists.forEach((l) => l.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [lists]);
  const allDifficulties = useMemo(() => {
    const diffSet = new Set<string>();
    lists.forEach((l) => l.difficulty && diffSet.add(l.difficulty));
    return Array.from(diffSet).sort();
  }, [lists]);

  // Filtering logic
  const filteredLists = useMemo(() => {
    let filtered = lists;
    // Search (case-insensitive, accent-insensitive, partial match)
    if (search.trim()) {
      const norm = (s: string) =>
        s
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase();
      const s = norm(search);
      filtered = filtered.filter(
        (l) => norm(l.name).includes(s) || norm(l.description || "").includes(s)
      );
    }
    // Difficulty filter (OR logic)
    if (selectedDifficulties.length > 0) {
      filtered = filtered.filter(
        (l) => l.difficulty && selectedDifficulties.includes(l.difficulty)
      );
    }
    // Tag filter (OR logic)
    if (selectedTags.length > 0) {
      filtered = filtered.filter((l) => l.tags && l.tags.some((t) => selectedTags.includes(t)));
    }
    return filtered;
  }, [lists, search, selectedDifficulties, selectedTags]);

  const handleSelect = async (list: VocabularyList) => {
    try {
      const words: VocabWord[] = await loadCsvVocab(`/data/vocabulary/${list.file}`);
      // Convert VocabWord to Word type for selectVocabularyList
      const converted: Word[] = words.map((w, idx) => ({
        wordId: w.No || String(idx + 1),
        character: w.Chinese,
        pinyin: w.Pinyin,
        meaning: w.English,
      }));

      selectVocabularyList(list.name, converted);
      navigate("/mandarin/daily-commitment");
    } catch (error) {
      console.warn(error);
    }
  };

  // UI for filter chips
  const FilterChip = ({
    label,
    selected,
    onClick,
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      className={"filter-chip" + (selected ? " selected" : "")}
      onClick={onClick}
      aria-pressed={selected}
    >
      {label}
    </button>
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
              onClick={() =>
                setSelectedDifficulties((prev) =>
                  prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                )
              }
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
              onClick={() =>
                setSelectedTags((prev) =>
                  prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                )
              }
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
          filteredLists.map((list) => (
            <VocabularyCard key={list.name} list={list} onSelect={handleSelect} />
          ))
        )}
      </div>
    </div>
  );
}

// CSS for filter chips and search bar should be added to VocabularyCard.css or a new CSS file.
