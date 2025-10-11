// Generator endpoint for Story 8.5: Text generation & cache
import express from "express";
import {
  getConversationFromCache,
  storeConversationInCache,
  generateConversation,
  computePromptHash,
} from "../utils/conversationGenerator.js";
const router = express.Router();

// POST /generator
router.post("/", async (req, res) => {
  try {
    const { wordId, prompt, generatorVersion = "v1" } = req.body;
    if (!wordId || !prompt) {
      return res.status(400).json({ error: "Missing wordId or prompt" });
    }
    const promptHash = computePromptHash(prompt, generatorVersion);
    // Try cache lookup
    let convo = await getConversationFromCache(wordId, generatorVersion, promptHash);
    if (!convo) {
      // Generate new conversation
      convo = await generateConversation(wordId, prompt, generatorVersion);
      convo.generatedAt = new Date().toISOString();
      convo.id = `${wordId}-${generatorVersion}-${promptHash}`;
      await storeConversationInCache(wordId, generatorVersion, promptHash, convo);
    }
    return res.json(convo);
  } catch (err) {
    console.error("Generator error:", err);
    return res.status(500).json({ error: "Failed to generate conversation" });
  }
});

export default router;
