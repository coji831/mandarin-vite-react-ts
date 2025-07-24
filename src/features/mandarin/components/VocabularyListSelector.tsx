import React, { useState, useEffect } from "react";
import type { Word, VocabularyList } from "../types";

function getSampleWords(words: Word[], count: number = 3): Word[] {
  return words.slice(0, count);
}

type VocabularyListSelectorProps = {
  onSelect: (listName: string, words: Word[]) => void;
};

function VocabularyListSelector({ onSelect }: VocabularyListSelectorProps) {
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [samples, setSamples] = useState<Record<string, Word[]>>({});

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await fetch("/src/data/vocabularyLists.json");
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
          const res = await fetch(`/src/data/${list.file}`);
          if (!res.ok) throw new Error(`Failed to fetch ${list.file}`);
          const data: Word[] = await res.json();
          setSamples((prev) => ({ ...prev, [list.name]: getSampleWords(data, 3) }));
        } catch (error) {
          console.warn(error);
        }
      }
    };
    if (lists.length > 0) void fetchSamples();
  }, [lists]);

  const handleSelect = async (list: VocabularyList) => {
    try {
      const res = await fetch(`/src/data/${list.file}`);
      if (!res.ok) throw new Error(`Failed to fetch ${list.file}`);
      const words: Word[] = await res.json();
      // Ensure wordId is unique
      const uniqueWords: Word[] = Array.from(new Map(words.map((w) => [w.wordId, w])).values());
      // LocalStorage tracking
      const trackingKey = `tracking_${list.name}`;
      const tracking = localStorage.getItem(trackingKey);
      if (!tracking) {
        localStorage.setItem(
          trackingKey,
          JSON.stringify({ listName: list.name, sections: [], dailyWordCount: null })
        );
      }
      onSelect(list.name, uniqueWords);
    } catch (error) {
      console.warn(error);
    }
  };

  return (
    <div>
      <h2>Select a Vocabulary List</h2>
      {lists.map((list) => (
        <div key={list.name} style={{ border: "1px solid #ccc", margin: "1em 0", padding: "1em" }}>
          <h3>{list.name}</h3>
          <p>{list.description}</p>
          <div>
            <strong>Sample Words:</strong>
            <ul>
              {samples[list.name]?.map((word) => (
                <li key={word.wordId}>
                  {word.character && <span><strong>Character:</strong> {word.character}<br /></span>}
                  {word.pinyin && <span><strong>Pinyin:</strong> {word.pinyin}<br /></span>}
                  {word.meaning && <span><strong>Meaning:</strong> {word.meaning}<br /></span>}
                  {word.sentence && <span><em>{word.sentence}</em><br /></span>}
                  {word.sentencePinyin && <span>({word.sentencePinyin})<br /></span>}
                  {word.sentenceMeaning && <span>{word.sentenceMeaning}<br /></span>}
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
