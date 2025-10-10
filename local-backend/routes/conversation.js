const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const router = express.Router();

// Environment gate - only active when explicitly enabled
const CONVERSATION_ENABLED = process.env.USE_CONVERSATION === "true";

if (!CONVERSATION_ENABLED) {
  console.log("Conversation scaffolder disabled. Set USE_CONVERSATION=true to enable.");
  module.exports = router;
}

// Fixture loading with caching
const fixtureCache = new Map();
const FIXTURES_PATH = path.join(process.cwd(), "public/data/examples/conversations/fixtures");

function shortHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 6);
}

function enforceTurns(turns) {
  if (!Array.isArray(turns)) return [];
  if (turns.length < 3) {
    // Repeat last turn to reach 3
    const last = turns[turns.length - 1] || {};
    while (turns.length < 3) turns.push({ ...last });
  }
  if (turns.length > 5) {
    return turns.slice(0, 5);
  }
  return turns;
}

async function loadFixture(wordId, generatorVersion = "v1") {
  if (fixtureCache.has(wordId)) {
    return fixtureCache.get(wordId);
  }

  try {
    // Try specific fixture first, fall back to default
    const fixtureFile = `${wordId}-basic.json`;
    const fixturePath = path.join(FIXTURES_PATH, fixtureFile);

    let data;
    try {
      data = await fs.readFile(fixturePath, "utf8");
    } catch (err) {
      // Fallback to generic hello fixture
      const fallbackPath = path.join(FIXTURES_PATH, "hello-basic.json");
      data = await fs.readFile(fallbackPath, "utf8");
    }

    const fixture = JSON.parse(data);
    const turns = enforceTurns(fixture.turns);
    const id = `${wordId}-${generatorVersion}-${shortHash(wordId + generatorVersion)}`;

    const customized = {
      ...fixture,
      id,
      wordId,
      word: wordId, // In real implementation, would lookup actual word
      turns,
      generatedAt: new Date().toISOString(),
      generatorVersion,
    };

    fixtureCache.set(wordId, customized);
    return customized;
  } catch (error) {
    throw new Error(`Failed to load fixture for wordId: ${wordId}`);
  }
}

// GET endpoint for simple requests
router.get("/scaffold/conversation", async (req, res) => {
  try {
    const { wordId, generatorVersion = "v1" } = req.query;

    if (!wordId) {
      return res.status(400).json({
        error: "wordId parameter is required",
      });
    }

    const conversation = await loadFixture(wordId, generatorVersion);

    // Simulate network delay for realistic testing
    await new Promise((resolve) => setTimeout(resolve, 50));

    res.json(conversation);
  } catch (error) {
    console.error("Scaffolder error:", error);
    res.status(500).json({
      error: "Failed to generate conversation",
      message: error.message,
    });
  }
});

// POST endpoint matching production API
router.post("/scaffold/conversation", async (req, res) => {
  try {
    const { wordId, word, generatorVersion = "v1" } = req.body;

    if (!wordId) {
      return res.status(400).json({
        error: "wordId is required in request body",
      });
    }

    const conversation = await loadFixture(wordId, generatorVersion);

    // Override with request parameters
    const response = {
      ...conversation,
      wordId,
      word: word || wordId,
      generatorVersion,
      generatedAt: new Date().toISOString(),
    };

    // Ensure turns is 3-5
    response.turns = enforceTurns(response.turns);

    // Ensure id pattern
    response.id = `${wordId}-${generatorVersion}-${shortHash(wordId + generatorVersion)}`;

    res.json(response);
  } catch (error) {
    console.error("Scaffolder error:", error);
    res.status(500).json({
      error: "Failed to generate conversation",
      message: error.message,
    });
  }
});

// Health check endpoint
router.get("/scaffold/health", (req, res) => {
  res.json({
    status: "ok",
    service: "conversation-scaffolder",
    enabled: CONVERSATION_ENABLED,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
