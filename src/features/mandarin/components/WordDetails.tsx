/**
 * WordDetails component
 *
 * - Receives a Card object (word) as props and displays its details: pinyin, meaning, sentence, sentencePinyin, and sentenceMeaning.
 * - Pure presentational; does not manage state or persistence.
 */

import { useState } from "react";

import { WordBasic } from "types";
import { ConversationBox } from "./ConversationBox";

export { WordDetails };

type WordDetailsProps = WordBasic & { wordId: string };

function WordDetails({ wordId, chinese, pinyin, english }: Readonly<WordDetailsProps>) {
  const [showExample, setShowExample] = useState(false);

  return (
    <div style={{ marginTop: "20px", textAlign: "left" }}>
      <p>
        <strong>Pinyin:</strong> {pinyin}
      </p>
      <p>
        <strong>Meaning:</strong> {english}
      </p>

      {/* Explicit Example Generation Button */}
      {wordId && chinese && (
        <div>
          <button
            style={{
              background: "#646cff",
              color: "#fff",
              borderRadius: 6,
              border: "none",
              padding: "6px 16px",
              marginBottom: 10,
              cursor: "pointer",
            }}
            onClick={() => setShowExample((show) => !show)}
          >
            {showExample ? "Hide Example" : "View Example"}
          </button>
          {showExample && (
            <ConversationBox wordId={wordId} word={chinese} onClose={() => setShowExample(false)} />
          )}
        </div>
      )}
    </div>
  );
}
