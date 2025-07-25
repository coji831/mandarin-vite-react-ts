/**
 * Mandarin page contract:
 *
 * - Main page for Mandarin learning flow.
 * - Manages state for selected list, sections, daily word count, review, and history.
 * - Handles all persistence, data loading, and navigation between subpages/components.
 */
import { useEffect, useState } from "react";
import {
  Basic,
  DailyCommitment,
  FlashCard,
  NavBar,
  ReviewFlow,
  VocabularyListSelector,
  SectionConfirm,
  SectionSelect,
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
  const [learnedWordIds, setLearnedWordIds] = useState<string[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [history, setHistory] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [sectionProgress, setSectionProgress] = useState<
    Record<string, number>
  >({});

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
          setSections(obj.sections || []);
          // Calculate section progress
          const progress: Record<string, number> = {};
          (obj.sections || []).forEach((section: any) => {
            const mastered = section.wordIds.filter((id: string) =>
              (obj.learnedWordIds || []).includes(id),
            ).length;
            progress[section.sectionId] = mastered;
          });
          setSectionProgress(progress);
        } else {
          setLearnedWordIds([]);
          setHistory({});
          setSections([]);
          setSectionProgress({});
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
        wordIds: chunk.map((w: any) => String(w.wordId)),
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
      // Reset section progress
      setSectionProgress({});
      setCurrentPage("sectionconfirm");
      setError("");
    } catch (err) {
      setError("Failed to save commitment. Please try again.");
    }
    setLoading(false);
  };

  const handleMarkLearned = (wordId: string) => {
    if (selectedList) {
      setLoading(true);
      try {
        const todayKey = getTodayKey();
        const updatedIds = [...learnedWordIds, wordId];
        setLearnedWordIds(updatedIds);
        const updatedHistory = { ...history };
        if (!updatedHistory[todayKey]) updatedHistory[todayKey] = [];
        updatedHistory[todayKey] = [
          ...(updatedHistory[todayKey] || []),
          wordId,
        ];
        setHistory(updatedHistory);
        const tracking = localStorage.getItem(`tracking_${selectedList}`);
        if (tracking) {
          const obj = JSON.parse(tracking);
          obj.learnedWordIds = updatedIds;
          obj.history = updatedHistory;
          localStorage.setItem(`tracking_${selectedList}`, JSON.stringify(obj));
          // Update section progress
          const progress: Record<string, number> = {};
          (obj.sections || []).forEach((section: any) => {
            const mastered = section.wordIds.filter((id: string) =>
              updatedIds.includes(id),
            ).length;
            progress[section.sectionId] = mastered;
          });
          setSectionProgress(progress);
        }
        // setReviewIndex((prev) => prev + 1); // Handled in ReviewFlow after marking as learned
        setError("");
      } catch (err) {
        setError("Failed to update progress. Please try again.");
      }
      setLoading(false);
    }
  };

  // Get words for the selected section only
  const selectedSection = sections.find(
    (s: any) => s.sectionId === selectedSectionId,
  );
  const sectionWordIds = selectedSection ? selectedSection.wordIds : [];
  const sectionWords = selectedWords.filter((w: any) =>
    sectionWordIds.includes(String(w.wordId)),
  );
  const sectionLearned = sectionWords.filter((w: any) =>
    learnedWordIds.includes(String(w.wordId)),
  );
  const sectionUnlearned = sectionWords.filter(
    (w: any) => !learnedWordIds.includes(String(w.wordId)),
  );
  const todaysWords = selectedSectionId
    ? sectionUnlearned.slice(0, dailyWordCount ?? sectionWords.length)
    : selectedWords
        .filter((w: any) => !learnedWordIds.includes(String(w.wordId)))
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
            setSections([]);
            setSectionProgress({});
            setSelectedSectionId(null);
          }}
        />
      )}
      {currentPage === "flashcards" && selectedSectionId && (
        <FlashCard
          sectionWords={sectionWords}
          sectionProgress={{
            mastered: sectionWords.filter((w: any) =>
              learnedWordIds.includes(String(w.wordId)),
            ).length,
            total: sectionWords.length,
          }}
          onMarkMastered={(wordId: string) => {
            // Mark as mastered in localStorage and update state
            if (!selectedList) return;
            const tracking = localStorage.getItem(`tracking_${selectedList}`);
            if (!tracking) return;
            const obj = JSON.parse(tracking);
            // Find section
            const sectionIdx = (obj.sections || []).findIndex(
              (s: any) => s.sectionId === selectedSectionId,
            );
            if (sectionIdx === -1) return;
            const section = obj.sections[sectionIdx];
            // Update progress for wordId
            if (!section.progress[wordId]) return;
            const now = new Date();
            section.progress[wordId].mastered = true;
            section.progress[wordId].lastReviewed = now.toISOString();
            section.progress[wordId].reviewCount =
              (section.progress[wordId].reviewCount || 0) + 1;
            // Spaced repetition: nextReview = 3 days after lastReviewed
            const nextReview = new Date(
              now.getTime() + 3 * 24 * 60 * 60 * 1000,
            );
            section.progress[wordId].nextReview = nextReview.toISOString();
            // Add to learnedWordIds if not present
            if (!obj.learnedWordIds) obj.learnedWordIds = [];
            if (!obj.learnedWordIds.includes(wordId))
              obj.learnedWordIds.push(wordId);
            // Update history
            const todayKey = getTodayKey();
            if (!obj.history) obj.history = {};
            if (!obj.history[todayKey]) obj.history[todayKey] = [];
            if (!obj.history[todayKey].includes(wordId))
              obj.history[todayKey].push(wordId);
            // Save
            localStorage.setItem(
              `tracking_${selectedList}`,
              JSON.stringify(obj),
            );
            // Update state
            setLearnedWordIds([...obj.learnedWordIds]);
            setHistory({ ...obj.history });
            // Update section progress
            const progress: Record<string, number> = {};
            (obj.sections || []).forEach((section: any) => {
              const mastered = section.wordIds.filter((id: string) =>
                obj.learnedWordIds.includes(id),
              ).length;
              progress[section.sectionId] = mastered;
            });
            setSectionProgress(progress);
          }}
          masteredWordIds={new Set(learnedWordIds)}
          onBackToSection={() => setCurrentPage("sectionselect")}
        />
      )}
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
          onProceed={() => setCurrentPage("sectionselect")}
        />
      )}
      {currentPage === "sectionselect" && (
        <SectionSelect
          sections={sections}
          selectedSectionId={selectedSectionId}
          setSelectedSectionId={setSelectedSectionId}
          onProceed={() => setCurrentPage("flashcards")}
          sectionProgress={sectionProgress}
          learnedWordIds={learnedWordIds}
          totalWords={selectedWords.length}
          onBack={() => setCurrentPage("dailycommitment")}
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
          onBack={() => setCurrentPage("sectionselect")}
        />
      )}
    </div>
  );
}
