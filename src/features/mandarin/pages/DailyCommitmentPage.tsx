/**
 * DailyCommitmentPage
 * Renders the daily commitment page as a dedicated route component.
 * Uses the useMandarinContext hook for state access.
 * Updated for story 4-3: Implements new routing, context usage, and navigation logic.
 */
import React from "react";
import { useMandarinContext } from "../context/useMandarinContext";
import { useNavigate } from "react-router-dom";

export function DailyCommitmentPage() {
  const {
    selectedList,
    selectedWords,
    inputValue,
    setInputValue,
    dailyWordCount,
    saveCommitment,
    loading,
    error,
  } = useMandarinContext();
  const navigate = useNavigate();

  // Recommended range
  const recommendedMin = 5;
  const recommendedMax = 20;
  const maxAllowed = Math.min(50, selectedWords.length || 50);
  const wordCount = selectedWords.length || 0;
  const inputNum = Number(inputValue);
  const isInputValid = Number.isInteger(inputNum) && inputNum >= 1 && inputNum <= maxAllowed;
  const estimatedDays = inputNum > 0 ? Math.ceil(wordCount / inputNum) : 0;

  const handleConfirm = () => {
    saveCommitment(inputNum);
    navigate("/mandarin/section-select");
  };

  return (
    <div className="daily-commitment-page">
      <h2>Set Your Daily Commitment</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <div>
        <label htmlFor="daily-word-count">Words per day:</label>
        <input
          id="daily-word-count"
          type="number"
          min={1}
          max={maxAllowed}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button onClick={handleConfirm} disabled={!isInputValid || loading}>
          Confirm
        </button>
        <p>
          Estimated days to complete: <b>{estimatedDays}</b>
        </p>
        <p>
          Recommended: {recommendedMin}-{recommendedMax} words/day
        </p>
      </div>
    </div>
  );
}
