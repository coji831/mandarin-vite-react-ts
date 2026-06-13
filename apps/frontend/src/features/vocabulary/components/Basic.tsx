/**
 * Basic component
 *
 * - Displays Mandarin tones, pronouns, and pinyin tone marks with examples.
 * - Provides audio playback for characters and sentences.
 * - Pure presentational; does not manage state or persistence.
 * - Used as a reference/learning resource page.
 */
import { useAudioPlayback } from "../hooks";
export { Basic };

// LearningPage component for tones, pronouns, and pinyin tone marks
const Basic = () => {
  const { playWordAudio } = useAudioPlayback();

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
      <h1 style={{ fontSize: "24px", textAlign: "center", marginBottom: "20px" }}>
        Tones, Pronouns, and Pinyin
      </h1>

      {/* Tones */}
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
          Mandarin has four main tones and a neutral tone. Listen to examples to practice
          pronunciation.
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
              onClick={() => playWordAudio({ chinese: item.character })}
            >
              Play
            </button>
          </div>
        ))}
      </div>

      {/* Pronouns */}
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
        <p style={{ marginBottom: "10px" }}>Common pronouns with example sentences.</p>
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
            <div style={{ fontSize: "14px" }}>Translation: {item.sentenceMeaning}</div>
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
              onClick={() => playWordAudio({ chinese: item.character })}
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
              onClick={() => playWordAudio({ chinese: item.sentence })}
            >
              Play Sentence
            </button>
          </div>
        ))}
      </div>

      {/* Pinyin Tone Marks */}
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
              onClick={() => playWordAudio({ chinese: item.character })}
            >
              Play
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

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
