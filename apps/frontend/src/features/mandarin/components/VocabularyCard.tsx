import { VocabularyList, WordProgress } from "../types";
import type { RootState } from "../reducers";
import { selectWordsById } from "../reducers/progressReducer";
import { useProgressState } from "../hooks";
import "./VocabularyCard.css";

interface VocabularyCardProps {
  list: VocabularyList;
  onSelect: (list: VocabularyList) => void;
  wordIds?: string[]; // Optional: actual word IDs for this list for accurate progress calculation
}

export function VocabularyCard({ list, onSelect, wordIds }: VocabularyCardProps) {
  // Story 13.4: Get progress data using selector (avoids direct state access)
  const progressData = useProgressState((s: RootState) =>
    selectWordsById(s.progress ?? { wordsById: {}, wordIds: [] })
  );

  // Calculate progress from backend data
  const calculatedProgress = calculateListProgress(list, progressData, wordIds);

  const progressValue = calculatedProgress.progressPercent;
  const mastered = calculatedProgress.masteredCount;
  const notStarted = progressValue === 0 && mastered === 0;
  return (
    <div className="vocabulary-card" tabIndex={0} aria-label={`Vocabulary list: ${list.name}`}>
      <div className="card-header">
        <h3>{list.name}</h3>
        {list.difficulty && (
          <div
            className="difficulty-badge"
            style={{ backgroundColor: getDifficultyColor(list.difficulty) }}
            title={`Difficulty level: ${list.difficulty}`}
          >
            {list.difficulty}
          </div>
        )}
      </div>
      <p className="description">{list.description}</p>
      <div className="metadata">
        {list.wordCount !== undefined && (
          <div className="word-count" title="Number of vocabulary words in this list">
            <span className="count-number">{list.wordCount}</span>
            <span className="count-label">words</span>
          </div>
        )}
        {list.tags && list.tags.length > 0 && (
          <div className="tags-container" title="Categories and topics">
            {list.tags &&
              list.tags.slice(0, 5).map((tag: string, index: number) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
          </div>
        )}
      </div>
      {/* Progress bar and numeric indicator */}
      <div className="progress-container" aria-label="Progress" title="Your progress in this list">
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressValue}%` }} />
        </div>
        <span className="progress-label">
          {notStarted
            ? "Not started"
            : `${mastered} / ${list.wordCount} mastered (${progressValue}%)`}
        </span>
      </div>
      <div className="card-footer">
        <button className="select-button" type="button" onClick={() => onSelect(list)} tabIndex={0}>
          Select
        </button>
      </div>
    </div>
  );
}

/**
 * Calculate vocabulary list progress metrics from backend progress data.
 *
 * Applies mastery criteria (confidence ≥ 0.8 OR correctCount ≥ 3) to determine
 * how many words in the list have been mastered.
 *
 * Story 13.4: Progress migrated from localStorage to backend; wordIds now
 * loaded from vocabulary files and passed as separate prop.
 *
 * @param list - The vocabulary list containing metadata (name, wordCount)
 * @param progressData - Record of wordId → WordProgress from reducer state
 * @param actualWordIds - Array of word IDs belonging to this list (required for accurate calculation)
 * @returns Object containing:
 *   - masteredCount: Number of words meeting mastery criteria
 *   - progressPercent: Percentage (0-100) of list completion
 *
 * @example
 * const progress = calculateListProgress(
 *   { id: "hsk1", wordCount: 150, ...otherFields },
 *   { "word1": { confidence: 0.9, ... }, "word2": { correctCount: 4, ... } },
 *   ["word1", "word2", "word3"]
 * );
 * // Returns: { masteredCount: 2, progressPercent: 67 }
 */
function calculateListProgress(
  list: VocabularyList,
  progressData?: Record<string, WordProgress>,
  actualWordIds?: string[]
): { masteredCount: number; progressPercent: number } {
  if (!progressData) {
    return { masteredCount: 0, progressPercent: 0 };
  }

  // If we have actual word IDs, use them for accurate calculation
  if (actualWordIds && actualWordIds.length > 0) {
    const masteredCount = actualWordIds.filter((wordId) => {
      const progress = progressData[wordId];
      if (!progress) return false;

      // Mastery criteria: confidence >= 0.8 or correctCount >= 3
      const hasHighConfidence = (progress.confidence ?? 0) >= 0.8;
      const hasEnoughCorrect = (progress.correctCount ?? 0) >= 3;
      return hasHighConfidence || hasEnoughCorrect;
    }).length;

    const progressPercent = Math.round((masteredCount / actualWordIds.length) * 100);
    return { masteredCount, progressPercent };
  }

  // Fallback: use wordCount as denominator (less accurate)
  // This will show 0% until words are loaded and passed via actualWordIds
  const wordCount = list.wordCount ?? 0;
  if (wordCount === 0) {
    return { masteredCount: 0, progressPercent: 0 };
  }

  return { masteredCount: 0, progressPercent: 0 };
}

const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case "beginner":
      return "#4caf50"; // Green
    case "intermediate":
      return "#ff9800"; // Orange
    case "advanced":
      return "#f44336"; // Red
    default:
      return "#757575"; // Gray for unknown
  }
};
