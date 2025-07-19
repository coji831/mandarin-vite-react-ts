import { useState } from "react";

import { ToggleSwitch } from "../../../components";
import cards from "../../../data/mandarin.json";
import { Setting } from "../types";
import { PlayButton } from "./PlayButton";
import { Sidebar } from "./Sidebar";
import { WordDetails } from "./WordDetails";

export { FlashCard, type Card };

type Card = {
  character: string;
  pinyin: string;
  meaning: string;
  sentence: string;
  sentencePinyin: string;
  sentenceMeaning: string;
};

function FlashCard() {
  const [showExample, setShowExample] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [settings, setSettings] = useState<Setting>({
    showPinyin: false,
    showMeaning: true,
  });

  const playAudio = (text: string | undefined) => {
    if (text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const handlePrevious = () => {
    setCurrentCardIndex((currentCardIndex - 1 + cards.length) % cards.length);
    //setShowMeaning(false);
  };

  const handleNext = () => {
    setCurrentCardIndex((currentCardIndex + 1) % cards.length);
    //setShowMeaning(false);
  };

  const currentCard = cards[currentCardIndex];

  return (
    <div
      id="flashcard"
      className="flex flex-col"
      style={{ width: "100%", minHeight: "100%" }}
    >
      <div
        className="flex gap-10"
        style={{ maxHeight: "100%", justifyContent: "flex-end" }}
      >
        <ToggleSwitch
          label="Show Pinyin"
          checked={settings.showPinyin}
          onChange={(checked) =>
            setSettings((s) => ({ ...s, showPinyin: checked }))
          }
        />

        <ToggleSwitch
          label="Show Meaning"
          checked={settings.showMeaning}
          onChange={(checked) =>
            setSettings((s) => ({ ...s, showMeaning: checked }))
          }
        />
      </div>
      <div className="flex" style={{ maxHeight: "100%" }}>
        <div style={{ width: "30%", overflowY: "auto", overflowX: "hidden" }}>
          <Sidebar
            showPinyin={settings.showPinyin}
            showMeaning={settings.showMeaning}
            cards={cards}
            setCurrentCardIndex={setCurrentCardIndex}
            currentCardIndex={currentCardIndex}
          />
        </div>
        <div style={{ width: "40%" }}>
          {/*Flashcard Content */}

          <div
            className="flex flex-col"
            style={{ height: "100%", justifyContent: "center" }}
          >
            <div
              className="flex flex-col flex-center"
              style={{ height: "100%" }}
            >
              <div
                style={{ color: "rgba(255, 255, 255, 1)", fontSize: "100px" }}
              >
                {currentCard.character}
              </div>
              {settings.showPinyin && (
                <div
                  style={{ fontSize: "24px", color: "rgba(255, 255, 255, .8)" }}
                >
                  {currentCard.pinyin}
                </div>
              )}

              {settings.showMeaning && (
                <div
                  style={{ fontSize: "24px", color: "rgba(255, 255, 255, .6)" }}
                >
                  {currentCard.meaning}
                </div>
              )}
            </div>
            <div className="flex gap-10 padding-10" style={rowStyle}>
              <button onClick={handlePrevious}>Previous</button>

              <PlayButton mandarinText={currentCard.character} />

              <button onClick={handleNext}>Next</button>
            </div>
            <div className="flex gap-10 padding-10" style={rowStyle}>
              <button onClick={() => playAudio(currentCard.sentence)}>
                {`Play Sentence`}
              </button>

              <button onClick={() => setShowExample(!showExample)}>
                {`${showExample ? "Hide" : "Show"} Example`}
              </button>
            </div>

            {showExample && <WordDetails {...currentCard} />}
          </div>
        </div>

        <div style={{ width: "30%" }}>
          {/* {showAddForm && (
            <AddForm addCard={addCard} onCancel={() => setShowAddForm(false)} />
          )} */}
        </div>
      </div>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  justifyContent: "space-between",
};
