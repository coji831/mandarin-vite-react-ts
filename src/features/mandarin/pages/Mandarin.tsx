import { useEffect, useState } from "react";
import {
  Basic,
  DailyCommitment,
  FlashCard,
  NavBar,
  ReviewFlow,
  VocabularyListSelector,
  SectionConfirm,
} from "../components";

export { Mandarin };

function getTodayKey() {
  const today = new Date();
  return today.toISOString().slice(0, 10); // YYYY-MM-DD
}

function Mandarin() {
  const [currentPage, setCurrentPage] = useState("vocablist");
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<any[]>([]);
  const [dailyWordCount, setDailyWordCount] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [learnedWordIds, setLearnedWordIds] = useState<number[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [history, setHistory] = useState<Record<string, number[]>>({});
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    if (selectedList) {
      setLoading(true);
      try {
        const tracking = localStorage.getItem(`tracking_${selectedList}`);
        if (tracking) {
          const obj = JSON.parse(tracking);
          setDailyWordCount(obj.dailyWordCount || null);
          setLearnedWordIds(obj.learnedWordIds || []);
          setHistory(obj.history || {});
        } else {
          setLearnedWordIds([]);
          setHistory({});
        }
        setReviewIndex(0);
        setError("");
      } catch (err) {
        setError("Failed to load progress. Please refresh or reset.");
      }
      setLoading(false);
    }
  }, [selectedList]);

  // Helper to divide words into sections
  function divideIntoSections(words: any[], count: number) {
    const sections = [];
    let sectionIdx = 1;
    for (let i = 0; i < words.length; i += count) {
      const chunk = words.slice(i, i + count);
      const sectionId = `section_${sectionIdx}`;
      sectionIdx++;
      // progress object for each word
      const progress: Record<string, any> = {};
      chunk.forEach((w: any) => {
        progress[w.wordId] = {
          mastered: false,
          lastReviewed: null,
          reviewCount: 0,
          nextReview: null,
        };
      });
      sections.push({
        sectionId,
        wordIds: chunk.map((w: any) => w.wordId),
        progress,
      });
    }
    return sections;
  }

  const handleCommitmentSave = () => {
    if (!selectedList) return;
    const num = Number(inputValue);
    const maxAllowed = Math.min(50, selectedWords.length || 50);
    if (!Number.isInteger(num) || num < 1 || num > maxAllowed) {
      setError(`Please enter a number between 1 and ${maxAllowed}`);
      return;
    }
    setLoading(true);
    try {
      const newSections = divideIntoSections(selectedWords, num);
      localStorage.setItem(
        `tracking_${selectedList}`,
        JSON.stringify({
          listName: selectedList,
          sections: newSections,
          dailyWordCount: num,
          learnedWordIds: [],
          history: {},
        }),
      );
      setDailyWordCount(num);
      setLearnedWordIds([]);
      setHistory({});
      setReviewIndex(0);
      setSections(newSections);
      setCurrentPage("sectionconfirm");
      setError("");
    } catch (err) {
      setError("Failed to save commitment. Please try again.");
    }
    setLoading(false);
  };

  const handleMarkLearned = (wordId: number) => {
    if (selectedList) {
      setLoading(true);
      try {
        const todayKey = getTodayKey();
        const updatedIds = [...learnedWordIds, wordId];
        setLearnedWordIds(updatedIds);
        const updatedHistory = { ...history };
        if (!updatedHistory[todayKey]) updatedHistory[todayKey] = [];
        updatedHistory[todayKey] = [...updatedHistory[todayKey], wordId];
        setHistory(updatedHistory);
        const tracking = localStorage.getItem(`tracking_${selectedList}`);
        if (tracking) {
          const obj = JSON.parse(tracking);
          obj.learnedWordIds = updatedIds;
          obj.history = updatedHistory;
          localStorage.setItem(`tracking_${selectedList}`, JSON.stringify(obj));
        }
        setReviewIndex((prev) => prev + 1);
        setError("");
      } catch (err) {
        setError("Failed to update progress. Please try again.");
      }
      setLoading(false);
    }
  };

  const todaysWords = selectedWords
    .filter((w: any) => !learnedWordIds.includes(w.wordId))
    .slice(0, dailyWordCount ?? selectedWords.length);

  const currentReviewWord = todaysWords[reviewIndex];

  return (
    <div
      style={{
        width: "100%",
        height: "750px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavBar setCurrentPage={setCurrentPage} />
      {currentPage === "vocablist" && (
        <VocabularyListSelector
          onSelect={(listName, words) => {
            setSelectedList(listName);
            setSelectedWords(words);
            setCurrentPage("dailycommitment");
          }}
        />
      )}
      {currentPage === "flashcards" && <FlashCard />}
      {currentPage === "basic" && <Basic />}
      {currentPage === "dailycommitment" && (
        <DailyCommitment
          selectedList={selectedList}
          selectedWords={selectedWords}
          inputValue={inputValue}
          setInputValue={setInputValue}
          dailyWordCount={dailyWordCount}
          handleCommitmentSave={handleCommitmentSave}
          loading={loading}
          error={error}
        />
      )}
      {currentPage === "sectionconfirm" && (
        <SectionConfirm
          sections={sections}
          wordsPerSection={dailyWordCount || 0}
          onProceed={() => setCurrentPage("review")}
        />
      )}
      {currentPage === "review" && (
        <ReviewFlow
          loading={loading}
          error={error}
          learnedWordIds={learnedWordIds}
          selectedWords={selectedWords}
          selectedList={selectedList}
          setCurrentPage={setCurrentPage}
          setDailyWordCount={setDailyWordCount}
          setLearnedWordIds={setLearnedWordIds}
          setHistory={setHistory}
          setInputValue={setInputValue}
          setReviewIndex={setReviewIndex}
          reviewIndex={reviewIndex}
          handleMarkLearned={handleMarkLearned}
          todaysWords={todaysWords}
          currentReviewWord={currentReviewWord}
          history={history}
        />
      )}
    </div>
  );
}
