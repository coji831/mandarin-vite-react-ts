/**
 * WordDetails component
 *
 * - Receives a Card object (word) as props and displays its details: pinyin, meaning, sentence, sentencePinyin, and sentenceMeaning.
 * - Pure presentational; does not manage state or persistence.
 */

import { useState } from "react";

import { WordBasic } from "../types";
import { WordExamplesPanel } from "./WordExamplesPanel";
import "../styles/worddetails.css";

export { WordDetails };

type WordDetailsProps = WordBasic & { wordId: string };

function WordDetails({ wordId, chinese, pinyin, english, hskLevel }: Readonly<WordDetailsProps>) {
  return (
    <div className="word-details">
      <p>
        <strong>Pinyin:</strong> {pinyin}
      </p>
      <p>
        <strong>Meaning:</strong> {english}
      </p>

      {wordId && chinese && (
        <>
          {/* The detail panel now will always show examples */}
          <WordExamplesPanel
            wordId={wordId}
            word={chinese}
            hskLevel={hskLevel ?? 1}
            language="en"
          />
        </>
      )}
    </div>
  );
}
