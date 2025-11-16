// Utility functions for prompt creation and related helpers

/**
 * Build a full conversation prompt for Gemini API
 * @param {string|null|undefined} word - Word text to include in prompt
 * @returns {string} Complete prompt text to send to Gemini API
 */

/**
 * Build a full conversation prompt for Gemini API
 * @param {string|null|undefined} word - Word text to include in prompt
 * @param {object} [options] - Optional prompt options
 * @param {boolean} [options.requireRichTurn] - If true, request Chinese, pinyin, and English for each turn
 * @returns {string} Complete prompt text to send to Gemini API
 */
export function createConversationPrompt(word, options = {}) {
  const basePrompt = `Generate a short Mandarin conversation using the word "${word}".`;
  if (options.requireRichTurn) {
    return `${basePrompt}\n\nFor each turn, provide:\n- Chinese (characters)\n- Pinyin (phonetic transcription)\n- English (translation)\n\nFormat:\nA: <Chinese> | <Pinyin> | <English>\nB: <Chinese> | <Pinyin> | <English>\nA: <Chinese> | <Pinyin> | <English>\nB: <Chinese> | <Pinyin> | <English>\n\nKeep it conversational and natural, 3-5 turns, each turn 1-2 short sentences. Do not add any extra commentary or explanation.`;
  }
  return `${basePrompt}. Please respond with a simple conversation in this format:\nA: [first speaker line]\nB: [second speaker line]\nA: [third speaker line]\nB: [fourth speaker line]\n\nKeep it conversational and natural, with exactly 4 lines total. Only use Mandarin Chinese characters—do not include pinyin, English, or any translations.`;
}

export default {
  createConversationPrompt,
};
