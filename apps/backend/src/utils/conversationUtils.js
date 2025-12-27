/**
 * Create conversation response metadata
 * @param {Object} conversation - Conversation object
 * @param {string} mode - Processing mode (scaffold/real)
 * @returns {Object} Conversation with metadata
 */
export function createConversationResponse(conversation, mode) {
  return {
    ...conversation,
    _metadata: {
      mode,
      processedAt: new Date().toISOString(),
    },
  };
}

/**
 * Create health check response
 * @param {string} mode - Current conversation mode
 * @param {string} service - Service name
 * @returns {Object} Health check response
 */
export function createHealthResponse(mode, service = "conversation") {
  return {
    status: "ok",
    service,
    mode,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Extract Chinese text from conversation turns for TTS
 * @param {Object} conversation - Conversation object with turns
 * @returns {string|null} Combined Chinese text or null if invalid
 */
export function extractTextFromConversation(conversation) {
  if (!conversation || !conversation.turns || !Array.isArray(conversation.turns)) {
    return null;
  }

  // Extract only the Chinese text from each turn (before any parentheses or dashes)
  const chineseTexts = conversation.turns.map((turn) => {
    let text = turn.text;
    // Remove everything after (phonetics) or - translation
    text = text.split("(")[0].split(" -")[0].trim();
    // Remove any trailing punctuation like ? or .
    text = text.replace(/[？。，！]*$/, "");
    return text;
  });

  const combinedText = chineseTexts.join("。");
  console.log(`[AudioProcessor] Extracted Chinese text from conversation: ${combinedText}`);
  return combinedText;
}
