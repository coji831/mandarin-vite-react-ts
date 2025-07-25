/**
 * AddForm component contract:
 *
 * - Allows user to input and add a new Card (word) or multiple cards.
 * - Calls addCard with the new card(s) and onCancel when done.
 * - Pure presentational; does not manage persistence or parent state.
 */
/**
 * AddForm component contract:
 *
 * - Allows user to input and add a new Card (word) or multiple cards.
 * - Calls addCard with the new card(s) and onCancel when done.
 * - Pure presentational; does not manage persistence or parent state.
 */
import { useState, useRef } from "react";
import { Card } from "./FlashCard";

export { AddForm };

type Props = {
  addCard: (card: Card | Card[]) => void;
  onCancel: () => void;
};

function AddForm({ addCard, onCancel }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCard, setNewCard] = useState({
    wordId: "",
    character: "",
    pinyin: "",
    meaning: "",
    sentence: "",
    sentencePinyin: "",
    sentenceMeaning: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCard((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all fields are non-empty
    if (
      newCard.character &&
      newCard.pinyin &&
      newCard.meaning &&
      newCard.sentence &&
      newCard.sentencePinyin &&
      newCard.sentenceMeaning
    ) {
      addCard(newCard);
      setNewCard({
        wordId: "",
        character: "",
        pinyin: "",
        meaning: "",
        sentence: "",
        sentencePinyin: "",
        sentenceMeaning: "",
      });
      onCancel();
    } else {
      alert("Please fill in all fields.");
    }
  };

  return (
    <form onSubmit={handleAddSubmit} style={{ textAlign: "left" }}>
      <div style={{ marginBottom: "10px" }}>
        <label>
          {`Character:`}
          <input
            type="text"
            name="character"
            value={newCard.character}
            onChange={handleInputChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </label>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>
          {`Pinyin:`}
          <input
            type="text"
            name="pinyin"
            value={newCard.pinyin}
            onChange={handleInputChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </label>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>
          {`Meaning:`}
          <input
            type="text"
            name="meaning"
            value={newCard.meaning}
            onChange={handleInputChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </label>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>
          {`Sentence:`}
          <input
            type="text"
            name="sentence"
            value={newCard.sentence}
            onChange={handleInputChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </label>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>
          {`Sentence Pinyin:`}
          <input
            type="text"
            name="sentencePinyin"
            value={newCard.sentencePinyin}
            onChange={handleInputChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </label>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>
          {`Sentence Meaning:`}
          <input
            type="text"
            name="sentenceMeaning"
            value={newCard.sentenceMeaning}
            onChange={handleInputChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </label>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="primary" type="submit">
          Add
        </button>
        <button className="secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
