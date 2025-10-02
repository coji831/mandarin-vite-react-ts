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
import { useEffect, useState } from "react";
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
  // No longer need samples for card-based layout
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

  // Remove sample words fetching for card-based layout

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

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "1.5em",
      }}
    >
      {lists.map((list) => (
        <VocabularyCard key={list.name} list={list} onSelect={handleSelect} />
      ))}
    </div>
  );
}
