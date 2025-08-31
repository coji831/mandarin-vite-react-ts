/**
 * Mandarin page
 *
 * - Main page for Mandarin learning flow.
 * - Uses context/hooks to manage user progress and persistence in localStorage ('user_progress').
 * - Structure: { lists: [{ listName, sections, dailyWordCount, completedSections }] }
 * - Merges tracking data with word data via wordId, never mutating word data itself.
 * - Validates wordId uniqueness and skips/logs invalid entries.
 * - Handles import/export of progress and vocabulary lists.
 * - Loads and merges progress on page load.
 * - Manages state for selected list, sections, daily word count, review, and history via context.
 * - Handles navigation between subpages/components.
 */
import { useEffect, useRef, useState } from "react";
import {
  Basic,
  DailyCommitment,
  FlashCard,
  NavBar,
  SectionConfirm,
  SectionSelect,
  VocabularyListSelector,
} from "../components";
import {
  getUserProgress,
  saveUserProgress,
} from "../hooks/useMandarinProgress";
import { useProgressContext } from "../context/ProgressContext";
import { UserProgress } from "../types";

export { Mandarin };

function getTodayKey() {
  const today = new Date();
  return today.toISOString().slice(0, 10); // YYYY-MM-DD
}

function Mandarin() {
  const importInputRef = useRef<HTMLInputElement>(null);
  // --- State and hooks ---
  const [currentPage, setCurrentPage] = useState("vocablist");
  const {
    selectedList,
    setSelectedList,
    selectedWords,
    setSelectedWords,
    sections,
    setSections,
    learnedWordIds,
    setLearnedWordIds,
    dailyWordCount,
    setDailyWordCount,
    inputValue,
    setInputValue,
    reviewIndex,
    setReviewIndex,
    history,
    setHistory,
    error,
    setError,
    loading,
    setLoading,
    selectedSectionId,
    setSelectedSectionId,
    sectionProgress,
    setSectionProgress,
    markWordLearned,
    saveCommitment,
    // ...other state and functions from useMandarinProgress
  } = useProgressContext();
  // Keep UI-only state here (e.g., currentPage)

  // --- Load and initialize user progress on page load or list change ---
  useEffect(() => {
    if (!selectedList) return;
    setLoading(true);
    try {
      // 1. Load all words for this list and validate wordIds
      const validWords = validateWordIds(selectedWords);
      // 2. Load user_progress from localStorage
      let userProgress = getUserProgress();
      // 3. Find or create entry for this list
      let listEntry = userProgress.lists.find(
        (l: any) => l.listName === selectedList,
      );
      if (!listEntry) {
        listEntry = {
          listName: selectedList,
          sections: [],
          dailyWordCount: null,
          completedSections: [],
        };
        userProgress.lists.push(listEntry);
        saveUserProgress(userProgress);
      }
      // 4. If no sections, initialize sections
      if (!listEntry.sections || listEntry.sections.length === 0) {
        // Default: one section with all words
        listEntry.sections = [
          {
            sectionId: "section_1",
            wordIds: validWords.map((w) => w.wordId),
            progress: {},
          },
        ];
        saveUserProgress(userProgress);
      }
      // 5. Set state from progress
      setDailyWordCount(listEntry.dailyWordCount || null);
      setSections(listEntry.sections);
      // Merge progress into word data for learnedWordIds, history, etc.
      let learned: string[] = [];
      let hist: Record<string, string[]> = {};
      const sectionProgress: Record<string, number> = {};
      for (const section of listEntry.sections) {
        // Merge progress fields into word data
        const merged = mergeProgress(
          validWords.filter((w) => section.wordIds.includes(w.wordId)),
          section.progress,
        );
        // Count mastered
        const mastered = merged.filter((w: any) => w.mastered).length;
        sectionProgress[section.sectionId] = mastered;
        // Collect learnedWordIds
        learned.push(
          ...merged.filter((w: any) => w.mastered).map((w: any) => w.wordId),
        );
        // Collect review history if present
        if (section.history) {
          for (const [date, ids] of Object.entries(section.history)) {
            if (!hist[date]) hist[date] = [];
            hist[date].push(...(ids as string[]));
          }
        }
      }
      setLearnedWordIds(Array.from(new Set(learned)));
      setHistory(hist);
      setSectionProgress(sectionProgress);
      setReviewIndex(0);
      setError("");
    } catch (err) {
      setError("Failed to load progress. Please refresh or reset.");
    }
    setLoading(false);
  }, [selectedList, selectedWords]);

  // --- User Progress Tracking ---

  // getUserProgress and saveUserProgress now provided by useMandarinProgress

  // Validate wordId uniqueness in a list of words
  function validateWordIds(words: any[]): any[] {
    const seen = new Set<string>();
    const valid: any[] = [];
    for (const w of words) {
      if (!w.wordId) {
        console.warn("Missing wordId, skipping:", w);
        continue;
      }
      if (seen.has(w.wordId)) {
        console.warn("Duplicate wordId, skipping:", w.wordId);
        continue;
      }
      seen.add(w.wordId);
      valid.push(w);
    }
    return valid;
  }

  // Merge progress data into word objects
  function mergeProgress(words: any[], progress: Record<string, any>) {
    return words.map((w) => ({
      ...w,
      ...(progress && progress[w.wordId] ? progress[w.wordId] : {}),
    }));
  }

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

  // Mark a word as learned and update user_progress
  const handleMarkLearned = (wordId: string) => {
    if (!selectedList) return;
    setLoading(true);
    try {
      let userProgress = getUserProgress();
      let listEntry = userProgress.lists.find(
        (l: any) => l.listName === selectedList,
      );
      if (!listEntry) return;
      // Find section containing wordId
      let section = listEntry.sections.find((s: any) =>
        s.wordIds.includes(wordId),
      );
      if (!section) return;
      // Update progress for wordId
      if (!section.progress[wordId]) section.progress[wordId] = {};
      const now = new Date();
      section.progress[wordId].mastered = true;
      section.progress[wordId].lastReviewed = now.toISOString();
      section.progress[wordId].reviewCount =
        (section.progress[wordId].reviewCount || 0) + 1;
      // Spaced repetition: nextReview = 3 days after lastReviewed
      const nextReview = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      section.progress[wordId].nextReview = nextReview.toISOString();

      // --- Section-specific history ---
      if (!section.history) section.history = {};
      const todayKey = getTodayKey();
      if (!section.history[todayKey]) section.history[todayKey] = [];
      if (!section.history[todayKey].includes(wordId)) {
        section.history[todayKey].push(wordId);
      }

      // Mark section as completed if all mastered
      if (
        section.wordIds.every((id: string) => section.progress[id]?.mastered)
      ) {
        if (!listEntry.completedSections) listEntry.completedSections = [];
        if (!listEntry.completedSections.includes(section.sectionId))
          listEntry.completedSections.push(section.sectionId);
      }
      saveUserProgress(userProgress);
      // Update state
      // Re-merge progress for UI
      const validWords = validateWordIds(selectedWords);
      let learned: string[] = [];
      let hist: Record<string, string[]> = {};
      const sectionProgress: Record<string, number> = {};
      for (const section of listEntry.sections) {
        const merged = mergeProgress(
          validWords.filter((w) => section.wordIds.includes(w.wordId)),
          section.progress,
        );
        const mastered = merged.filter((w: any) => w.mastered).length;
        sectionProgress[section.sectionId] = mastered;
        learned.push(
          ...merged.filter((w: any) => w.mastered).map((w: any) => w.wordId),
        );
      }
      // Only use global history for the list, not for sections
      setLearnedWordIds(Array.from(new Set(learned)));
      // Show only current section's history if a section is selected
      if (selectedSectionId) {
        const currentSection = listEntry.sections.find(
          (s: any) => s.sectionId === selectedSectionId,
        );
        setHistory(
          currentSection && currentSection.history
            ? currentSection.history
            : {},
        );
      } else {
        setHistory({});
      }
      setSectionProgress(sectionProgress);
      setError("");
    } catch (err) {
      setError("Failed to update progress. Please try again.");
    }
    setLoading(false);
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

  // --- Export/Import Progress ---
  // Export user_progress as JSON file
  const handleExportProgress = () => {
    const userProgress = getUserProgress();
    const blob = new Blob([JSON.stringify(userProgress, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user_progress.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  // Import user_progress from JSON file
  const handleImportProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (
          !imported ||
          typeof imported !== "object" ||
          !Array.isArray(imported.lists)
        ) {
          setError("Invalid progress file format.");
          return;
        }

        // Get existing progress from localStorage
        let existingProgress: UserProgress = getUserProgress();
        let mergedProgress: UserProgress = { lists: [] };

        // Merge each list by listName
        for (const importedList of imported.lists) {
          const existingList = existingProgress.lists.find(
            (l: any) => l.listName === importedList.listName,
          );
          if (!existingList) {
            // No existing, just add imported
            mergedProgress.lists.push(importedList);
          } else {
            // Merge sections by sectionId
            const mergedSections = importedList.sections.map(
              (importedSection: any) => {
                const existingSection = existingList.sections.find(
                  (s: any) => s.sectionId === importedSection.sectionId,
                );
                if (!existingSection) {
                  return importedSection;
                } else {
                  // Merge progress by wordId
                  const mergedProgressObj: Record<string, any> = {
                    ...existingSection.progress,
                  };
                  for (const wordId of Object.keys(
                    importedSection.progress || {},
                  )) {
                    mergedProgressObj[wordId] =
                      importedSection.progress[wordId];
                  }
                  return {
                    ...importedSection,
                    progress: mergedProgressObj,
                  };
                }
              },
            );
            // Preserve any unmatched sections from existing
            const unmatchedSections = existingList.sections.filter(
              (s: any) =>
                !importedList.sections.some(
                  (is: any) => is.sectionId === s.sectionId,
                ),
            );
            mergedProgress.lists.push({
              ...importedList,
              sections: [...mergedSections, ...unmatchedSections],
              // Merge completedSections and dailyWordCount (prefer imported)
              completedSections:
                importedList.completedSections ||
                existingList.completedSections ||
                [],
              dailyWordCount:
                importedList.dailyWordCount ??
                existingList.dailyWordCount ??
                null,
            });
          }
        }
        // Add any lists in existingProgress not present in imported
        for (const existingList of existingProgress.lists) {
          if (
            !mergedProgress.lists.some(
              (l: any) => l.listName === existingList.listName,
            )
          ) {
            mergedProgress.lists.push(existingList);
          }
        }

        saveUserProgress(mergedProgress);
        const firstList = mergedProgress.lists[0];
        if (firstList) {
          setSelectedList(firstList.listName);
          let vocabListMeta = null;
          try {
            const res = await fetch("/data/vocabularyLists.json");
            if (res.ok) {
              const vocabLists = await res.json();
              vocabListMeta = vocabLists.find(
                (l: any) => l.name === firstList.listName,
              );
            }
          } catch {}
          let words = [];
          if (vocabListMeta) {
            try {
              const res = await fetch(`/data/${vocabListMeta.file}`);
              if (res.ok) {
                words = await res.json();
              }
            } catch {}
          }
          if (!words.length) {
            setError(
              "Vocabulary data for the imported list could not be found. Import aborted.",
            );
            return;
          }
          const vocabWordIds = new Set(words.map((w: any) => String(w.wordId)));
          let invalidWordIds: string[] = [];
          const cleanedSections = firstList.sections.map((section: any) => {
            const validWordIds = section.wordIds.filter((id: string) => {
              if (!vocabWordIds.has(String(id))) {
                invalidWordIds.push(String(id));
                return false;
              }
              return true;
            });
            const cleanedProgress: Record<string, any> = {};
            for (const id of validWordIds) {
              if (section.progress && section.progress[id]) {
                cleanedProgress[id] = section.progress[id];
              }
            }
            return {
              ...section,
              wordIds: validWordIds,
              progress: cleanedProgress,
            };
          });
          const validWords = validateWordIds(words);
          let learned: string[] = [];
          const sectionProgress: Record<string, number> = {};
          for (const section of cleanedSections) {
            const merged = mergeProgress(
              validWords.filter((w) => section.wordIds.includes(w.wordId)),
              section.progress,
            );
            const mastered = merged.filter((w: any) => w.mastered).length;
            sectionProgress[section.sectionId] = mastered;
            learned.push(
              ...merged
                .filter((w: any) => w.mastered)
                .map((w: any) => w.wordId),
            );
          }
          setSelectedWords(words);
          setSections(cleanedSections);
          setDailyWordCount(firstList.dailyWordCount || null);
          setSectionProgress(sectionProgress);
          setLearnedWordIds(Array.from(new Set(learned)));
          setSelectedSectionId(null);
          setCurrentPage("sectionselect");
          setError(
            invalidWordIds.length
              ? `Some wordIds in imported data do not exist in the vocabulary and were skipped: ${invalidWordIds.join(
                  ", ",
                )}`
              : "",
          );
        }
      } catch (err) {
        setError("Failed to import progress: " + (err as any)?.message);
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = "";
  };

  return (
    <div
      style={{
        width: "100%",
        height: "750px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          margin: "8px 0 0 8px",
        }}
      >
        <button onClick={handleExportProgress}>Export Progress</button>
        <input
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          ref={importInputRef}
          onChange={handleImportProgress}
        />
        <button
          type="button"
          onClick={() =>
            importInputRef.current && importInputRef.current.click()
          }
        >
          Import Progress
        </button>
        {error && <span style={{ color: "red", marginLeft: 8 }}>{error}</span>}
      </div>

      <NavBar setCurrentPage={setCurrentPage} />
      {currentPage === "vocablist" && (
        <VocabularyListSelector
          onListSelected={() => setCurrentPage("dailycommitment")}
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
          onMarkMastered={handleMarkLearned}
          masteredWordIds={new Set(learnedWordIds)}
          onBackToSection={() => setCurrentPage("sectionselect")}
        />
      )}
      {currentPage === "basic" && <Basic />}
      {currentPage === "dailycommitment" && (
        <DailyCommitment onConfirm={() => setCurrentPage("sectionconfirm")} />
      )}
      {currentPage === "sectionconfirm" && (
        <SectionConfirm onProceed={() => setCurrentPage("sectionselect")} />
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
    </div>
  );
}
