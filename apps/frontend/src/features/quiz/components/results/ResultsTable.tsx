/**
 * ResultsTable Component
 * Component Reorganization: Renamed from QuizResultsTable
 * Story 15.10: Quiz UX Polish - Component Reorganization
 *
 * Displays detailed quiz results in a table format.
 * Pure presentational component showing word, answer, next review, and lapse count.
 * Includes conditional styling for incorrect answers and leech warnings.
 */

import { QuizAnswer } from "../../types";
import "./ResultsTable.css";

type ResultsTableProps = {
  answers: QuizAnswer[];
  formatDate: (isoDate?: string) => string;
};

export function ResultsTable({ answers, formatDate }: ResultsTableProps) {
  const getExpectedAnswer = (answer: QuizAnswer): string => {
    switch (answer.questionType) {
      case "type_pinyin":
        return answer.pinyin || "?";
      case "type_character":
        return answer.word || "?";
      case "multiple_choice":
        return answer.english || "?";
      default:
        return "?";
    }
  };

  return (
    <div className="resultsTable">
      <h3 className="detailedResultsTitle">Detailed Results</h3>
      <div className="resultsTableWrapper">
        <table className="resultsTableElement">
          <thead>
            <tr className="resultsTableHeaderRow">
              <th className="tableHeaderCell">Word</th>
              <th className="tableHeaderCell">Your Answer</th>
              <th className="tableHeaderCell">Next Review</th>
              <th className="tableHeaderCell" title="Times missed in a row">
                Times Missed ❓
              </th>
            </tr>
          </thead>
          <tbody>
            {answers.map((answer, idx) => {
              const expectedAnswer = getExpectedAnswer(answer);
              // Story 15.11: Backend provides isLeech flag
              const isLeech = answer.isLeech ?? false;

              return (
                <tr
                  key={idx}
                  className={`resultsRow resultsTableBodyRow ${!answer.correct ? "incorrect" : ""}`}
                >
                  <td className="wordCell">
                    {answer.word || answer.wordId} ({answer.pinyin || "?"})
                    <br />
                    <span className="wordEnglish">{answer.english || ""}</span>
                  </td>
                  <td className="answerCell">
                    <div className="userAnswerText">{answer.userAnswer}</div>
                    {!answer.correct && <div className="correctAnswerHint">→ {expectedAnswer}</div>}
                  </td>
                  <td className="nextReviewCell">{formatDate(answer.nextReviewDate)}</td>
                  <td
                    className={`lapseCountCell ${isLeech ? "leechWarning" : ""}`}
                    title="Times missed in a row"
                  >
                    {answer.lapseCount || 0}
                    {isLeech && " 🔴"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
