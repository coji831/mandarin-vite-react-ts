import React from "react";
import "./VocabularyCard.css";
import type { VocabularyList, DifficultyLevel } from "../types/Vocabulary";

interface VocabularyCardProps {
  list: VocabularyList;
  onSelect: (list: VocabularyList) => void;
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

export function VocabularyCard({ list, onSelect }: VocabularyCardProps) {
  return (
    <div className="vocabulary-card">
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

      <div className="card-footer">
        <button className="select-button" type="button" onClick={() => onSelect(list)}>
          Select
        </button>
      </div>
    </div>
  );
}
