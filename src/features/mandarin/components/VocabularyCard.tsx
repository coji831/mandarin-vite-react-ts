import React from "react";
import "./VocabularyCard.css";
import type { VocabularyList, DifficultyLevel } from "../types/Vocabulary";

interface VocabularyCardProps {
  list: VocabularyList;
  onSelect: (list: VocabularyList) => void;
  progress?: number; // 0-100, optional
  masteredCount?: number;
}

const getDifficultyColor = (difficulty: DifficultyLevel): string => {
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

export function VocabularyCard({ list, onSelect, progress, masteredCount }: VocabularyCardProps) {
  // For demo, use a random progress if not provided
  const progressValue = typeof progress === "number" ? progress : 0;
  const mastered = typeof masteredCount === "number" ? masteredCount : 0;
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
            {list.tags.slice(0, 5).map((tag, index) => (
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
