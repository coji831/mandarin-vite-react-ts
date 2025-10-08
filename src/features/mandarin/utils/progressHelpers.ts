// Loads user progress and vocabulary, sets state via provided callbacks
import { VocabWord } from "../../../utils/csvLoader";
export async function loadUserProgressAndVocabulary({
  userId,
  setSelectedList,
  setSections,
  setDailyWordCount,
  setSelectedWords,
  setLearnedWordIds,
  setHistory,
  setSectionProgress,
  setError,
}: {
  userId: string;
  setSelectedList: (v: string) => void;
  setSections: (v: any[]) => void;
  setDailyWordCount: (v: number | null) => void;
  setSelectedWords: (v: any[]) => void;
  setLearnedWordIds: (v: string[]) => void;
  setHistory: (v: Record<string, string[]>) => void;
  setSectionProgress: (v: Record<string, number>) => void;
  setError: (v: string) => void;
}) {
  try {
    const { getUserProgress } = await import("./ProgressStore");
    const userProgress = getUserProgress(userId);
    if (userProgress && userProgress.lists && userProgress.lists.length > 0) {
      const firstList = userProgress.lists[0];
      if (firstList && firstList.sections && firstList.sections.length > 0) {
        setSelectedList(firstList.id);
        setSections(firstList.sections);
        setDailyWordCount(firstList.dailyWordCount || null);
        try {
          const vocabListsResponse = await fetch("/data/vocabulary/vocabularyLists.json");
          if (vocabListsResponse.ok) {
            const vocabLists = await vocabListsResponse.json();
            const listMeta = vocabLists.find((l: any) => l.name === firstList.listName);
            if (listMeta) {
              const { loadCsvVocab } = await import("../../../utils/csvLoader");
              const csvUrl = `/data/vocabulary/${listMeta.file}`;
              const vocabWords: VocabWord[] = await loadCsvVocab(csvUrl);
              const words = vocabWords.map((word: VocabWord) => ({
                wordId: String(word.wordId),
                character: word.Chinese,
                pinyin: word.Pinyin,
                meaning: word.English,
                No: word.wordId,
                Chinese: word.Chinese,
                Pinyin: word.Pinyin,
                English: word.English,
              }));
              setSelectedWords(words);
            }
          }
        } catch (vocabErr) {
          setError("Failed to load vocabulary data for selected list.");
        }
        let learned: string[] = [];
        let hist: Record<string, string[]> = {};
        const sectionProgressObj: Record<string, number> = {};
        for (const section of firstList.sections) {
          const mastered = section.wordIds.filter(
            (id: string) => section.progress[id]?.mastered
          ).length;
          sectionProgressObj[section.sectionId] = mastered;
          learned.push(...section.wordIds.filter((id: string) => section.progress[id]?.mastered));
          if (section.history) {
            for (const [date, ids] of Object.entries(section.history)) {
              if (!hist[date]) hist[date] = [];
              hist[date].push(...(ids as string[]));
            }
          }
        }
        setLearnedWordIds(Array.from(new Set(learned)));
        setHistory(hist);
        setSectionProgress(sectionProgressObj);
      }
    }
  } catch (err) {
    setError("Failed to load progress data.");
  }
}
// progressHelpers.ts
// Helper functions for useMandarinProgress logic (extracted for SRP and clarity)
import { UserProgress } from "../types";

export function updateWordProgressInSection(section: any, wordId: string) {
  if (!section.progress[wordId]) section.progress[wordId] = {};
  const now = new Date();
  section.progress[wordId].mastered = true;
  section.progress[wordId].lastReviewed = now.toISOString();
  section.progress[wordId].reviewCount = (section.progress[wordId].reviewCount || 0) + 1;
  // Spaced repetition: nextReview = 3 days after lastReviewed
  const nextReview = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  section.progress[wordId].nextReview = nextReview.toISOString();
}

export function updateSectionHistory(section: any, wordId: string) {
  if (!section.history) section.history = {};
  const todayKey = new Date().toISOString().slice(0, 10);
  if (!section.history[todayKey]) section.history[todayKey] = [];
  if (!section.history[todayKey].includes(wordId)) {
    section.history[todayKey].push(wordId);
  }
}

export function markSectionCompleted(listEntry: any, section: any) {
  if (section.wordIds.every((id: string) => section.progress[id]?.mastered)) {
    if (!listEntry.completedSections) listEntry.completedSections = [];
    if (!listEntry.completedSections.includes(section.sectionId))
      listEntry.completedSections.push(section.sectionId);
  }
}

export function buildSectionProgress(listEntry: any, selectedWords: any[]) {
  let learned: string[] = [];
  let hist: Record<string, string[]> = {};
  const sectionProgressObj: Record<string, number> = {};
  for (const section of listEntry.sections) {
    const merged = section.wordIds
      .map((wordId: string) => {
        const word = selectedWords.find((w: any) => String(w.wordId) === String(wordId));
        return {
          ...word,
          ...(section.progress && section.progress[wordId] ? section.progress[wordId] : {}),
        };
      })
      .filter(Boolean);
    const mastered = merged.filter((w: any) => w.mastered).length;
    sectionProgressObj[section.sectionId] = mastered;
    learned.push(...merged.filter((w: any) => w.mastered).map((w: any) => w.wordId));
    // Collect review history if present
    if (section.history) {
      for (const [date, ids] of Object.entries(section.history)) {
        if (!hist[date]) hist[date] = [];
        hist[date].push(...(ids as string[]));
      }
    }
  }
  return {
    learnedWordIds: Array.from(new Set(learned)),
    history: hist,
    sectionProgress: sectionProgressObj,
  };
}

export function buildSectionsFromWords(words: any[], perSection: number) {
  const sections = [];
  let sectionIdx = 1;
  for (let i = 0; i < words.length; i += perSection) {
    const chunk = words.slice(i, i + perSection);
    const sectionId = `section_${sectionIdx}`;
    sectionIdx++;
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
