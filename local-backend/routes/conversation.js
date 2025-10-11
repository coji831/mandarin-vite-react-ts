// Unified conversation endpoint following code conventions
// Switches between scaffold and real mode based on CONVERSATION_MODE env var
import express from "express";
import { ROUTE_PATTERNS } from "../../shared/constants/apiPaths.js";
import { computeHash } from "../utils/hashUtils.js";
import { handleGetRealText, handleGetRealAudio } from "../utils/conversationProcessor.js";
import { handleGetScaffoldText, getScaffoldAudioMetadata } from "../utils/scaffoldUtils.js";
import { createConversationResponse } from "../utils/conversationUtils.js";

const router = express.Router();

// Environment configuration
const CONVERSATION_MODE = process.env.CONVERSATION_MODE;

// New POST endpoints for conversation text generation
// POST /conversation/text/generate - primary generation endpoint
router.post(ROUTE_PATTERNS.conversationTextGenerate, async (req, res) => {
  try {
    // Only accept wordId in the request body
    const { wordId, word } = req.body || {};

    if (!wordId) {
      return res.status(400).json({ error: "wordId is required in request body" });
    }

    let conversation;

    if (CONVERSATION_MODE === "scaffold") {
      conversation = await handleGetScaffoldText(wordId);
    } else {
      conversation = await handleGetRealText(wordId, word);
    }

    res.json(createConversationResponse(conversation, CONVERSATION_MODE));
  } catch (error) {
    console.error("[Conversation] Error:", error);
    res.status(500).json({
      error: "Failed to generate conversation",
      message: error.message,
    });
  }
});

router.post(ROUTE_PATTERNS.conversationAudioGenerate, async (req, res) => {
  try {
    // Only accept wordId in the body. Hash is computed internally.
    let { wordId, voice = "cmn-CN-Standard-A", bitrate = 128, format = "url" } = req.body || {};

    if (!wordId) {
      return res.status(400).json({ error: "wordId is required in request body" });
    }

    // Branch logic: scaffold mode returns fixture data directly;
    // real mode checks cache then generates
    if (CONVERSATION_MODE === "scaffold") {
      const audioMetadata = await getScaffoldAudioMetadata(wordId, format);
      return res.json({ ...audioMetadata, voice, bitrate, cached: Math.random() > 0.3 });
    } else {
      const audioMetadata = await handleGetRealAudio({ wordId, voice, bitrate });
      return res.json(audioMetadata);
    }
  } catch (error) {
    console.error("[Audio] Error:", error);
    res.status(500).json({ error: "Failed to generate audio", message: error.message });
  }
});

export default router;
