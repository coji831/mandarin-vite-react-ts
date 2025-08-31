/**
 * VocabularyListSelector component
 *
 * - Allows user to select a vocabulary list and loads sample words for preview.
 * - Calls onSelect with the list name and words when a list is chosen.
 * - Handles localStorage tracking for new lists.
 * - Ensures wordId uniqueness in loaded words.
 */
import { useEffect, useState } from "react";
import { useMandarinContext } from "../context/useMandarinContext";
import type { VocabularyList, Word } from "../types";

function getSampleWords(words: Word[], count: number = 3): Word[] {
  return words.slice(0, count);
}

type VocabularyListSelectorProps = {
  onListSelected?: () => void;
};

function VocabularyListSelector({
  onListSelected,
}: VocabularyListSelectorProps) {
  const { selectVocabularyList } = useMandarinContext();
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [samples, setSamples] = useState<Record<string, Word[]>>({});
  // ...existing code...

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await fetch("/data/vocabularyLists.json");
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
          const res = await fetch(`/data/${list.file}`);
          if (!res.ok) throw new Error(`Failed to fetch ${list.file}`);
          const data: Word[] = await res.json();
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
      const res = await fetch(`/data/${list.file}`);
      if (!res.ok) throw new Error(`Failed to fetch ${list.file}`);
      const words: Word[] = await res.json();
      const uniqueWords: Word[] = Array.from(
        new Map(words.map((w) => [w.wordId, w])).values(),
      );
      selectVocabularyList(list.name, uniqueWords);
      if (onListSelected) onListSelected();
    } catch (error) {
      console.warn(error);
    }
  };

  // ...existing code...

  return (
    <div>
      {lists.map((list) => (
        <div
          key={list.name}
          style={{ border: "1px solid #ccc", margin: "1em 0", padding: "1em" }}
        >
          <h3>{list.name}</h3>
          <p>{list.description}</p>
          <div>
            <strong>Sample Words:</strong>
            <ul>
              {samples[list.name]?.map((word) => (
                <li key={word.wordId}>
                  {word.character && (
                    <span>
                      <strong>Character:</strong> {word.character}
                      <br />
                    </span>
                  )}
                  {word.pinyin && (
                    <span>
                      <strong>Pinyin:</strong> {word.pinyin}
                      <br />
                    </span>
                  )}
                  {word.meaning && (
                    <span>
                      <strong>Meaning:</strong> {word.meaning}
                      <br />
                    </span>
                  )}
                  {word.sentence && (
                    <span>
                      <em>{word.sentence}</em>
                      <br />
                    </span>
                  )}
                  {word.sentencePinyin && (
                    <span>
                      ({word.sentencePinyin})<br />
                    </span>
                  )}
                  {word.sentenceMeaning && (
                    <span>
                      {word.sentenceMeaning}
                      <br />
                    </span>
                  )}
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

export { VocabularyListSelector };
