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

function getSampleWords<T>(words: T[], count: number = 3): T[] {
  return words.slice(0, count);
}
export function VocabularyListPage() {
  const { selectVocabularyList } = useMandarinContext();
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [samples, setSamples] = useState<Record<string, VocabWord[]>>({});
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

  useEffect(() => {
    const fetchSamples = async () => {
      for (const list of lists) {
        try {
          const data: VocabWord[] = await loadCsvVocab(`/data/vocabulary/${list.file}`);
          setSamples((prev) => ({
            ...prev,
            [list.name]: getSampleWords(data, 3),
          }));
        } catch (error) {
          console.warn(error);
        }
      }
    };
    if (lists.length > 0) void fetchSamples();
  }, [lists]);

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
    <div>
      {lists.map((list) => (
        <div key={list.name} style={{ border: "1px solid #ccc", margin: "1em 0", padding: "1em" }}>
          <h3>{list.name}</h3>
          <p>{list.description}</p>
          <div>
            <strong>Sample Words:</strong>
            <ul>
              {samples[list.name]?.map((word, idx) => (
                <li key={word.No || idx}>
                  <span>
                    <strong>Character:</strong> {word.Chinese}
                    <br />
                  </span>
                  <span>
                    <strong>Pinyin:</strong> {word.Pinyin}
                    <br />
                  </span>
                  <span>
                    <strong>Meaning:</strong> {word.English}
                    <br />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <button type="button" onClick={() => void handleSelect(list)}>
            Select
          </button>
        </div>
      ))}
    </div>
  );
}
