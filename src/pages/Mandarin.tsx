/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { ReactNode, useEffect, useState } from "react";
import vocabData from "../data/mandarin.json"; // Assuming vocabData is in JSON format
export { Mandarin };

function Mandarin() {
  const [currentPage, setCurrentPage] = useState("flashcards");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cards, setCards] = useState(vocabData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem("cards", JSON.stringify(cards));
    setIsLoading(false);
  }, [cards]);

  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  if (isLoading) {
    return (
      <div style={{ fontSize: "20px", textAlign: "center" }}>Loading...</div>
    );
  }
  return (
    <div style={{ width: "100%", maxWidth: "800px" }}>
      <NavBar setCurrentPage={setCurrentPage} />
      {currentPage === "flashcards" ? (
        <FlashcardPage
          cards={cards}
          setCurrentCardIndex={setCurrentCardIndex}
          currentCardIndex={currentCardIndex}
          isSidePanelOpen={isSidePanelOpen}
          toggleSidePanel={toggleSidePanel}
        />
      ) : (
        <LearningPage />
      )}
    </div>
  );
}

const FlashcardPage = ({
  cards,
  setCurrentCardIndex,
  currentCardIndex,
  isSidePanelOpen,
  toggleSidePanel,
}: {
  cards: any;
  setCurrentCardIndex: any;
  currentCardIndex: any;
  isSidePanelOpen: any;
  toggleSidePanel: any;
}) => {
  const [showMeaning, setShowMeaning] = useState(false);

  const playAudio = (text: string | undefined) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    speechSynthesis.speak(utterance);
  };

  const handlePrevious = () => {
    setCurrentCardIndex((currentCardIndex - 1 + cards.length) % cards.length);
    setShowMeaning(false);
  };

  const handleNext = () => {
    setCurrentCardIndex((currentCardIndex + 1) % cards.length);
    setShowMeaning(false);
  };

  const currentCard = cards[currentCardIndex];

  return (
    <div style={{ display: "flex", width: "100%", maxWidth: "800px" }}>
      {isSidePanelOpen && (
        <VocabList
          cards={cards}
          setCurrentCardIndex={setCurrentCardIndex}
          currentCardIndex={currentCardIndex}
        />
      )}
      <div style={{ flex: 1, padding: "20px" }}>
        <div
          style={{
            maxWidth: "400px",
            margin: "0 auto",
            //background: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h1 style={{ fontSize: "24px", textAlign: "center" }}>
              Mandarin Flashcards
            </h1>
            <button
              style={{
                background: "#6c757d",
                color: "#fff",
                padding: "6px 12px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={toggleSidePanel}
            >
              {isSidePanelOpen ? "Hide Panel" : "Show Panel"}
            </button>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>
              {currentCard.character}
            </div>
            <button
              style={{
                background: "#007bff",
                color: "#fff",
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                marginRight: "10px",
                cursor: "pointer",
              }}
              onClick={() => playAudio(currentCard.character)}
            >
              Play Character
            </button>
            <button
              style={{
                background: "#007bff",
                color: "#fff",
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => playAudio(currentCard.sentence)}
            >
              Play Sentence
            </button>
            <div style={{ marginTop: "20px" }}>
              <button
                style={{
                  background: "#6c757d",
                  color: "#fff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                onClick={() => setShowMeaning(!showMeaning)}
              >
                {showMeaning ? "Hide" : "Show"} Details
              </button>
            </div>
            {showMeaning && (
              <div style={{ marginTop: "20px", textAlign: "left" }}>
                <p>
                  <strong>Pinyin:</strong> {currentCard.pinyin}
                </p>
                <p>
                  <strong>Meaning:</strong> {currentCard.meaning}
                </p>
                <p>
                  <strong>Sentence:</strong> {currentCard.sentence}
                </p>
                <p>
                  <strong>Sentence Pinyin:</strong> {currentCard.sentencePinyin}
                </p>
                <p>
                  <strong>Sentence Meaning:</strong>{" "}
                  {currentCard.sentenceMeaning}
                </p>
              </div>
            )}
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <button
                style={{
                  background: "#007bff",
                  color: "#fff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                onClick={handlePrevious}
              >
                Previous
              </button>
              <button
                style={{
                  background: "#007bff",
                  color: "#fff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// LearningPage component for tones, pronouns, and pinyin tone marks
const LearningPage = () => {
  const playAudio = (text: string | undefined) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    speechSynthesis.speak(utterance);
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        //background: "#fff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <h1
        style={{ fontSize: "24px", textAlign: "center", marginBottom: "20px" }}
      >
        Tones, Pronouns, and Pinyin
      </h1>

      {/* Tones Section */}
      <div style={{ marginBottom: "30px" }}>
        <h2
          style={{
            fontSize: "20px",
            marginBottom: "10px",
            borderBottom: "1px solid #ccc",
          }}
        >
          Mandarin Tones
        </h2>
        <p style={{ marginBottom: "10px" }}>
          Mandarin has four main tones and a neutral tone. Listen to examples to
          practice pronunciation.
        </p>
        {tonesData.map((item, index) => (
          <div
            key={index}
            style={{
              marginBottom: "15px",
              padding: "10px",
              border: "1px solid #eee",
              borderRadius: "4px",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>
              {item.tone}: {item.character} ({item.pinyin})
            </div>
            <div style={{ fontSize: "14px" }}>Meaning: {item.meaning}</div>
            <button
              style={{
                background: "#007bff",
                color: "#fff",
                padding: "6px 12px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "5px",
              }}
              onClick={() => playAudio(item.character)}
            >
              Play
            </button>
          </div>
        ))}
      </div>

      {/* Pronouns Section */}
      <div style={{ marginBottom: "30px" }}>
        <h2
          style={{
            fontSize: "20px",
            marginBottom: "10px",
            borderBottom: "1px solid #ccc",
          }}
        >
          Pronouns
        </h2>
        <p style={{ marginBottom: "10px" }}>
          Common pronouns with example sentences.
        </p>
        {pronounsData.map((item, index) => (
          <div
            key={index}
            style={{
              marginBottom: "15px",
              padding: "10px",
              border: "1px solid #eee",
              borderRadius: "4px",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>
              {item.character} ({item.pinyin})
            </div>
            <div style={{ fontSize: "14px" }}>Meaning: {item.meaning}</div>
            <div style={{ fontSize: "14px" }}>
              Sentence: {item.sentence} ({item.sentencePinyin})
            </div>
            <div style={{ fontSize: "14px" }}>
              Translation: {item.sentenceMeaning}
            </div>
            <button
              style={{
                background: "#007bff",
                color: "#fff",
                padding: "6px 12px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "5px",
                marginRight: "10px",
              }}
              onClick={() => playAudio(item.character)}
            >
              Play Pronoun
            </button>
            <button
              style={{
                background: "#007bff",
                color: "#fff",
                padding: "6px 12px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "5px",
              }}
              onClick={() => playAudio(item.sentence)}
            >
              Play Sentence
            </button>
          </div>
        ))}
      </div>

      {/* Pinyin Tone Marks Section */}
      <div>
        <h2
          style={{
            fontSize: "20px",
            marginBottom: "10px",
            borderBottom: "1px solid #ccc",
          }}
        >
          Pinyin Tone Marks
        </h2>
        <p
          style={{ marginBottom: "10px" }}
        >{`Pinyin uses tone marks on vowels to indicate tones. The mark is placed on the main vowel (a > e > o > i/u). Listen to examples.`}</p>
        {pinyinData.map((item, index) => (
          <div
            key={index}
            style={{
              marginBottom: "15px",
              padding: "10px",
              border: "1px solid #eee",
              borderRadius: "4px",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>
              {item.tone}: {item.pinyin} ({item.character})
            </div>
            <div style={{ fontSize: "14px" }}>Meaning: {item.meaning}</div>
            <button
              style={{
                background: "#007bff",
                color: "#fff",
                padding: "6px 12px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "5px",
              }}
              onClick={() => playAudio(item.character)}
            >
              Play
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const NavBar = ({ setCurrentPage }: { setCurrentPage: any }) => {
  return (
    <div
      style={{
        //background: "#fff",
        padding: "10px",
        borderBottom: "1px solid #ccc",
        marginBottom: "20px",
        textAlign: "center",
      }}
    >
      <button
        style={{
          background: "#007bff",
          color: "#fff",
          padding: "6px 12px",
          border: "none",
          borderRadius: "4px",
          marginRight: "10px",
          cursor: "pointer",
        }}
        onClick={() => setCurrentPage("flashcards")}
      >
        Flashcards
      </button>
      <button
        style={{
          background: "#007bff",
          color: "#fff",
          padding: "6px 12px",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        onClick={() => setCurrentPage("learning")}
      >
        Tones, Pronouns, Pinyin
      </button>
    </div>
  );
};

type VocabCard = {
  character: string | number | boolean | ReactNode | null | undefined;
  pinyin: string | number | boolean | ReactNode | null | undefined;
  meaning: string | number | boolean | ReactNode | null | undefined;
};
// VocabList component for side panel
function VocabList({
  cards,
  setCurrentCardIndex,
  currentCardIndex,
}: {
  cards: VocabCard[];
  setCurrentCardIndex: (index: number) => void;
  currentCardIndex: number;
}) {
  return (
    <div
      style={{
        width: "200px",
        //background: "#fff",
        padding: "10px",
        borderRight: "1px solid #ccc",
        height: "100vh",
        overflowY: "auto",
      }}
    >
      <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>Vocab List</h2>
      {cards.map((card, index) => (
        <div
          key={index}
          style={{
            padding: "8px",
            cursor: "pointer",
            background: index === currentCardIndex ? "#e0e0e0" : "transparent",
            borderBottom: "1px solid #eee",
          }}
          onClick={() => setCurrentCardIndex(index)}
        >
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>
            {card.character}
          </div>
          <div style={{ fontSize: "14px" }}>{card.pinyin}</div>
          <div style={{ fontSize: "14px", color: "#666" }}>{card.meaning}</div>
        </div>
      ))}
    </div>
  );
}

const tonesData = [
  { tone: "1st (High)", pinyin: "mā", character: "妈", meaning: "mother" },
  { tone: "2nd (Rising)", pinyin: "má", character: "麻", meaning: "hemp" },
  { tone: "3rd (Dipping)", pinyin: "mǎ", character: "马", meaning: "horse" },
  { tone: "4th (Falling)", pinyin: "mà", character: "骂", meaning: "scold" },
  {
    tone: "Neutral",
    pinyin: "ma",
    character: "吗",
    meaning: "question particle",
  },
];

const pronounsData = [
  {
    character: "我",
    pinyin: "wǒ",
    meaning: "I/me",
    sentence: "我爱你",
    sentencePinyin: "wǒ ài nǐ",
    sentenceMeaning: "I love you",
  },
  {
    character: "你",
    pinyin: "nǐ",
    meaning: "you",
    sentence: "你好吗",
    sentencePinyin: "nǐ hǎo ma",
    sentenceMeaning: "Are you good?",
  },
  {
    character: "他/她/它",
    pinyin: "tā",
    meaning: "he/she/it",
    sentence: "他是一名学生",
    sentencePinyin: "tā shì yī míng xuéshēng",
    sentenceMeaning: "He is a student",
  },
];

const pinyinData = [
  { tone: "1st (High)", pinyin: "mā", character: "妈", meaning: "mother" },
  { tone: "2nd (Rising)", pinyin: "má", character: "麻", meaning: "hemp" },
  { tone: "3rd (Dipping)", pinyin: "mǎ", character: "马", meaning: "horse" },
  { tone: "4th (Falling)", pinyin: "mà", character: "骂", meaning: "scold" },
  {
    tone: "Neutral",
    pinyin: "ma",
    character: "吗",
    meaning: "question particle",
  },
];
