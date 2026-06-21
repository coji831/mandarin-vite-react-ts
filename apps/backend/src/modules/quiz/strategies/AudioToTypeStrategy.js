/**
 * @file apps/backend/src/modules/quiz/strategies/AudioToTypeStrategy.js
 * Audio-to-Type quiz strategy for Phase 1 Gate.
 * Generates questions and validates answers for pinyin + tone recognition.
 */
export const audioToTypeStrategy = {
  type: "audio-to-type",
  questionCount: 20,
  passThreshold: 0.9,
  timeLimitMinutes: 2.5,

  /**
   * @param {string} userId
   * @returns {Promise<Array<{id: string, audioKey: string, correctPinyin: string, correctTone: number, category: string}>>}
   */
  async generateQuestions(userId) {
    // For Phase 1, returns shuffled mock questions.
    // Future: generate from real pinyin/tones data.
    const MOCK_QUESTIONS = [
      {
        id: "q1",
        audioKey: "mā",
        correctPinyin: "ma",
        correctTone: 1,
        category: "pinyin",
        displayPinyin: "mā",
      },
      {
        id: "q2",
        audioKey: "má",
        correctPinyin: "ma",
        correctTone: 2,
        category: "tones",
        displayPinyin: "má",
      },
      {
        id: "q3",
        audioKey: "mǎ",
        correctPinyin: "ma",
        correctTone: 3,
        category: "tones",
        displayPinyin: "mǎ",
      },
      {
        id: "q4",
        audioKey: "mà",
        correctPinyin: "ma",
        correctTone: 4,
        category: "tones",
        displayPinyin: "mà",
      },
      {
        id: "q5",
        audioKey: "ma",
        correctPinyin: "ma",
        correctTone: 0,
        category: "tones",
        displayPinyin: "ma",
      },
      {
        id: "q6",
        audioKey: "bō",
        correctPinyin: "bo",
        correctTone: 1,
        category: "pinyin",
        displayPinyin: "bō",
      },
      {
        id: "q7",
        audioKey: "pà",
        correctPinyin: "pa",
        correctTone: 4,
        category: "pairs",
        displayPinyin: "pà",
      },
      {
        id: "q8",
        audioKey: "dā",
        correctPinyin: "da",
        correctTone: 1,
        category: "pinyin",
        displayPinyin: "dā",
      },
      {
        id: "q9",
        audioKey: "tǐ",
        correctPinyin: "ti",
        correctTone: 3,
        category: "rules",
        displayPinyin: "tǐ",
      },
      {
        id: "q10",
        audioKey: "kù",
        correctPinyin: "ku",
        correctTone: 4,
        category: "pairs",
        displayPinyin: "kù",
      },
      {
        id: "q11",
        audioKey: "gē",
        correctPinyin: "ge",
        correctTone: 1,
        category: "pinyin",
        displayPinyin: "gē",
      },
      {
        id: "q12",
        audioKey: "hú",
        correctPinyin: "hu",
        correctTone: 2,
        category: "pairs",
        displayPinyin: "hú",
      },
      {
        id: "q13",
        audioKey: "jī",
        correctPinyin: "ji",
        correctTone: 1,
        category: "rules",
        displayPinyin: "jī",
      },
      {
        id: "q14",
        audioKey: "qù",
        correctPinyin: "qu",
        correctTone: 4,
        category: "rules",
        displayPinyin: "qù",
      },
      {
        id: "q15",
        audioKey: "xū",
        correctPinyin: "xu",
        correctTone: 1,
        category: "rules",
        displayPinyin: "xū",
      },
      {
        id: "q16",
        audioKey: "zhī",
        correctPinyin: "zhi",
        correctTone: 1,
        category: "pinyin",
        displayPinyin: "zhī",
      },
      {
        id: "q17",
        audioKey: "chǐ",
        correctPinyin: "chi",
        correctTone: 3,
        category: "pairs",
        displayPinyin: "chǐ",
      },
      {
        id: "q18",
        audioKey: "shì",
        correctPinyin: "shi",
        correctTone: 4,
        category: "pairs",
        displayPinyin: "shì",
      },
      {
        id: "q19",
        audioKey: "rì",
        correctPinyin: "ri",
        correctTone: 4,
        category: "pinyin",
        displayPinyin: "rì",
      },
      {
        id: "q20",
        audioKey: "zǐ",
        correctPinyin: "zi",
        correctTone: 3,
        category: "rules",
        displayPinyin: "zǐ",
      },
    ];
    // Fisher-Yates shuffle so each attempt is different
    for (let i = MOCK_QUESTIONS.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [MOCK_QUESTIONS[i], MOCK_QUESTIONS[j]] = [MOCK_QUESTIONS[j], MOCK_QUESTIONS[i]];
    }
    return MOCK_QUESTIONS;
  },

  /**
   * @param {object} question
   * @param {string} question.correctPinyin
   * @param {number} question.correctTone
   * @param {string} answer.pinyin
   * @param {number} answer.tone
   * @returns {{correct: boolean, feedback: string}}
   */
  validateAnswer(question, { pinyin, tone }) {
    const pinyinCorrect = pinyin.trim().toLowerCase() === question.correctPinyin.toLowerCase();
    const toneCorrect = tone === question.correctTone;
    const correct = pinyinCorrect && toneCorrect;
    let feedback;
    if (correct) {
      feedback = `Correct! "${question.displayPinyin || question.correctPinyin}".`;
    } else if (!pinyinCorrect && !toneCorrect) {
      feedback = `Both pinyin and tone were incorrect. The audio was "${question.displayPinyin || question.correctPinyin}".`;
    } else if (!pinyinCorrect) {
      feedback = `Pinyin was incorrect. The audio was "${question.displayPinyin || question.correctPinyin}".`;
    } else {
      feedback = `Tone was incorrect. The audio was "${question.displayPinyin || question.correctPinyin}".`;
    }
    return { correct, feedback };
  },
};
