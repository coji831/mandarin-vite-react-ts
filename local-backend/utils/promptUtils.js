// Utility functions for prompt creation and related helpers

/**
 * Build a conversation prompt with sensible fallback
 * @param {string|null|undefined} word - Word text to include in prompt
 * @returns {string} Final prompt text to send to generator
 */
export function createConversationPrompt(word) {
  return `Generate a short Mandarin conversation using ${word}`;
}

export default {
  createConversationPrompt,
};
