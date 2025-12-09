// Utility for conversation responses and text extraction
export function createConversationResponse(conversation, mode) {
  return {
    ...conversation,
    _metadata: {
      mode,
      processedAt: new Date().toISOString(),
    },
  };
}

export function extractTextFromConversation(conversation) {
  if (!conversation || !conversation.turns || !Array.isArray(conversation.turns)) {
    return null;
  }
  const chineseTexts = conversation.turns.map((turn) => {
    let text = turn.text;
    text = text.split("(")[0].split(" -")[0].trim();
    text = text.replace(/[\uff1f\u3002\uff0c\uff01]*$/, "");
    return text;
  });
  const combinedText = chineseTexts.join("。");
  return combinedText;
}
