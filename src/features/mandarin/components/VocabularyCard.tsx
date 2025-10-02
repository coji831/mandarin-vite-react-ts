import React from "react";
import "./VocabularyCard.css";
import type { VocabularyList } from "../types";

interface VocabularyCardProps {
  list: VocabularyList;
  onSelect: (list: VocabularyList) => void;
}

export function VocabularyCard({ list, onSelect }: VocabularyCardProps) {
  return (
    <div className="vocabulary-card">
      <div className="card-header">
        <h3>{list.name}</h3>
      </div>
      <p className="description">{list.description}</p>
      <div className="card-footer">
        <button className="select-button" type="button" onClick={() => onSelect(list)}>
          Select
        </button>
      </div>
    </div>
  );
}
