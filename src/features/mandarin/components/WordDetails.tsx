/**
 * WordDetails component contract:
 *
 * - Receives a Card object (word) as props and displays its details: pinyin, meaning, sentence, sentencePinyin, and sentenceMeaning.
 * - Pure presentational component; does not manage state or persistence.
 */
/**
 * WordDetails component contract:
 *
 * - Receives a Card object (word) as props and displays its details: pinyin, meaning, sentence, sentencePinyin, and sentenceMeaning.
 * - Pure presentational component; does not manage state or persistence.
 */
import { Card } from "./FlashCard";

export { WordDetails };

function WordDetails({
  pinyin,
  meaning,
  sentence,
  sentenceMeaning,
  sentencePinyin,
}: Readonly<Card>) {
  return (
    <div style={{ marginTop: "20px", textAlign: "left" }}>
      <p>
        <strong>Pinyin:</strong> {pinyin}
      </p>
      <p>
        <strong>Meaning:</strong> {meaning}
      </p>
      <p>
        <strong>Sentence:</strong> {sentence}
      </p>
      <p>
        <strong>Sentence Pinyin:</strong> {sentencePinyin}
      </p>
      <p>
        <strong>Sentence Meaning:</strong> {sentenceMeaning}
      </p>
    </div>
  );
}
