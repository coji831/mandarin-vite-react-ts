// Utility functions for prompt creation and related helpers

/**
 * Build a full conversation prompt for Gemini API
 * @param {string|null|undefined} word - Word text to include in prompt
 * @returns {string} Complete prompt text to send to Gemini API
 */
export function createConversationPrompt(word) {
  const basePrompt = `Generate a short Mandarin conversation using ${word}`;

  return `${basePrompt}. Please respond with a simple conversation in this format:
A: [first speaker line]
B: [second speaker line]
A: [third speaker line]
B: [fourth speaker line]

Keep it conversational and natural, with exactly 4 lines total. Only use Mandarin Chinese characters—do not include pinyin, English, or any translations.`;
}

export default {
  createConversationPrompt,
};
